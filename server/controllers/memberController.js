import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { uploadFileToSupabase } from '../middleware/uploadMiddleware.js';
import { throwIfError, toBoolean } from '../utils/dbHelpers.js';

export async function getMembersList(req, res) {
  try {
    const { data, error } = await db.from('committee_members').select('*').order('display_order', { ascending: true }).order('joining_year', { ascending: true });
    throwIfError(error);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getMembersList error:', err);
    return res.status(500).json({ success: false, message: 'कार्यकर्ते यादी मिळवताना त्रुटी.' });
  }
}

export async function createMember(req, res) {
  try {
    const { name, role_title_mr, role_title_en, mobile, address = '', joining_year = 2024, emergency_contact = '', blood_group = '', display_order = 10 } = req.body;
    if (!name?.trim() || !mobile?.trim()) return res.status(400).json({ success: false, message: 'नाव आणि मोबाईल क्रमांक आवश्यक आहे.' });

    const photoUrl = req.file ? await uploadFileToSupabase(req.file, 'members') : '';
    const { data: created, error } = await db.from('committee_members').insert({ name: name.trim(), role_title_mr: role_title_mr?.trim() || 'कार्यकर्ता', role_title_en: role_title_en?.trim() || 'Member', mobile: mobile.trim(), photo_url: photoUrl, address: address.trim(), joining_year: Number(joining_year) || 2024, emergency_contact: emergency_contact.trim(), blood_group: blood_group.trim(), is_active: true, display_order: Number(display_order) || 10 }).select('*').single();
    throwIfError(error);

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'CREATE', entity: 'MEMBER', entityId: `${created.id}`, descriptionMr: `${req.user?.name} यांनी नवीन सदस्य ${name} (${role_title_mr}) जोडले.`, descriptionEn: `Added committee member ${name} (${role_title_en}).`, newValues: created, req });
    return res.status(201).json({ success: true, message: 'सदस्य यशस्वीरित्या जोडला / Member added successfully', data: created });
  } catch (err) {
    console.error('createMember error:', err);
    return res.status(500).json({ success: false, message: 'सदस्य जोडताना त्रुटी.' });
  }
}

export async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const { data: existing, error } = await db.from('committee_members').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    if (!existing) return res.status(404).json({ success: false, message: 'सदस्य सापडला नाही.' });

    const photoUrl = req.file ? await uploadFileToSupabase(req.file, 'members') : existing.photo_url;
    const body = req.body;
    const updates = {
      name: body.name?.trim() || existing.name,
      role_title_mr: body.role_title_mr?.trim() || existing.role_title_mr,
      role_title_en: body.role_title_en?.trim() || existing.role_title_en,
      mobile: body.mobile?.trim() || existing.mobile,
      photo_url: photoUrl,
      address: body.address !== undefined ? body.address.trim() : existing.address,
      joining_year: body.joining_year !== undefined ? Number(body.joining_year) : existing.joining_year,
      emergency_contact: body.emergency_contact !== undefined ? body.emergency_contact.trim() : existing.emergency_contact,
      blood_group: body.blood_group !== undefined ? body.blood_group.trim() : existing.blood_group,
      is_active: toBoolean(body.is_active, existing.is_active),
      display_order: body.display_order !== undefined ? Number(body.display_order) : existing.display_order
    };

    const { data: updated, error: updateError } = await db.from('committee_members').update(updates).eq('id', id).select('*').single();
    throwIfError(updateError);
    return res.json({ success: true, message: 'सदस्य माहिती अद्ययावत केली / Member updated successfully', data: updated });
  } catch (err) {
    console.error('updateMember error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी.' });
  }
}

export async function deleteMember(req, res) {
  try {
    const { error } = await db.from('committee_members').delete().eq('id', req.params.id);
    throwIfError(error);
    return res.json({ success: true, message: 'सदस्य हटवला / Member deleted.' });
  } catch (err) {
    console.error('deleteMember error:', err);
    return res.status(500).json({ success: false, message: 'हटवताना त्रुटी.' });
  }
}
