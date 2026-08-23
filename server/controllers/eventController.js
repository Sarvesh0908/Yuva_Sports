import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getEventsList(req, res) {
  try {
    const events = await db.all('SELECT * FROM events ORDER BY event_date ASC, start_time ASC');
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('getEventsList error:', err);
    return res.status(500).json({ success: false, message: 'कार्यक्रम यादी मिळवताना त्रुटी.' });
  }
}

export async function createEvent(req, res) {
  try {
    const {
      title_mr,
      title_en,
      event_date,
      start_time,
      end_time = '',
      location = '',
      description = '',
      organizer_name = '',
      budget = 0,
      actual_expense = 0,
      status = 'upcoming'
    } = req.body;

    if (!title_mr || !event_date || !start_time) {
      return res.status(400).json({ success: false, message: 'कार्यक्रमाचे नाव, दिनांक आणि वेळ आवश्यक आहे.' });
    }

    const resDb = await db.run(`
      INSERT INTO events (
        title_mr, title_en, event_date, start_time, end_time,
        location, description, organizer_name, budget, actual_expense, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title_mr.trim(), title_en ? title_en.trim() : title_mr.trim(),
      event_date, start_time, end_time, location.trim(),
      description.trim(), organizer_name.trim(),
      Number(budget) || 0, Number(actual_expense) || 0, status
    ]);

    const created = await db.get('SELECT * FROM events WHERE id = ?', [resDb.lastID]);

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'CREATE',
      entity: 'EVENT',
      entityId: `${created.id}`,
      descriptionMr: `${req.user?.name} यांनी नवीन कार्यक्रम "${title_mr}" (${event_date}) जोडला.`,
      descriptionEn: `Created festival event "${title_mr}" on ${event_date}.`,
      newValues: created,
      req
    });

    return res.status(201).json({
      success: true,
      message: 'कार्यक्रम जोडला / Event added successfully',
      data: created
    });
  } catch (err) {
    console.error('createEvent error:', err);
    return res.status(500).json({ success: false, message: 'कार्यक्रम जोडताना त्रुटी.' });
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const {
      title_mr,
      title_en,
      event_date,
      start_time,
      end_time = '',
      location = '',
      description = '',
      organizer_name = '',
      budget = 0,
      actual_expense = 0,
      status = 'upcoming'
    } = req.body;

    const existing = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'कार्यक्रम सापडला नाही.' });
    }

    await db.run(`
      UPDATE events
      SET title_mr = ?, title_en = ?, event_date = ?, start_time = ?, end_time = ?,
          location = ?, description = ?, organizer_name = ?, budget = ?,
          actual_expense = ?, status = ?
      WHERE id = ?
    `, [
      title_mr ? title_mr.trim() : existing.title_mr,
      title_en ? title_en.trim() : existing.title_en,
      event_date || existing.event_date,
      start_time || existing.start_time,
      end_time !== undefined ? end_time : existing.end_time,
      location !== undefined ? location.trim() : existing.location,
      description !== undefined ? description.trim() : existing.description,
      organizer_name !== undefined ? organizer_name.trim() : existing.organizer_name,
      budget !== undefined ? Number(budget) : existing.budget,
      actual_expense !== undefined ? Number(actual_expense) : existing.actual_expense,
      status || existing.status,
      id
    ]);

    const updated = await db.get('SELECT * FROM events WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'कार्यक्रम माहिती अद्ययावत केली / Event updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('updateEvent error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी.' });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM events WHERE id = ?', [id]);
    return res.json({ success: true, message: 'कार्यक्रम हटवला / Event deleted.' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    return res.status(500).json({ success: false, message: 'हटवताना त्रुटी.' });
  }
}
