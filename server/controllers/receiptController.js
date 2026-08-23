import { db } from '../database/db.js';
import { safeSearchTerm, throwIfError } from '../utils/dbHelpers.js';

async function getMandal(select = '*') {
  const { data, error } = await db.from('mandal_settings').select(select).limit(1).maybeSingle();
  throwIfError(error);
  return data;
}

export async function getReceiptById(req, res) {
  try {
    const { data: receipt, error } = await db.from('receipts').select('*').eq('id', req.params.id).maybeSingle();
    throwIfError(error);
    if (!receipt) return res.status(404).json({ success: false, message: 'पावती सापडली नाही / Receipt not found.' });
    return res.json({ success: true, data: { receipt, mandal: await getMandal() } });
  } catch (err) {
    console.error('getReceiptById error:', err);
    return res.status(500).json({ success: false, message: 'पावती मिळवताना त्रुटी.' });
  }
}

export async function getReceiptByNumber(req, res) {
  try {
    const { data: receipt, error } = await db.from('receipts').select('*').eq('receipt_number', req.params.receiptNumber).maybeSingle();
    throwIfError(error);
    if (!receipt) return res.status(404).json({ success: false, message: 'पावती सापडली नाही.' });
    return res.json({ success: true, data: { receipt, mandal: await getMandal() } });
  } catch (err) {
    console.error('getReceiptByNumber error:', err);
    return res.status(500).json({ success: false, message: 'पावती मिळवताना त्रुटी.' });
  }
}

export async function getAllReceipts(req, res) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    let query = db.from('receipts').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (search) {
      const s = safeSearchTerm(search);
      query = query.or(`receipt_number.ilike.%${s}%,donor_name.ilike.%${s}%,mobile.ilike.%${s}%`);
    }
    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    throwIfError(error);
    const total = count || 0;
    return res.json({ success: true, data: data || [], pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
  } catch (err) {
    console.error('getAllReceipts error:', err);
    return res.status(500).json({ success: false, message: 'पावत्यांची यादी मिळवताना त्रुटी.' });
  }
}

export async function verifyPublicReceipt(req, res) {
  try {
    const identifier = req.params.identifier.trim();
    const fields = 'id, receipt_number, donor_name, amount, payment_method, category, purpose, collector_name, verification_code, created_at';
    let { data: receipt, error } = await db.from('receipts').select(fields).eq('receipt_number', identifier).maybeSingle();
    throwIfError(error);
    if (!receipt) {
      const second = await db.from('receipts').select(fields).eq('verification_code', identifier).maybeSingle();
      throwIfError(second.error);
      receipt = second.data;
    }

    if (!receipt) return res.status(404).json({ success: false, valid: false, message: 'ही पावती अवैध आहे किंवा सिस्टीममध्ये अस्तित्वात नाही / Invalid receipt. Not found in system.' });
    const mandal = await getMandal('name_mr, name_en, registration_no, festival_year, address_mr, contact_phone');
    const nameParts = receipt.donor_name.split(' ');
    const safeName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}***` : receipt.donor_name;

    return res.json({ success: true, valid: true, data: { receiptNumber: receipt.receipt_number, verificationCode: receipt.verification_code, donorNameSafe: safeName, amount: receipt.amount, paymentMethod: receipt.payment_method, category: receipt.category, purpose: receipt.purpose, date: receipt.created_at, mandal: { nameMr: mandal?.name_mr, nameEn: mandal?.name_en, registrationNo: mandal?.registration_no, festivalYear: mandal?.festival_year, address: mandal?.address_mr } } });
  } catch (err) {
    console.error('verifyPublicReceipt error:', err);
    return res.status(500).json({ success: false, message: 'पडताळणी करताना त्रुटी.' });
  }
}
