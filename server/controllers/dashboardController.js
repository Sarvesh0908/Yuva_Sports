import { db } from '../database/db.js';

export async function getDashboardStats(req, res) {
  try {
    // 1. Core financial numbers
    const incomeStats = await db.get(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_income,
        COUNT(id) as income_count,
        COALESCE(SUM(CASE WHEN category = 'vargani' THEN amount ELSE 0 END), 0) as total_vargani,
        COALESCE(SUM(CASE WHEN category = 'donation' THEN amount ELSE 0 END), 0) as total_donation,
        COALESCE(SUM(CASE WHEN category = 'sponsorship' THEN amount ELSE 0 END), 0) as total_sponsorship,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_income,
        COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN amount ELSE 0 END), 0) as digital_income,
        COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN amount ELSE 0 END), 0) as today_income
      FROM income_transactions 
      WHERE is_deleted = 0
    `);

    const expenseStats = await db.get(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expense,
        COUNT(id) as expense_count,
        COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as approved_expense,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_expense_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expense_count,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' AND status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as cash_expense,
        COALESCE(SUM(CASE WHEN date(created_at) = date('now') AND status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as today_expense
      FROM expense_transactions 
      WHERE is_deleted = 0
    `);

    const donorsCountRow = await db.get('SELECT COUNT(*) as count FROM donors');
    const totalDonors = donorsCountRow?.count || 0;

    const totalIncome = Number(incomeStats.total_income) || 0;
    const totalExpense = Number(expenseStats.approved_expense) || 0;
    const currentBalance = totalIncome - totalExpense;

    // 2. Payment Method Distribution
    const paymentMethods = await db.all(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM income_transactions
      WHERE is_deleted = 0
      GROUP BY payment_method
    `);

    // 3. Expense Category Breakdown
    const expenseCategories = await db.all(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM expense_transactions
      WHERE is_deleted = 0 AND status IN ('approved', 'paid')
      GROUP BY category
      ORDER BY total_amount DESC
    `);

    // 4. Income Category Breakdown
    const incomeCategories = await db.all(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM income_transactions
      WHERE is_deleted = 0
      GROUP BY category
      ORDER BY total_amount DESC
    `);

    // 5. Daily Collection Trend (Recent 14 days)
    const dailyTrend = await db.all(`
      SELECT 
        date(created_at) as date,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM income_transactions
      WHERE is_deleted = 0 AND created_at >= date('now', '-14 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `);

    // 6. Top Donors
    const topDonors = await db.all(`
      SELECT id, name, mobile, area, total_donated, donations_count
      FROM donors
      ORDER BY total_donated DESC
      LIMIT 6
    `);

    // 7. Recent Transactions (combined income & expenses)
    const recentIncome = await db.all(`
      SELECT 
        'income' as type,
        transaction_id as id_code,
        donor_name as party_name,
        amount,
        payment_method,
        category,
        receipt_number,
        created_at,
        status
      FROM income_transactions
      WHERE is_deleted = 0
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const recentExpenses = await db.all(`
      SELECT 
        'expense' as type,
        expense_id as id_code,
        paid_to as party_name,
        amount,
        payment_method,
        category,
        bill_number as receipt_number,
        created_at,
        status
      FROM expense_transactions
      WHERE is_deleted = 0
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const recentTransactions = [...recentIncome, ...recentExpenses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    // 8. Upcoming Events
    const upcomingEvents = await db.all(`
      SELECT id, title_mr, title_en, event_date, start_time, end_time, location, status
      FROM events
      ORDER BY event_date ASC, start_time ASC
      LIMIT 4
    `);

    // 9. Mandal Settings for countdown & basic info
    const mandalSettings = await db.get('SELECT * FROM mandal_settings LIMIT 1');

    return res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          currentBalance,
          totalVargani: Number(incomeStats.total_vargani) || 0,
          totalDonation: Number(incomeStats.total_donation) || 0,
          totalSponsorship: Number(incomeStats.total_sponsorship) || 0,
          totalDonors,
          totalTransactions: (incomeStats.income_count || 0) + (expenseStats.expense_count || 0),
          todayCollection: Number(incomeStats.today_income) || 0,
          todayExpense: Number(expenseStats.today_expense) || 0,
          pendingExpensesCount: expenseStats.pending_expense_count || 0,
          pendingExpensesAmount: Number(expenseStats.pending_expense_amount) || 0,
          cashIncome: Number(incomeStats.cash_income) || 0,
          digitalIncome: Number(incomeStats.digital_income) || 0,
          cashExpense: Number(expenseStats.cash_expense) || 0
        },
        paymentMethods,
        expenseCategories,
        incomeCategories,
        dailyTrend,
        topDonors,
        recentTransactions,
        upcomingEvents,
        mandalSettings
      }
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'डॅशबोर्ड माहिती मिळवताना त्रुटी / Server error loading dashboard.' });
  }
}
