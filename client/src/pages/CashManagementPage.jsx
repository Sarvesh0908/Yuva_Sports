import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Badge } from '../components/common/Badge';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Save,
  Clock,
  Info
} from 'lucide-react';

export function CashManagementPage() {
  const { t, lang } = useLanguage();
  const { isAdmin, isTreasurer } = useAuth();
  const { showToast } = useNotification();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [editableOpeningCash, setEditableOpeningCash] = useState('');
  const [isEditingOpening, setIsEditingOpening] = useState(false);
  const [actualClosing, setActualClosing] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCashData = async () => {
    try {
      setLoading(true);
      const [sumRes, histRes] = await Promise.all([
        api.get('/cash/summary', { date }),
        api.get('/cash/history')
      ]);

      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
        setEditableOpeningCash(sumRes.data.openingCash);
        if (sumRes.data.existingReconciliation) {
          setActualClosing(sumRes.data.existingReconciliation.actual_closing);
          setNotes(sumRes.data.existingReconciliation.notes || '');
        } else {
          setActualClosing(sumRes.data.expectedClosing);
          setNotes('');
        }
      }

      if (histRes.success) {
        setHistory(histRes.data || []);
      }
    } catch (err) {
      console.error('fetchCashData error:', err);
      showToast('रोख माहिती लोड करताना अडचण आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashData();
  }, [date]);

  const openingCash = editableOpeningCash !== '' ? Number(editableOpeningCash) : (summary?.openingCash || 0);
  const cashIncome = summary?.cashIncome || 0;
  const cashExpense = summary?.cashExpense || 0;
  const expectedClosing = openingCash + cashIncome - cashExpense;
  const actualVal = Number(actualClosing) || 0;
  const difference = actualVal - expectedClosing;

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!isAdmin && !isTreasurer) {
      showToast('केवळ खजिनदार किंवा अध्यक्ष ताळेबंद जतन करू शकतात.', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.post('/cash/reconcile', {
        date,
        opening_cash: openingCash,
        cash_income: cashIncome,
        cash_expense: cashExpense,
        actual_closing: actualVal,
        notes: notes.trim()
      });

      if (res.success) {
        showToast(res.message || 'रोख ताळेबंद यशस्वीरित्या जतन झाला!', 'success');
        fetchCashData();
      }
    } catch (err) {
      console.error('Reconcile error:', err);
      showToast('ताळेबंद जतन करताना त्रुटी.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('cash.title', 'दैनिक रोख व्यवस्थापन (Cash Reconciliation)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('cash.subtitle', 'रोजच्या रोख जमा आणि खर्चाचा ताळेबंद पडताळा')}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Main Reconciliation Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span>दिनांक {formatDate(date, lang)} चा रोख ताळेबंद</span>
          {summary?.existingReconciliation && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              नोंदवलेला ताळेबंद (Verified)
            </span>
          )}
        </h3>

        {/* Math Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* 1. Opening Cash */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center relative group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                सुरुवातीची शिल्लक (Opening)
              </span>
              {(isAdmin || isTreasurer) && (
                <button
                  type="button"
                  onClick={() => setIsEditingOpening(!isEditingOpening)}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {isEditingOpening ? 'पूर्ण' : 'बदला'}
                </button>
              )}
            </div>

            {isEditingOpening ? (
              <div className="mt-1">
                <input
                  type="number"
                  min="0"
                  value={editableOpeningCash}
                  onChange={(e) => setEditableOpeningCash(e.target.value)}
                  className="w-full text-center py-1 px-2 text-lg font-black rounded-xl bg-white dark:bg-slate-900 border border-amber-400 outline-none font-mono text-slate-900 dark:text-white"
                  placeholder="0"
                  autoFocus
                />
                <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">नवीन सुरुवातीची शिल्लक टाका</p>
              </div>
            ) : (
              <>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(openingCash)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">मागील दिवसाची / आरंभीची शिल्लक</p>
              </>
            )}
          </div>

          {/* 2. Cash In */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> + आजची रोख जमा (Cash In)
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              + {formatCurrency(cashIncome)}
            </p>
            <p className="text-[10px] text-emerald-600/70 mt-0.5">{summary?.cashIncomeCount || 0} रोख पावत्या</p>
          </div>

          {/* 3. Cash Out */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase flex items-center justify-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> - आजचा रोख खर्च (Cash Out)
            </span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              - {formatCurrency(cashExpense)}
            </p>
            <p className="text-[10px] text-rose-600/70 mt-0.5">{summary?.cashExpenseCount || 0} खर्च नोंदी</p>
          </div>

          {/* 4. Expected Closing */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 text-center">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase">
              = अपेक्षित शिल्लक (Expected)
            </span>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
              {formatCurrency(expectedClosing)}
            </p>
            <p className="text-[10px] text-amber-800/80 mt-0.5">सुरुवातीची + जमा - खर्च</p>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleReconcile} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                प्रत्यक्ष मोजलेली रोख शिल्लक (Actual Cash Counted) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  value={actualClosing}
                  onChange={(e) => setActualClosing(e.target.value)}
                  placeholder="रोख रक्कम टाका..."
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Difference indicator */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                तफावत (Discrepancy / Difference)
              </label>
              <div
                className={`p-2.5 rounded-xl border font-black text-base flex items-center justify-between ${
                  difference === 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                <span>{difference === 0 ? '✓ तफावत नाही (0)' : `₹ ${difference.toLocaleString('en-IN')}`}</span>
                <span className="text-xs font-bold">
                  {difference === 0 ? 'ताळेबंद पूर्ण जुळला' : difference > 0 ? 'जादा रोख' : 'कमी रोख'}
                </span>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                तपशील / शेरा / स्पष्टीकरण (Notes & Remarks)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="उदा. दैनिक रोख जमा व खर्च ताळेबंद पूर्ण जुळला आहे..."
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-festive transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'जतन होत आहे...' : t('cash.reconcileButton', 'रोख ताळेबंद जतन करा (Save Reconciliation)')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reconciliation History Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
          मागील रोख ताळेबंद इतिहास (Reconciliation History)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">दिनांक</th>
                <th className="py-2.5 px-3 text-right">सुरुवातीची</th>
                <th className="py-2.5 px-3 text-right">रोख जमा (+)</th>
                <th className="py-2.5 px-3 text-right">रोख खर्च (-)</th>
                <th className="py-2.5 px-3 text-right">अपेक्षित</th>
                <th className="py-2.5 px-3 text-right">प्रत्यक्ष शिल्लक</th>
                <th className="py-2.5 px-3 text-center">तफावत</th>
                <th className="py-2.5 px-3">पडताळणी करणारे</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {formatDate(h.reconciliation_date, lang)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrency(h.opening_cash)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                    +{formatCurrency(h.cash_income)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                    -{formatCurrency(h.cash_expense)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(h.expected_closing)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-amber-700 dark:text-amber-400">
                    {formatCurrency(h.actual_closing)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        h.difference === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {h.difference === 0 ? '0' : `₹ ${h.difference}`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {h.verified_by_name || 'खजिनदार'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CashManagementPage;
