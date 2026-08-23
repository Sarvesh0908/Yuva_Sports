import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getMembersList(req, res) {
  try {
    const members = await db.all('SELECT * FROM committee_members ORDER BY display_order ASC, joining_year ASC');
    return res.json({ success: true, data: members });
  } catch (err) {
    console.error('getMembersList error:', err);
    return res.status(500).json({ success: false, message: 'कार्यकर्ते यादी मिळवताना त्रुटी.' });
  }
}

export async function createMember(req, res) {
  try {
    const {
      name,
      role_title_mr,
      role_title_en,
      mobile,
      address = '',
      joining_year = 2024,
      emergency_contact = '',
      blood_group = '',
      display_order = 10
    } = req.body;

    if (!name || !name.trim() || !mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'नाव आणि मोबाईल क्रमांक आवश्यक आहे.' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const resDb = await db.run(`
      INSERT INTO committee_members (
        name, role_title_mr, role_title_en, mobile, photo_url, address,
        joining_year, emergency_contact, blood_group, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [
      name.trim(), role_title_mr ? role_title_mr.trim() : 'कार्यकर्ता',
      role_title_en ? role_title_en.trim() : 'Member',
      mobile.trim(), photoUrl, address ? address.trim() : '',
      Number(joining_year) || 2024, emergency_contact ? emergency_contact.trim() : '',
      blood_group ? blood_group.trim() : '', Number(display_order) || 10
    ]);

    const created = await db.get('SELECT * FROM committee_members WHERE id = ?', [resDb.lastID]);

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'CREATE',
      entity: 'MEMBER',
      entityId: `${created.id}`,
      descriptionMr: `${req.user?.name} यांनी नवीन सदस्य ${name} (${role_title_mr}) जोडले.`,
      descriptionEn: `Added committee member ${name} (${role_title_en}).`,
      newValues: created,
      req
    });

    return res.status(201).json({
      success: true,
      message: 'सदस्य यशस्वीरित्या जोडला / Member added successfully',
      data: created
    });
  } catch (err) {
    console.error('createMember error:', err);
    return res.status(500).json({ success: false, message: 'सदस्य जोडताना त्रुटी.' });
  }
}

export async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      role_title_mr,
      role_title_en,
      mobile,
      address = '',
      joining_year = 2024,
      emergency_contact = '',
      blood_group = '',
      is_active = 1,
      display_order = 10
    } = req.body;

    const existing = await db.get('SELECT * FROM committee_members WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'सदस्य सापडला नाही.' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : existing.photo_url;

    await db.run(`
      UPDATE committee_members
      SET name = ?, role_title_mr = ?, role_title_en = ?, mobile = ?, photo_url = ?,
          address = ?, joining_year = ?, emergency_contact = ?, blood_group = ?,
          is_active = ?, display_order = ?
      WHERE id = ?
    `, [
      name ? name.trim() : existing.name,
      role_title_mr ? role_title_mr.trim() : existing.role_title_mr,
      role_title_en ? role_title_en.trim() : existing.role_title_en,
      mobile ? mobile.trim() : existing.mobile,
      photoUrl,
      address !== undefined ? address.trim() : existing.address,
      Number(joining_year) || existing.joining_year,
      emergency_contact !== undefined ? emergency_contact.trim() : existing.emergency_contact,
      blood_group !== undefined ? blood_group.trim() : existing.blood_group,
      is_active !== undefined ? Number(is_active) : existing.is_active,
      display_order !== undefined ? Number(display_order) : existing.display_order,
      id
    ]);

    const updated = await db.get('SELECT * FROM committee_members WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'सदस्य माहिती अद्ययावत केली / Member updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('updateMember error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी.' });
  }
}

export async function deleteMember(req, res) {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM committee_members WHERE id = ?', [id]);
    return res.json({ success: true, message: 'सदस्य हटवला / Member deleted.' });
  } catch (err) {
    console.error('deleteMember error:', err);
    return res.status(500).json({ success: false, message: 'हटवताना त्रुटी.' });
  }
}
