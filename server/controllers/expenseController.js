import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getExpenseList(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      status = '',
      payment_method = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereConditions = ['is_deleted = 0'];
    let params = [];

    if (search) {
      whereConditions.push('(description LIKE ? OR paid_to LIKE ? OR bill_number LIKE ? OR expense_id LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (payment_method) {
      whereConditions.push('payment_method = ?');
      params.push(payment_method);
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
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
       FROM expense_transactions ${whereClause}`,
      params
    );

    const expenses = await db.all(
      `SELECT * FROM expense_transactions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      data: expenses,
      summary: {
        total: countRow.total,
        totalAmount: countRow.total_amount,
        approvedAmount: countRow.approved_amount,
        pendingAmount: countRow.pending_amount
      },
      pagination: {
        total: countRow.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRow.total / Number(limit)) || 1
      }
    });
  } catch (err) {
    console.error('getExpenseList error:', err);
    return res.status(500).json({ success: false, message: 'खर्च यादी मिळवताना त्रुटी' });
  }
}

export async function createExpense(req, res) {
  try {
    const {
      category,
      description,
      amount,
      payment_method = 'cash',
      paid_to,
      bill_number = '',
      notes = '',
      status: requestedStatus
    } = req.body;

    const parsedAmount = Number(amount);
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'खर्चाचे वर्णन आवश्यक आहे.' });
    }

    if (!paid_to || !paid_to.trim()) {
      return res.status(400).json({ success: false, message: 'कोणाला पैसे दिले ते नाव आवश्यक आहे.' });
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'कृपया वैध रक्कम भरा (Amount must be > 0).' });
    }

    // Role-based default status
    const isApprover = ['admin', 'treasurer'].includes(req.user?.role);
    let status = 'pending';
    let approvedByName = null;
    let approvedById = null;
    let approvedAt = null;

    if (isApprover) {
      status = requestedStatus && ['approved', 'paid', 'pending'].includes(requestedStatus) ? requestedStatus : 'approved';
      if (status === 'approved' || status === 'paid') {
        approvedByName = req.user.name;
        approvedById = req.user.id;
        approvedAt = new Date().toISOString();
      }
    }

    const countRow = await db.get('SELECT COUNT(*) as count FROM expense_transactions');
    const nextNum = (countRow.count || 0) + 1;
    const formattedNum = String(nextNum).padStart(5, '0');
    const expenseId = `EXP-2026-${formattedNum}`;
    const billAttachmentUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const expRes = await db.run(`
      INSERT INTO expense_transactions (
        expense_id, category, description, amount, payment_method, paid_to,
        bill_number, bill_attachment_url, status, requested_by_id, requested_by_name,
        approved_by_id, approved_by_name, approved_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      expenseId, category, description.trim(), parsedAmount, payment_method, paid_to.trim(),
      bill_number ? bill_number.trim() : '', billAttachmentUrl, status,
      req.user?.id, req.user?.name, approvedById, approvedByName, approvedAt, notes ? notes.trim() : ''
    ]);

    const createdExpense = await db.get('SELECT * FROM expense_transactions WHERE id = ?', [expRes.lastID]);

    // If status is pending, create a notification for admin/treasurer
    if (status === 'pending') {
      await db.run(`
        INSERT INTO notifications (user_id, title_mr, title_en, message_mr, message_en, type, link)
        VALUES (NULL, 'नवीन खर्च मंजुरीसाठी प्रलंबित', 'Expense Pending Approval', ?, ?, 'warning', '/approvals')
      `, [
        `${req.user?.name} यांनी ₹${parsedAmount.toLocaleString('en-IN')} खर्चाची नोंद केली (${description.trim()}). मंजुरी बाकी आहे.`,
        `${req.user?.name} recorded expense of ₹${parsedAmount.toLocaleString('en-IN')} (${description.trim()}). Pending approval.`
      ]);
    }

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'CREATE',
      entity: 'EXPENSE',
      entityId: expenseId,
      descriptionMr: `${req.user?.name} यांनी ₹${parsedAmount.toLocaleString('en-IN')} खर्च नोंदवला (${description.trim()}). स्थिती: ${status}.`,
      descriptionEn: `Created expense ${expenseId} of ₹${parsedAmount.toLocaleString('en-IN')}. Status: ${status}.`,
      newValues: createdExpense,
      req
    });

    return res.status(201).json({
      success: true,
      message: status === 'pending'
        ? 'खर्च यशस्वीरित्या नोंदवला व मंजुरीसाठी पाठवला आहे / Expense recorded and sent for approval.'
        : 'खर्च यशस्वीरित्या नोंदवला व मंजूर झाला / Expense recorded and approved.',
      data: createdExpense
    });
  } catch (err) {
    console.error('createExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च नोंदवताना त्रुटी निर्माण झाली.' });
  }
}

export async function approveExpense(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const expense = await db.get('SELECT * FROM expense_transactions WHERE id = ? AND is_deleted = 0', [id]);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'खर्च व्यवहार सापडला नाही.' });
    }

    await db.run(`
      UPDATE expense_transactions 
      SET status = 'approved',
          approved_by_id = ?,
          approved_by_name = ?,
          approved_at = CURRENT_TIMESTAMP,
          notes = CASE WHEN ? != '' THEN ? ELSE notes END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, req.user.name, notes ? notes.trim() : '', notes ? notes.trim() : '', id]);

    const updated = await db.get('SELECT * FROM expense_transactions WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'APPROVE',
      entity: 'EXPENSE',
      entityId: expense.expense_id,
      descriptionMr: `${req.user.name} यांनी खर्च ${expense.expense_id} (रक्कम ₹${expense.amount}) मंजूर केला.`,
      descriptionEn: `Approved expense ${expense.expense_id} (₹${expense.amount}).`,
      oldValues: { status: expense.status },
      newValues: { status: 'approved' },
      req
    });

    return res.json({
      success: true,
      message: 'खर्च यशस्वीरित्या मंजूर करण्यात आला / Expense approved successfully.',
      data: updated
    });
  } catch (err) {
    console.error('approveExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च मंजूर करताना त्रुटी.' });
  }
}

export async function rejectExpense(req, res) {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    const expense = await db.get('SELECT * FROM expense_transactions WHERE id = ? AND is_deleted = 0', [id]);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'खर्च व्यवहार सापडला नाही.' });
    }

    await db.run(`
      UPDATE expense_transactions 
      SET status = 'rejected',
          notes = COALESCE(notes || ' | ', '') || 'नामंजूर करण्याचे कारण: ' || ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason.trim() || 'नाही', id]);

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'REJECT',
      entity: 'EXPENSE',
      entityId: expense.expense_id,
      descriptionMr: `${req.user.name} यांनी खर्च ${expense.expense_id} नामंजूर केला. कारण: ${reason}`,
      descriptionEn: `Rejected expense ${expense.expense_id}. Reason: ${reason}`,
      oldValues: { status: expense.status },
      newValues: { status: 'rejected', reason },
      req
    });

    return res.json({
      success: true,
      message: 'खर्च नामंजूर करण्यात आला / Expense rejected.'
    });
  } catch (err) {
    console.error('rejectExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च नामंजूर करताना त्रुटी.' });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const expense = await db.get('SELECT * FROM expense_transactions WHERE id = ? AND is_deleted = 0', [id]);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'खर्च व्यवहार सापडला नाही.' });
    }

    await db.run('UPDATE expense_transactions SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE',
      entity: 'EXPENSE',
      entityId: expense.expense_id,
      descriptionMr: `${req.user.name} यांनी खर्च व्यवहार ${expense.expense_id} हटवला.`,
      descriptionEn: `Deleted expense transaction ${expense.expense_id}.`,
      oldValues: expense,
      req
    });

    return res.json({
      success: true,
      message: 'खर्च यशस्वीरित्या हटवला / Expense deleted successfully.'
    });
  } catch (err) {
    console.error('deleteExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च हटवताना त्रुटी.' });
  }
}
