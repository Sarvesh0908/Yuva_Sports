import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { uploadFileToSupabase } from '../middleware/uploadMiddleware.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getSettings(req, res) {
  try {
    let { data: mandal, error } = await db.from('mandal_settings').select('*').limit(1).maybeSingle();
    throwIfError(error);
    if (!mandal) {
      const created = await db.from('mandal_settings').insert({ name_mr: 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड' }).select('*').single();
      throwIfError(created.error);
      mandal = created.data;
    }
    return res.json({ success: true, data: mandal });
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({ success: false, message: 'सेटिंग्ज मिळवताना त्रुटी.' });
  }
}

export async function updateSettings(req, res) {
  try {
    const { data: existing, error } = await db.from('mandal_settings').select('*').limit(1).maybeSingle();
    throwIfError(error);
    if (!existing) return res.status(404).json({ success: false, message: 'मंडळ सेटिंग्ज सापडल्या नाहीत.' });

    const logoUrl = req.file ? await uploadFileToSupabase(req.file, 'mandal') : (existing.logo_url || '');
    const b = req.body;
    const updates = {
      name_mr: b.name_mr?.trim() || existing.name_mr,
      name_en: b.name_en?.trim() || existing.name_en,
      tagline_mr: b.tagline_mr !== undefined ? b.tagline_mr.trim() : existing.tagline_mr,
      tagline_en: b.tagline_en !== undefined ? b.tagline_en.trim() : existing.tagline_en,
      address_mr: b.address_mr !== undefined ? b.address_mr.trim() : existing.address_mr,
      address_en: b.address_en !== undefined ? b.address_en.trim() : existing.address_en,
      contact_phone: b.contact_phone !== undefined ? b.contact_phone.trim() : existing.contact_phone,
      contact_email: b.contact_email !== undefined ? b.contact_email.trim() : existing.contact_email,
      registration_no: b.registration_no !== undefined ? b.registration_no.trim() : existing.registration_no,
      festival_year: b.festival_year !== undefined ? Number(b.festival_year) : existing.festival_year,
      arrival_date: b.arrival_date || existing.arrival_date,
      visarjan_date: b.visarjan_date || existing.visarjan_date,
      upi_id: b.upi_id !== undefined ? b.upi_id.trim() : existing.upi_id,
      upi_name: b.upi_name !== undefined ? b.upi_name.trim() : existing.upi_name,
      receipt_prefix: b.receipt_prefix !== undefined ? b.receipt_prefix.trim() : existing.receipt_prefix,
      receipt_language: b.receipt_language || existing.receipt_language,
      initial_opening_balance: b.initial_opening_balance !== undefined ? Number(b.initial_opening_balance) : (Number(existing.initial_opening_balance) || 0),
      logo_url: logoUrl
    };

    const { data: updated, error: updateError } = await db.from('mandal_settings').update(updates).eq('id', existing.id).select('*').single();
    throwIfError(updateError);
    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'UPDATE', entity: 'SETTINGS', entityId: `${existing.id}`, descriptionMr: `${req.user?.name} यांनी मंडळाची माहिती व सेटिंग्ज अद्ययावत केली.`, descriptionEn: 'Updated Mandal profile and settings.', oldValues: existing, newValues: updated, req });
    return res.json({ success: true, message: 'सेटिंग्ज यशस्वीरित्या अद्ययावत केल्या / Settings saved successfully', data: updated });
  } catch (err) {
    console.error('updateSettings error:', err);
    return res.status(500).json({ success: false, message: 'सेटिंग्ज जतन करताना त्रुटी.' });
  }
}
