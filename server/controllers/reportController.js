import { db } from '../database/db.js';

export async function getFinancialReport(req, res) {
  try {
    const { range = 'all', startDate = '', endDate = '' } = req.query;

    let incomeDateFilter = '';
    let expenseDateFilter = '';
    let params = [];

    if (range === 'today') {
      incomeDateFilter = "AND date(created_at) = date('now')";
      expenseDateFilter = "AND date(created_at) = date('now')";
    } else if (range === '7days') {
      incomeDateFilter = "AND created_at >= date('now', '-7 days')";
      expenseDateFilter = "AND created_at >= date('now', '-7 days')";
    } else if (range === '30days') {
      incomeDateFilter = "AND created_at >= date('now', '-30 days')";
      expenseDateFilter = "AND created_at >= date('now', '-30 days')";
    } else if (range === 'custom' && startDate && endDate) {
      incomeDateFilter = "AND date(created_at) >= date(?) AND date(created_at) <= date(?)";
      expenseDateFilter = "AND date(created_at) >= date(?) AND date(created_at) <= date(?)";
      params = [startDate, endDate];
    }

    // 1. Income summary
    const incomeSummary = await db.get(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_income,
        COUNT(id) as count,
        COALESCE(SUM(CASE WHEN category = 'vargani' THEN amount ELSE 0 END), 0) as vargani_total,
        COALESCE(SUM(CASE WHEN category = 'donation' THEN amount ELSE 0 END), 0) as donation_total,
        COALESCE(SUM(CASE WHEN category = 'sponsorship' THEN amount ELSE 0 END), 0) as sponsorship_total,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_income,
        COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN amount ELSE 0 END), 0) as digital_income
      FROM income_transactions
      WHERE is_deleted = 0 ${incomeDateFilter}
    `, params);

    // 2. Expense summary
    const expenseSummary = await db.get(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expense,
        COUNT(id) as count,
        COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as approved_expense,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_expense,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' AND status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as cash_expense,
        COALESCE(SUM(CASE WHEN payment_method != 'cash' AND status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as digital_expense
      FROM expense_transactions
      WHERE is_deleted = 0 ${expenseDateFilter}
    `, params);

    // 3. Category Breakdown
    const incomeByCategory = await db.all(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
      FROM income_transactions
      WHERE is_deleted = 0 ${incomeDateFilter}
      GROUP BY category
      ORDER BY amount DESC
    `, params);

    const expenseByCategory = await db.all(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
      FROM expense_transactions
      WHERE is_deleted = 0 AND status IN ('approved', 'paid') ${expenseDateFilter}
      GROUP BY category
      ORDER BY amount DESC
    `, params);

    // 4. Collector breakdown
    const collectionsByCollector = await db.all(`
      SELECT 
        COALESCE(collector_name, 'इतर') as collector_name,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM income_transactions
      WHERE is_deleted = 0 ${incomeDateFilter}
      GROUP BY collector_name
      ORDER BY total_amount DESC
    `, params);

    const totalIncome = Number(incomeSummary.total_income) || 0;
    const totalApprovedExpense = Number(expenseSummary.approved_expense) || 0;
    const netBalance = totalIncome - totalApprovedExpense;

    const mandal = await db.get('SELECT * FROM mandal_settings LIMIT 1');

    return res.json({
      success: true,
      data: {
        range,
        mandal,
        totals: {
          totalIncome,
          totalApprovedExpense,
          netBalance,
          varganiTotal: Number(incomeSummary.vargani_total) || 0,
          donationTotal: Number(incomeSummary.donation_total) || 0,
          sponsorshipTotal: Number(incomeSummary.sponsorship_total) || 0,
          cashIncome: Number(incomeSummary.cash_income) || 0,
          digitalIncome: Number(incomeSummary.digital_income) || 0,
          cashExpense: Number(expenseSummary.cash_expense) || 0,
          digitalExpense: Number(expenseSummary.digital_expense) || 0,
          pendingExpense: Number(expenseSummary.pending_expense) || 0
        },
        incomeByCategory,
        expenseByCategory,
        collectionsByCollector
      }
    });
  } catch (err) {
    console.error('getFinancialReport error:', err);
    return res.status(500).json({ success: false, message: 'अहवाल तयार करताना त्रुटी.' });
  }
}

export async function exportCsvData(req, res) {
  try {
    const { type = 'balance_sheet' } = req.params;

    if (type === 'balance_sheet' || type === 'financial') {
      const mandal = await db.get('SELECT name_mr, festival_year FROM mandal_settings LIMIT 1');
      const mandalName = mandal?.name_mr || 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड';
      const year = mandal?.festival_year || 2026;

      const incomeSummary = await db.get(`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM income_transactions WHERE is_deleted = 0
      `);
      const expenseSummary = await db.get(`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM expense_transactions WHERE is_deleted = 0 AND status IN ('approved', 'paid')
      `);

      const totalIncome = Number(incomeSummary.total) || 0;
      const totalExpense = Number(expenseSummary.total) || 0;
      const netBalance = totalIncome - totalExpense;

      let csv = `"${mandalName} - वार्षिक आर्थिक ताळेबंद अहवाल (${year})"\n`;
      csv += `"अहवाल दिनांक: ${new Date().toLocaleDateString('en-GB')}"\n\n`;
      csv += `--- ताळेबंद गोषवारा (Financial Summary) ---\n`;
      csv += `एकूण जमा रक्कम (Total Income),${totalIncome}\n`;
      csv += `एकूण मंजूर खर्च (Total Expenses),${totalExpense}\n`;
      csv += `एकूण निव्वळ शिल्लक (Net Balance),${netBalance}\n\n`;

      csv += `--- सर्व जमा नोंदी (Income & Vargani Transactions) ---\n`;
      csv += `पावती क्र.,देणगीदार,मोबाईल,पत्ता,रक्कम (₹),पेमेंट पद्धत,प्रवर्ग,उद्देश,संकलक,दिनांक\n`;
      const incomeRows = await db.all(`
        SELECT receipt_number, donor_name, mobile, address, amount, payment_method, category, purpose, collector_name, created_at
        FROM income_transactions WHERE is_deleted = 0 ORDER BY created_at ASC
      `);
      incomeRows.forEach(r => {
        csv += `"${r.receipt_number || ''}","${r.donor_name}","${r.mobile || ''}","${r.address || ''}",${r.amount},"${r.payment_method}","${r.category}","${r.purpose || ''}","${r.collector_name || ''}","${r.created_at}"\n`;
      });

      csv += `\n--- सर्व खर्च नोंदी (Expense Transactions) ---\n`;
      csv += `खर्च आयडी,प्रवर्ग,वर्णन,रक्कम (₹),पेमेंट पद्धत,कोणाला दिले,बिल क्र.,स्थिती,मंजूरकर्ता,दिनांक\n`;
      const expenseRows = await db.all(`
        SELECT expense_id, category, description, amount, payment_method, paid_to, bill_number, status, approved_by_name, created_at
        FROM expense_transactions WHERE is_deleted = 0 ORDER BY created_at ASC
      `);
      expenseRows.forEach(r => {
        csv += `"${r.expense_id}","${r.category}","${r.description}",${r.amount},"${r.payment_method}","${r.paid_to}","${r.bill_number || ''}","${r.status}","${r.approved_by_name || ''}","${r.created_at}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ganpati_mandal_balance_sheet.csv"');
      return res.send('\uFEFF' + csv);
    }

    if (type === 'income') {
      const rows = await db.all(`
        SELECT transaction_id, receipt_number, donor_name, mobile, address, amount, payment_method, category, purpose, collector_name, created_at
        FROM income_transactions
        WHERE is_deleted = 0
        ORDER BY created_at DESC
      `);

      let csv = 'पावती क्र.,Transaction ID,देणगीदार,मोबाईल,पत्ता,रक्कम (₹),पेमेंट पद्धत,प्रवर्ग,उद्देश,संकलक,दिनांक\n';
      rows.forEach(r => {
        csv += `"${r.receipt_number || ''}","${r.transaction_id}","${r.donor_name}","${r.mobile || ''}","${r.address || ''}",${r.amount},"${r.payment_method}","${r.category}","${r.purpose || ''}","${r.collector_name || ''}","${r.created_at}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ganpati_mandal_income.csv"');
      return res.send('\uFEFF' + csv); // Include BOM for Excel Marathi/Unicode support
    }

    if (type === 'expenses') {
      const rows = await db.all(`
        SELECT expense_id, category, description, amount, payment_method, paid_to, bill_number, status, requested_by_name, approved_by_name, created_at
        FROM expense_transactions
        WHERE is_deleted = 0
        ORDER BY created_at DESC
      `);

      let csv = 'Expense ID,Category,Description,Amount,Payment Method,Paid To,Bill No,Status,Requested By,Approved By,Date\n';
      rows.forEach(r => {
        csv += `"${r.expense_id}","${r.category}","${r.description}",${r.amount},"${r.payment_method}","${r.paid_to}","${r.bill_number || ''}","${r.status}","${r.requested_by_name || ''}","${r.approved_by_name || ''}","${r.created_at}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ganpati_mandal_expenses.csv"');
      return res.send('\uFEFF' + csv);
    }

    if (type === 'donors') {
      const rows = await db.all(`
        SELECT id, name, mobile, email, area, address, total_donated, donations_count, last_donated_at
        FROM donors
        ORDER BY total_donated DESC
      `);

      let csv = 'Donor ID,Name,Mobile,Email,Area,Address,Total Donated,Donations Count,Last Donated Date\n';
      rows.forEach(r => {
        csv += `${r.id},"${r.name}","${r.mobile}","${r.email || ''}","${r.area || ''}","${r.address || ''}",${r.total_donated},${r.donations_count},"${r.last_donated_at || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ganpati_mandal_donors.csv"');
      return res.send('\uFEFF' + csv);
    }

    return res.status(400).json({ success: false, message: 'अवैध एक्सपोर्ट प्रकार.' });
  } catch (err) {
    console.error('exportCsvData error:', err);
    return res.status(500).json({ success: false, message: 'CSV एक्सपोर्ट करताना त्रुटी.' });
  }
}
