import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getDonorsList(req, res) {
  try {
    const { page = 1, limit = 20, search = '', area = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR mobile LIKE ? OR area LIKE ? OR address LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    if (area) {
      whereConditions.push('area = ?');
      params.push(area);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRow = await db.get(
      `SELECT COUNT(*) as total, COALESCE(SUM(total_donated), 0) as grand_total FROM donors ${whereClause}`,
      params
    );

    const donors = await db.all(
      `SELECT * FROM donors ${whereClause} ORDER BY total_donated DESC, donations_count DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      data: donors,
      summary: {
        totalDonors: countRow.total,
        grandTotal: countRow.grand_total
      },
      pagination: {
        total: countRow.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRow.total / Number(limit)) || 1
      }
    });
  } catch (err) {
    console.error('getDonorsList error:', err);
    return res.status(500).json({ success: false, message: 'देणगीदार यादी मिळवताना त्रुटी' });
  }
}

export async function searchDonors(req, res) {
  try {
    const { q = '' } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const s = `%${q.trim()}%`;
    const results = await db.all(`
      SELECT id, name, mobile, address, area, total_donated, donations_count, last_donated_at
      FROM donors
      WHERE name LIKE ? OR mobile LIKE ? OR area LIKE ?
      ORDER BY total_donated DESC
      LIMIT 10
    `, [s, s, s]);

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('searchDonors error:', err);
    return res.status(500).json({ success: false, message: 'शोधताना त्रुटी' });
  }
}

export async function getDonorById(req, res) {
  try {
    const { id } = req.params;
    const donor = await db.get('SELECT * FROM donors WHERE id = ?', [id]);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'देणगीदार सापडला नाही.' });
    }

    const history = await db.all(`
      SELECT 
        it.id, it.transaction_id, it.amount, it.payment_method, it.category,
        it.purpose, it.receipt_number, it.created_at, it.collector_name,
        r.id as receipt_id, r.verification_code
      FROM income_transactions it
      LEFT JOIN receipts r ON it.receipt_id = r.id
      WHERE it.donor_id = ? AND it.is_deleted = 0
      ORDER BY it.created_at DESC
    `, [id]);

    return res.json({
      success: true,
      data: {
        donor,
        history
      }
    });
  } catch (err) {
    console.error('getDonorById error:', err);
    return res.status(500).json({ success: false, message: 'माहिती मिळवताना त्रुटी' });
  }
}

export async function createDonor(req, res) {
  try {
    const { name, mobile, email = '', address = '', area = '', notes = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'नाव आवश्यक आहे.' });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'मोबाईल क्रमांक आवश्यक आहे.' });
    }

    const existing = await db.get('SELECT id FROM donors WHERE mobile = ?', [mobile.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'हा मोबाईल क्रमांक आधीच अस्तित्वात आहे.' });
    }

    const resDb = await db.run(`
      INSERT INTO donors (name, mobile, email, address, area, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name.trim(), mobile.trim(), email.trim(), address.trim(), area.trim(), notes.trim()]);

    const created = await db.get('SELECT * FROM donors WHERE id = ?', [resDb.lastID]);

    return res.status(201).json({
      success: true,
      message: 'देणगीदार यशस्वीरित्या जोडला / Donor added successfully',
      data: created
    });
  } catch (err) {
    console.error('createDonor error:', err);
    return res.status(500).json({ success: false, message: 'नोंदणी करताना त्रुटी' });
  }
}

export async function updateDonor(req, res) {
  try {
    const { id } = req.params;
    const { name, mobile, email = '', address = '', area = '', notes = '' } = req.body;

    const donor = await db.get('SELECT * FROM donors WHERE id = ?', [id]);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'देणगीदार सापडला नाही.' });
    }

    await db.run(`
      UPDATE donors 
      SET name = ?, mobile = ?, email = ?, address = ?, area = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name.trim(), mobile.trim(), email.trim(), address.trim(), area.trim(), notes.trim(), id]);

    const updated = await db.get('SELECT * FROM donors WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'माहिती अद्ययावत केली / Donor updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('updateDonor error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी' });
  }
}
