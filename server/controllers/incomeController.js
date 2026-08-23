import { db } from '../database/db.js';
import { numberToWordsMarathi, numberToWordsEnglish } from '../utils/marathiNumberWords.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getIncomeList(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      payment_method = '',
      startDate = '',
      endDate = '',
      donor_id = ''
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereConditions = ['is_deleted = 0'];
    let params = [];

    if (search) {
      whereConditions.push('(donor_name LIKE ? OR mobile LIKE ? OR receipt_number LIKE ? OR transaction_id LIKE ? OR address LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (payment_method) {
      whereConditions.push('payment_method = ?');
      params.push(payment_method);
    }

    if (donor_id) {
      whereConditions.push('donor_id = ?');
      params.push(donor_id);
    }

    if (startDate) {
      whereConditions.push('date(created_at) >= date(?)');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('date(created_at) <= date(?)');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRow = await db.get(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM income_transactions ${whereClause}`,
      params
    );

    const transactions = await db.all(
      `SELECT * FROM income_transactions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      data: transactions,
      pagination: {
        total: countRow.total,
        totalAmount: countRow.total_amount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRow.total / Number(limit)) || 1
      }
    });
  } catch (err) {
    console.error('getIncomeList error:', err);
    return res.status(500).json({ success: false, message: 'जमा रकमेची यादी मिळवताना त्रुटी' });
  }
}

export async function createIncome(req, res) {
  try {
    const {
      donor_name,
      mobile = '',
      email = '',
      address = '',
      area = '',
      amount,
      payment_method = 'cash',
      category = 'vargani',
      purpose = 'गणेशोत्सव वर्गणी',
      notes = '',
      donor_id = null
    } = req.body;

    const parsedAmount = Number(amount);
    if (!donor_name || !donor_name.trim()) {
      return res.status(400).json({ success: false, message: 'देणगीदाराचे / व्यक्तीचे नाव आवश्यक आहे.' });
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'कृपया वैध रक्कम भरा (Amount must be > 0).' });
    }

    // 1. Fetch Mandal Settings for receipt prefix and festival year
    const mandal = await db.get('SELECT * FROM mandal_settings LIMIT 1') || {
      receipt_prefix: 'GM-2026-',
      festival_year: 2026
    };

    // 2. Find or Create Donor
    let finalDonorId = donor_id;
    if (!finalDonorId && mobile && mobile.trim()) {
      const existingDonor = await db.get('SELECT id FROM donors WHERE mobile = ? LIMIT 1', [mobile.trim()]);
      if (existingDonor) {
        finalDonorId = existingDonor.id;
      }
    }

    if (!finalDonorId) {
      const newDonorRes = await db.run(`
        INSERT INTO donors (name, mobile, email, address, area, total_donated, donations_count, last_donated_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?)
      `, [
        donor_name.trim(),
        mobile ? mobile.trim() : '',
        email ? email.trim() : '',
        address ? address.trim() : '',
        area ? area.trim() : '',
        parsedAmount,
        notes ? notes.trim() : ''
      ]);
      finalDonorId = newDonorRes.lastID;
    } else {
      await db.run(`
        UPDATE donors 
        SET total_donated = total_donated + ?, 
            donations_count = donations_count + 1,
            last_donated_at = CURRENT_TIMESTAMP,
            name = COALESCE(NULLIF(?, ''), name),
            address = COALESCE(NULLIF(?, ''), address)
        WHERE id = ?
      `, [parsedAmount, donor_name.trim(), address ? address.trim() : '', finalDonorId]);
    }

    // 3. Generate Unique Transaction ID & Receipt Number
    const countRow = await db.get('SELECT COUNT(*) as count FROM income_transactions');
    const nextNum = (countRow.count || 0) + 1;
    const formattedNum = String(nextNum).padStart(6, '0');
    const receiptPrefix = mandal.receipt_prefix || 'GM-2026-';
    const receiptNumber = `${receiptPrefix}${formattedNum}`;
    const transactionId = `TXN-${mandal.festival_year || 2026}-${formattedNum}`;

    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const wordsMr = numberToWordsMarathi(parsedAmount);
    const wordsEn = numberToWordsEnglish(parsedAmount);
    const collectorName = req.user ? req.user.name : 'स्वयंसेवक';
    const collectedById = req.user ? req.user.id : null;

    // 4. Insert Income Transaction
    const incRes = await db.run(`
      INSERT INTO income_transactions (
        transaction_id, donor_id, donor_name, mobile, address, amount,
        payment_method, category, purpose, notes, collected_by_id, collector_name,
        receipt_number, attachment_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `, [
      transactionId, finalDonorId, donor_name.trim(), mobile ? mobile.trim() : '',
      address ? address.trim() : '', parsedAmount, payment_method, category,
      purpose ? purpose.trim() : '', notes ? notes.trim() : '',
      collectedById, collectorName, receiptNumber, attachmentUrl
    ]);

    const txDbId = incRes.lastID;
    const verificationCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 5. Insert Digital Receipt
    const receiptRes = await db.run(`
      INSERT INTO receipts (
        receipt_number, transaction_id, donor_name, mobile, address,
        amount, amount_in_words_mr, amount_in_words_en, payment_method,
        category, purpose, collector_name, verification_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      receiptNumber, txDbId, donor_name.trim(), mobile ? mobile.trim() : '',
      address ? address.trim() : '', parsedAmount, wordsMr, wordsEn, payment_method,
      category, purpose ? purpose.trim() : '', collectorName, verificationCode
    ]);

    await db.run('UPDATE income_transactions SET receipt_id = ? WHERE id = ?', [receiptRes.lastID, txDbId]);

    const fullReceipt = await db.get('SELECT * FROM receipts WHERE id = ?', [receiptRes.lastID]);

    // 6. Log Audit
    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'CREATE',
      entity: 'INCOME',
      entityId: transactionId,
      descriptionMr: `${donor_name.trim()} यांच्याकडून ₹${parsedAmount.toLocaleString('en-IN')} ${category === 'vargani' ? 'वर्गणी' : 'जमा'} नोंदवली (पावती क्र: ${receiptNumber}).`,
      descriptionEn: `Recorded income of ₹${parsedAmount.toLocaleString('en-IN')} from ${donor_name.trim()} (Receipt: ${receiptNumber}).`,
      newValues: { transactionId, receiptNumber, amount: parsedAmount, donor_name, payment_method, category },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'जमा रक्कम यशस्वीरित्या नोंदवली व पावती तयार झाली! / Income recorded & receipt generated!',
      data: {
        transactionId,
        receiptNumber,
        amount: parsedAmount,
        receipt: fullReceipt
      }
    });
  } catch (err) {
    console.error('createIncome error:', err);
    return res.status(500).json({ success: false, message: 'जमा रक्कम नोंदवताना त्रुटी निर्माण झाली.' });
  }
}

export async function deleteIncome(req, res) {
  try {
    const { id } = req.params;
    const tx = await db.get('SELECT * FROM income_transactions WHERE id = ? AND is_deleted = 0', [id]);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'व्यवहार सापडला नाही.' });
    }

    await db.run('UPDATE income_transactions SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    // Deduct from donor total
    if (tx.donor_id) {
      await db.run(`
        UPDATE donors 
        SET total_donated = MAX(0, total_donated - ?),
            donations_count = MAX(0, donations_count - 1)
        WHERE id = ?
      `, [tx.amount, tx.donor_id]);
    }

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'DELETE',
      entity: 'INCOME',
      entityId: tx.transaction_id,
      descriptionMr: `${req.user?.name} यांनी जमा व्यवहार ${tx.transaction_id} (रक्कम ₹${tx.amount}) हटवला.`,
      descriptionEn: `Deleted income transaction ${tx.transaction_id} (₹${tx.amount}).`,
      oldValues: tx,
      req
    });

    return res.json({
      success: true,
      message: 'व्यवहार यशस्वीरित्या हटवला / Transaction deleted successfully.'
    });
  } catch (err) {
    console.error('deleteIncome error:', err);
    return res.status(500).json({ success: false, message: 'व्यवहार हटवताना त्रुटी.' });
  }
}
