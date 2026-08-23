import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getCashSummary(req, res) {
  try {
    const { date: targetDate = new Date().toISOString().split('T')[0] } = req.query;

    // 1. Get previous day closing cash as default opening cash
    const prevReconciliation = await db.get(`
      SELECT actual_closing 
      FROM cash_reconciliation 
      WHERE reconciliation_date < date(?) 
      ORDER BY reconciliation_date DESC 
      LIMIT 1
    `, [targetDate]);

    let openingCash = 0;
    if (prevReconciliation) {
      openingCash = Number(prevReconciliation.actual_closing) || 0;
    } else {
      const mandal = await db.get('SELECT initial_opening_balance FROM mandal_settings LIMIT 1');
      openingCash = Number(mandal?.initial_opening_balance) || 0;
    }

    // 2. Cash income on target date
    const incomeRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as cash_income, COUNT(*) as count
      FROM income_transactions
      WHERE is_deleted = 0 AND payment_method = 'cash' AND date(created_at) = date(?)
    `, [targetDate]);

    // 3. Cash expense on target date (approved/paid)
    const expenseRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as cash_expense, COUNT(*) as count
      FROM expense_transactions
      WHERE is_deleted = 0 AND payment_method = 'cash' AND status IN ('approved', 'paid') AND date(created_at) = date(?)
    `, [targetDate]);

    const cashIncome = Number(incomeRow.cash_income) || 0;
    const cashExpense = Number(expenseRow.cash_expense) || 0;
    const expectedClosing = openingCash + cashIncome - cashExpense;

    // 4. Check if reconciliation already recorded for today
    const existingRec = await db.get(
      'SELECT * FROM cash_reconciliation WHERE reconciliation_date = date(?)',
      [targetDate]
    );

    return res.json({
      success: true,
      data: {
        date: targetDate,
        openingCash,
        cashIncome,
        cashIncomeCount: incomeRow.count,
        cashExpense,
        cashExpenseCount: expenseRow.count,
        expectedClosing,
        existingReconciliation: existingRec || null
      }
    });
  } catch (err) {
    console.error('getCashSummary error:', err);
    return res.status(500).json({ success: false, message: 'रोख ताळेबंद माहिती मिळवताना त्रुटी.' });
  }
}

export async function reconcileCash(req, res) {
  try {
    const {
      date: targetDate = new Date().toISOString().split('T')[0],
      opening_cash,
      cash_income,
      cash_expense,
      actual_closing,
      notes = ''
    } = req.body;

    const opCash = Number(opening_cash) || 0;
    const incCash = Number(cash_income) || 0;
    const expCash = Number(cash_expense) || 0;
    const actClosing = Number(actual_closing) || 0;
    const expClosing = opCash + incCash - expCash;
    const diff = actClosing - expClosing;

    const status = diff === 0 ? 'reconciled' : 'mismatch';

    // Insert or update
    const existing = await db.get('SELECT id FROM cash_reconciliation WHERE reconciliation_date = date(?)', [targetDate]);

    let recId;
    if (existing) {
      await db.run(`
        UPDATE cash_reconciliation
        SET opening_cash = ?, cash_income = ?, cash_expense = ?, expected_closing = ?,
            actual_closing = ?, difference = ?, status = ?, notes = ?,
            verified_by_id = ?, verified_by_name = ?, created_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        opCash, incCash, expCash, expClosing, actClosing, diff, status, notes.trim(),
        req.user.id, req.user.name, existing.id
      ]);
      recId = existing.id;
    } else {
      const resDb = await db.run(`
        INSERT INTO cash_reconciliation (
          reconciliation_date, opening_cash, cash_income, cash_expense,
          expected_closing, actual_closing, difference, status, notes,
          verified_by_id, verified_by_name
        ) VALUES (date(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        targetDate, opCash, incCash, expCash, expClosing, actClosing, diff, status, notes.trim(),
        req.user.id, req.user.name
      ]);
      recId = resDb.lastID;
    }

    const savedRecord = await db.get('SELECT * FROM cash_reconciliation WHERE id = ?', [recId]);

    // If mismatch, create notification
    if (diff !== 0) {
      await db.run(`
        INSERT INTO notifications (user_id, title_mr, title_en, message_mr, message_en, type, link)
        VALUES (NULL, 'रोख ताळेबंद तफावत अलर्ट', 'Cash Discrepancy Alert', ?, ?, 'error', '/cash-management')
      `, [
        `दिनांक ${targetDate} च्या रोख ताळेबंदात ₹${Math.abs(diff).toLocaleString('en-IN')} ची तफावत आढळली.`,
        `Cash mismatch of ₹${Math.abs(diff).toLocaleString('en-IN')} found on ${targetDate}.`
      ]);
    }

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RECONCILE',
      entity: 'CASH',
      entityId: targetDate,
      descriptionMr: `${req.user.name} यांनी ${targetDate} चा रोख ताळेबंद नोंदवला. प्रत्यक्ष शिल्लक: ₹${actClosing} (तफावत: ₹${diff}).`,
      descriptionEn: `Reconciled cash for ${targetDate}. Actual Closing: ₹${actClosing} (Diff: ₹${diff}).`,
      newValues: savedRecord,
      req
    });

    return res.json({
      success: true,
      message: diff === 0
        ? 'रोख ताळेबंद यशस्वीरित्या जुळला! / Cash reconciled with zero difference.'
        : `रोख ताळेबंद जतन झाला. तफावत: ₹${diff} / Cash recorded with ₹${diff} discrepancy.`,
      data: savedRecord
    });
  } catch (err) {
    console.error('reconcileCash error:', err);
    return res.status(500).json({ success: false, message: 'ताळेबंद जतन करताना त्रुटी.' });
  }
}

export async function getCashHistory(req, res) {
  try {
    const history = await db.all(
      'SELECT * FROM cash_reconciliation ORDER BY reconciliation_date DESC LIMIT 30'
    );
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error('getCashHistory error:', err);
    return res.status(500).json({ success: false, message: 'इतिहास मिळवताना त्रुटी.' });
  }
}
