import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Badge } from '../components/common/Badge';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Users,
  Award,
  ChevronDown,
  FileText
} from 'lucide-react';

export function ReportsPage() {
  const { t, lang } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const reportRef = useRef(null);

  const [range, setRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/financial', {
        range,
        startDate,
        endDate
      });
      if (res.success && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('fetchReport error:', err);
      showToast('अहवाल तयार करताना अडचण आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [range]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = async (type = 'balance_sheet') => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      showToast('CSV अहवाल तयार होत आहे...', 'info');

      const token = localStorage.getItem('ganpati_mandal_token');
      const response = await fetch(`/api/reports/export/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('CSV डाऊनलोड करताना त्रुटी आली.');
      }

      const blob = await response.blob();
      const filenameMap = {
        balance_sheet: 'ganpati_mandal_balance_sheet.csv',
        income: 'ganpati_mandal_income_transactions.csv',
        expenses: 'ganpati_mandal_expense_transactions.csv',
        donors: 'ganpati_mandal_donors_list.csv'
      };

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameMap[type] || `mandal_report_${type}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('CSV अहवाल यशस्वीरित्या डाऊनलोड झाला! 📊', 'success');
    } catch (err) {
      console.error('handleExportCsv error:', err);
      showToast('CSV डाऊनलोड करताना अडचण आली.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const totals = reportData?.totals || {};
  const incomeCategories = reportData?.incomeByCategory || [];
  const expenseCategories = reportData?.expenseByCategory || [];
  const collectorList = reportData?.collectionsByCollector || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Controls (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('reports.title', 'आर्थिक ताळेबंद व अहवाल (Financial Reports)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            गणेशोत्सवाचा संपूर्ण अधिकृत जमा-खर्च ताळेबंद अहवाल
          </p>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* CSV Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>{isExporting ? 'डाऊनलोड होत आहे...' : 'CSV एक्सेल अहवाल'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
                <button
                  onClick={() => handleExportCsv('balance_sheet')}
                  className="w-full text-left px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-slate-800 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="font-extrabold">📊 सर्व जमा-खर्च ताळेबंद (CSV)</p>
                    <p className="text-[10px] text-slate-400">संपूर्ण गोषवारा + जमा + खर्च</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExportCsv('income')}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-extrabold">💰 वर्गणी व जमा नोंदी (CSV)</p>
                    <p className="text-[10px] text-slate-400">सर्व पावत्या व देणग्या</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExportCsv('expenses')}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800"
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <div>
                    <p className="font-extrabold">💸 खर्च नोंदी अहवाल (CSV)</p>
                    <p className="text-[10px] text-slate-400">सर्व खर्च व बिले</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExportCsv('donors')}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-extrabold">👥 देणगीदार यादी (CSV)</p>
                    <p className="text-[10px] text-slate-400">संपर्क व पत्त्यासह यादी</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{t('reports.printReport', 'अहवाल प्रिंट करा')}</span>
          </button>
        </div>
      </div>

      {/* Date Filter Tabs (Hidden when printing) */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setRange('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === 'all' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {t('reports.allTime', 'सर्व व्यवहार (All Time)')}
          </button>
          <button
            onClick={() => setRange('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === 'today' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {t('reports.today', 'आज (Today)')}
          </button>
          <button
            onClick={() => setRange('7days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === '7days' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {t('reports.7days', 'मागील ७ दिवस')}
          </button>
          <button
            onClick={() => setRange('30days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === '30days' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {t('reports.30days', 'मागील ३० दिवस')}
          </button>
        </div>
      </div>

      {/* Printable Official Financial Balance Sheet */}
      <div
        ref={reportRef}
        className="printable-area rounded-3xl bg-white text-slate-900 border-2 border-amber-400/80 p-6 sm:p-10 shadow-xl space-y-8 font-sans"
      >
        {/* Report Header */}
        <div className="text-center border-b-2 border-amber-500 pb-5 space-y-1 relative">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
            ॥ श्री गणेशाय नमः ॥
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-700 font-marathi">
            {mandal?.name_mr || 'श्री गणेश मित्र मंडळ'}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {mandal?.address_mr} • नोंदणी क्र: {mandal?.registration_no}
          </p>
          <div className="inline-block mt-2 px-4 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs">
            गणेशोत्सव वर्ष {mandal?.festival_year || 2026} अधिकृत जमा-खर्च ताळेबंद अहवाल
          </div>
        </div>

        {/* Master Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center">
            <span className="text-xs font-bold text-emerald-800 uppercase block">
              एकूण जमा रक्कम (Total Income)
            </span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {formatCurrency(totals.totalIncome)}
            </p>
            <p className="text-[11px] text-emerald-800/80 mt-0.5">
              रोख: {formatCurrency(totals.cashIncome)} | डिजिटल: {formatCurrency(totals.digitalIncome)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-center">
            <span className="text-xs font-bold text-rose-800 uppercase block">
              एकूण मंजूर खर्च (Total Expenses)
            </span>
            <p className="text-2xl font-black text-rose-700 mt-1">
              {formatCurrency(totals.totalApprovedExpense)}
            </p>
            <p className="text-[11px] text-rose-800/80 mt-0.5">
              रोख खर्च: {formatCurrency(totals.cashExpense)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-center">
            <span className="text-xs font-bold text-amber-800 uppercase block">
              अखेरची शिल्लक (Net Balance)
            </span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {formatCurrency(totals.netBalance)}
            </p>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              जमा - खर्च
            </p>
          </div>
        </div>

        {/* Dual Tables: Income Categories vs Expense Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider border-b border-emerald-300 pb-1.5 flex items-center justify-between">
              <span>१. जमा रक्कम तपशील (Income)</span>
              <span>{formatCurrency(totals.totalIncome)}</span>
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 font-semibold border-b">
                <tr>
                  <th className="pb-1.5">जमा प्रकार</th>
                  <th className="pb-1.5 text-center">पावत्या</th>
                  <th className="pb-1.5 text-right">रक्कम (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {incomeCategories.map((c, i) => (
                  <tr key={i}>
                    <td className="py-2">{t(`categories.${c.category}`, c.category)}</td>
                    <td className="py-2 text-center text-slate-500">{c.count}</td>
                    <td className="py-2 text-right font-bold text-emerald-700">{formatCurrency(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expense Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-rose-800 uppercase tracking-wider border-b border-rose-300 pb-1.5 flex items-center justify-between">
              <span>२. खर्च तपशील (Expenses)</span>
              <span>{formatCurrency(totals.totalApprovedExpense)}</span>
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 font-semibold border-b">
                <tr>
                  <th className="pb-1.5">खर्च प्रकार</th>
                  <th className="pb-1.5 text-center">संख्या</th>
                  <th className="pb-1.5 text-right">रक्कम (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenseCategories.map((c, i) => (
                  <tr key={i}>
                    <td className="py-2">{t(`categories.${c.category}`, c.category)}</td>
                    <td className="py-2 text-center text-slate-500">{c.count}</td>
                    <td className="py-2 text-right font-bold text-rose-700">{formatCurrency(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collector Performance Table */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1.5">
            ३. कार्यकर्त्यांनुसार वर्गणी संकलन (Collector Performance)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {collectorList.map((col, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">{col.collector_name}</p>
                <div className="flex items-center justify-between mt-1 text-slate-600">
                  <span>{col.count} पावत्या</span>
                  <span className="font-black text-amber-700">{formatCurrency(col.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Committee Verification & Signatures */}
        <div className="pt-12 border-t-2 border-slate-300 grid grid-cols-3 text-center text-xs">
          <div>
            <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
            <p className="font-bold text-slate-900">खजिनदार (Treasurer)</p>
            <p className="text-[10px] text-slate-500">युवा स्पोर्ट्स गणेशोत्सव मंडळ</p>
          </div>
          <div>
            <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
            <p className="font-bold text-slate-900"> अध्यक्ष (President)</p>
            <p className="text-[10px] text-slate-500">युवा स्पोर्ट्स गणेशोत्सव मंडळ</p>
          </div>
          <div>
            <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
            <p className="font-bold text-slate-900">उपाध्यक्ष(Secretary)</p>
            <p className="text-[10px] text-slate-500">युवा स्पोर्ट्स गणेशोत्सव मंडळ</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
