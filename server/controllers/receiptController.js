import { db } from '../database/db.js';

export async function getReceiptById(req, res) {
  try {
    const { id } = req.params;
    const receipt = await db.get('SELECT * FROM receipts WHERE id = ?', [id]);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'पावती सापडली नाही / Receipt not found.' });
    }

    const mandal = await db.get('SELECT * FROM mandal_settings LIMIT 1');

    return res.json({
      success: true,
      data: {
        receipt,
        mandal
      }
    });
  } catch (err) {
    console.error('getReceiptById error:', err);
    return res.status(500).json({ success: false, message: 'पावती मिळवताना त्रुटी.' });
  }
}

export async function getReceiptByNumber(req, res) {
  try {
    const { receiptNumber } = req.params;
    const receipt = await db.get('SELECT * FROM receipts WHERE receipt_number = ?', [receiptNumber]);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'पावती सापडली नाही.' });
    }

    const mandal = await db.get('SELECT * FROM mandal_settings LIMIT 1');

    return res.json({
      success: true,
      data: {
        receipt,
        mandal
      }
    });
  } catch (err) {
    console.error('getReceiptByNumber error:', err);
    return res.status(500).json({ success: false, message: 'पावती मिळवताना त्रुटी.' });
  }
}

export async function getAllReceipts(req, res) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (receipt_number LIKE ? OR donor_name LIKE ? OR mobile LIKE ?)';
      const s = `%${search.trim()}%`;
      params = [s, s, s];
    }

    const countRow = await db.get(`SELECT COUNT(*) as total FROM receipts ${whereClause}`, params);
    const receipts = await db.all(
      `SELECT * FROM receipts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      data: receipts,
      pagination: {
        total: countRow.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRow.total / Number(limit)) || 1
      }
    });
  } catch (err) {
    console.error('getAllReceipts error:', err);
    return res.status(500).json({ success: false, message: 'पावत्यांची यादी मिळवताना त्रुटी.' });
  }
}

export async function verifyPublicReceipt(req, res) {
  try {
    const { identifier } = req.params; // Can be receipt_number or verification_code
    const receipt = await db.get(
      'SELECT id, receipt_number, donor_name, amount, payment_method, category, purpose, collector_name, verification_code, created_at FROM receipts WHERE receipt_number = ? OR verification_code = ?',
      [identifier.trim(), identifier.trim()]
    );

    if (!receipt) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'ही पावती अवैध आहे किंवा सिस्टीममध्ये अस्तित्वात नाही / Invalid receipt. Not found in system.'
      });
    }

    const mandal = await db.get('SELECT name_mr, name_en, registration_no, festival_year, address_mr, contact_phone FROM mandal_settings LIMIT 1');

    // Redact donor full name for privacy if desirable, e.g. show first name & last initial or safe name
    const nameParts = receipt.donor_name.split(' ');
    const safeName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}***` : receipt.donor_name;

    return res.json({
      success: true,
      valid: true,
      data: {
        receiptNumber: receipt.receipt_number,
        verificationCode: receipt.verification_code,
        donorNameSafe: safeName,
        amount: receipt.amount,
        paymentMethod: receipt.payment_method,
        category: receipt.category,
        purpose: receipt.purpose,
        date: receipt.created_at,
        mandal: {
          nameMr: mandal.name_mr,
          nameEn: mandal.name_en,
          registrationNo: mandal.registration_no,
          festivalYear: mandal.festival_year,
          address: mandal.address_mr
        }
      }
    });
  } catch (err) {
    console.error('verifyPublicReceipt error:', err);
    return res.status(500).json({ success: false, message: 'पडताळणी करताना त्रुटी.' });
  }
}
