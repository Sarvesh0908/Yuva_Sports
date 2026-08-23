import { db } from '../database/db.js';

export async function getAuditLogs(req, res) {
  try {
    const { page = 1, limit = 25, entity = '', action = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    let params = [];

    if (entity) {
      whereConditions.push('entity = ?');
      params.push(entity);
    }

    if (action) {
      whereConditions.push('action = ?');
      params.push(action);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRow = await db.get(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params);
    const logs = await db.all(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      data: logs,
      pagination: {
        total: countRow.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRow.total / Number(limit)) || 1
      }
    });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return res.status(500).json({ success: false, message: 'ऑडिट नोंदी मिळवताना त्रुटी.' });
  }
}
