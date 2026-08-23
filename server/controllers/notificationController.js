import { db } from '../database/db.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getNotifications(req, res) {
  try {
    const { data: notifications, error } = await db.from('notifications').select('*').or(`user_id.is.null,user_id.eq.${req.user.id}`).order('created_at', { ascending: false }).limit(20);
    throwIfError(error);

    const { count, error: countError } = await db.from('notifications').select('*', { count: 'exact', head: true }).or(`user_id.is.null,user_id.eq.${req.user.id}`).eq('is_read', false);
    throwIfError(countError);
    return res.json({ success: true, data: notifications || [], unreadCount: count || 0 });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'सूचना मिळवताना त्रुटी.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    let query = db.from('notifications').update({ is_read: true });
    query = id === 'all' ? query.or(`user_id.is.null,user_id.eq.${req.user.id}`) : query.eq('id', id);
    const { error } = await query;
    throwIfError(error);
    return res.json({ success: true, message: 'वाचले म्हणून नोंदवले / Marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'त्रुटी.' });
  }
}
