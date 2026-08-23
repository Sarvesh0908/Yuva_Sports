import { db } from '../database/db.js';

export async function logAudit({
  userId = null,
  userName = 'System',
  userRole = 'system',
  action,
  entity,
  entityId = '',
  descriptionMr = '',
  descriptionEn = '',
  oldValues = null,
  newValues = null,
  req = null
}) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
    const oldStr = oldValues ? (typeof oldValues === 'string' ? oldValues : JSON.stringify(oldValues)) : null;
    const newStr = newValues ? (typeof newValues === 'string' ? newValues : JSON.stringify(newValues)) : null;

    await db.run(`
      INSERT INTO audit_logs (
        user_id, user_name, user_role, action, entity, entity_id,
        description_mr, description_en, old_values, new_values, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, userName, userRole, action, entity, entityId,
      descriptionMr, descriptionEn, oldStr, newStr, ipAddress
    ]);
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
