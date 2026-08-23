import { db } from '../database/db.js';

export async function getNotifications(req, res) {
  try {
    const notifications = await db.all(`
      SELECT * FROM notifications 
      WHERE user_id IS NULL OR user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [req.user.id]);

    const unreadCountRow = await db.get(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE (user_id IS NULL OR user_id = ?) AND is_read = 0
    `, [req.user.id]);

    return res.json({
      success: true,
      data: notifications,
      unreadCount: unreadCountRow?.count || 0
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'सूचना मिळवताना त्रुटी.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await db.run('UPDATE notifications SET is_read = 1 WHERE user_id IS NULL OR user_id = ?', [req.user.id]);
    } else {
      await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    }
    return res.json({ success: true, message: 'वाचले म्हणून नोंदवले / Marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'त्रुटी.' });
  }
}
