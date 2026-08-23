import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getEventsList(req, res) {
  try {
    const { data, error } = await db.from('events').select('*').order('event_date', { ascending: true }).order('start_time', { ascending: true });
    throwIfError(error);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getEventsList error:', err);
    return res.status(500).json({ success: false, message: 'कार्यक्रम यादी मिळवताना त्रुटी.' });
  }
}

export async function createEvent(req, res) {
  try {
    const { title_mr, title_en, event_date, start_time, end_time = '', location = '', description = '', organizer_name = '', budget = 0, actual_expense = 0, status = 'upcoming' } = req.body;
    if (!title_mr || !event_date || !start_time) return res.status(400).json({ success: false, message: 'कार्यक्रमाचे नाव, दिनांक आणि वेळ आवश्यक आहे.' });

    const { data: created, error } = await db.from('events').insert({ title_mr: title_mr.trim(), title_en: title_en?.trim() || title_mr.trim(), event_date, start_time, end_time: end_time || null, location: location.trim(), description: description.trim(), organizer_name: organizer_name.trim(), budget: Number(budget) || 0, actual_expense: Number(actual_expense) || 0, status }).select('*').single();
    throwIfError(error);

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'CREATE', entity: 'EVENT', entityId: `${created.id}`, descriptionMr: `${req.user?.name} यांनी नवीन कार्यक्रम "${title_mr}" (${event_date}) जोडला.`, descriptionEn: `Created festival event "${title_mr}" on ${event_date}.`, newValues: created, req });
    return res.status(201).json({ success: true, message: 'कार्यक्रम जोडला / Event added successfully', data: created });
  } catch (err) {
    console.error('createEvent error:', err);
    return res.status(500).json({ success: false, message: 'कार्यक्रम जोडताना त्रुटी.' });
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { data: existing, error } = await db.from('events').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    if (!existing) return res.status(404).json({ success: false, message: 'कार्यक्रम सापडला नाही.' });

    const body = req.body;
    const updates = {
      title_mr: body.title_mr?.trim() || existing.title_mr,
      title_en: body.title_en?.trim() || existing.title_en,
      event_date: body.event_date || existing.event_date,
      start_time: body.start_time || existing.start_time,
      end_time: body.end_time !== undefined ? (body.end_time || null) : existing.end_time,
      location: body.location !== undefined ? body.location.trim() : existing.location,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      organizer_name: body.organizer_name !== undefined ? body.organizer_name.trim() : existing.organizer_name,
      budget: body.budget !== undefined ? Number(body.budget) : existing.budget,
      actual_expense: body.actual_expense !== undefined ? Number(body.actual_expense) : existing.actual_expense,
      status: body.status || existing.status
    };

    const { data: updated, error: updateError } = await db.from('events').update(updates).eq('id', id).select('*').single();
    throwIfError(updateError);
    return res.json({ success: true, message: 'कार्यक्रम माहिती अद्ययावत केली / Event updated successfully', data: updated });
  } catch (err) {
    console.error('updateEvent error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी.' });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { error } = await db.from('events').delete().eq('id', req.params.id);
    throwIfError(error);
    return res.json({ success: true, message: 'कार्यक्रम हटवला / Event deleted.' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    return res.status(500).json({ success: false, message: 'हटवताना त्रुटी.' });
  }
}
