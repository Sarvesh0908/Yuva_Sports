import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getSettings(req, res) {
  try {
    let mandal = await db.get('SELECT * FROM mandal_settings LIMIT 1');
    if (!mandal) {
      await db.run('INSERT INTO mandal_settings (name_mr) VALUES (?)', ['श्री गणेश मित्र मंडळ']);
      mandal = await db.get('SELECT * FROM mandal_settings LIMIT 1');
    }
    return res.json({ success: true, data: mandal });
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({ success: false, message: 'सेटिंग्ज मिळवताना त्रुटी.' });
  }
}

export async function updateSettings(req, res) {
  try {
    const {
      name_mr,
      name_en,
      tagline_mr,
      tagline_en,
      address_mr,
      address_en,
      contact_phone,
      contact_email,
      registration_no,
      festival_year,
      arrival_date,
      visarjan_date,
      upi_id,
      upi_name,
      receipt_prefix,
      receipt_language,
      initial_opening_balance
    } = req.body;

    const existing = await db.get('SELECT * FROM mandal_settings LIMIT 1');
    const logoUrl = req.file ? `/uploads/${req.file.filename}` : (existing?.logo_url || '');

    await db.run(`
      UPDATE mandal_settings
      SET name_mr = ?, name_en = ?, tagline_mr = ?, tagline_en = ?,
          address_mr = ?, address_en = ?, contact_phone = ?, contact_email = ?,
          registration_no = ?, festival_year = ?, arrival_date = ?, visarjan_date = ?,
          upi_id = ?, upi_name = ?, receipt_prefix = ?, receipt_language = ?,
          initial_opening_balance = ?, logo_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name_mr ? name_mr.trim() : existing.name_mr,
      name_en ? name_en.trim() : existing.name_en,
      tagline_mr !== undefined ? tagline_mr.trim() : existing.tagline_mr,
      tagline_en !== undefined ? tagline_en.trim() : existing.tagline_en,
      address_mr !== undefined ? address_mr.trim() : existing.address_mr,
      address_en !== undefined ? address_en.trim() : existing.address_en,
      contact_phone !== undefined ? contact_phone.trim() : existing.contact_phone,
      contact_email !== undefined ? contact_email.trim() : existing.contact_email,
      registration_no !== undefined ? registration_no.trim() : existing.registration_no,
      Number(festival_year) || existing.festival_year,
      arrival_date || existing.arrival_date,
      visarjan_date || existing.visarjan_date,
      upi_id !== undefined ? upi_id.trim() : existing.upi_id,
      upi_name !== undefined ? upi_name.trim() : existing.upi_name,
      receipt_prefix !== undefined ? receipt_prefix.trim() : existing.receipt_prefix,
      receipt_language || existing.receipt_language,
      initial_opening_balance !== undefined ? Number(initial_opening_balance) : (existing.initial_opening_balance || 0),
      logoUrl,
      existing.id
    ]);

    const updated = await db.get('SELECT * FROM mandal_settings LIMIT 1');

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'UPDATE',
      entity: 'SETTINGS',
      entityId: `${existing.id}`,
      descriptionMr: `${req.user?.name} यांनी मंडळाची माहिती व सेटिंग्ज अद्ययावत केली.`,
      descriptionEn: `Updated Mandal profile and settings.`,
      oldValues: existing,
      newValues: updated,
      req
    });

    return res.json({
      success: true,
      message: 'सेटिंग्ज यशस्वीरित्या अद्ययावत केल्या / Settings saved successfully',
      data: updated
    });
  } catch (err) {
    console.error('updateSettings error:', err);
    return res.status(500).json({ success: false, message: 'सेटिंग्ज जतन करताना त्रुटी.' });
  }
}
