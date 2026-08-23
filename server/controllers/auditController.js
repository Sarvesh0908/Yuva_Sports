import { db } from '../database/db.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getAuditLogs(req, res) {
  try {
    const { page = 1, limit = 25, entity = '', action = '' } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
    const offset = (pageNum - 1) * limitNum;

    let query = db
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (entity) query = query.eq('entity', entity);
    if (action) query = query.eq('action', action);

    const { data: logs, count, error } = await query.range(offset, offset + limitNum - 1);
    throwIfError(error);

    const total = count || 0;
    return res.json({
      success: true,
      data: logs || [],
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return res.status(500).json({ success: false, message: 'ऑडिट नोंदी मिळवताना त्रुटी.' });
  }
}
