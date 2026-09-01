import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { downloadCsvReport } from '../utils/exportCsv';
import { Badge } from '../components/common/Badge';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import { Modal } from '../components/common/Modal';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

export function TransactionsPage() {
  const { t, lang } = useLanguage();
  const { showToast } = useNotification();

  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [previewBillUrl, setPreviewBillUrl] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [incRes, expRes] = await Promise.all([
        api.get('/income', { limit: 100 }),
        api.get('/expenses', { limit: 100 })
      ]);

      const incomeItems = (incRes.data || []).map(i => ({
        id: `inc-${i.id}`,
        dbId: i.id,
        type: 'income',
        code: i.receipt_number || i.transaction_id,
        party: i.donor_name,
        contact: i.mobile,
        amount: i.amount,
        category: i.category,
        paymentMethod: i.payment_method,
        purpose: i.purpose,
        status: i.status,
        date: i.created_at,
        receiptNumber: i.receipt_number
      }));

      const expenseItems = (expRes.data || []).map(e => ({
        id: `exp-${e.id}`,
        dbId: e.id,
        type: 'expense',
        code: e.expense_id,
        party: e.paid_to,
        contact: e.bill_number,
        amount: e.amount,
        category: e.category,
        paymentMethod: e.payment_method,
        purpose: e.description,
        status: e.status,
        date: e.created_at,
        billUrl: e.bill_attachment_url
      }));

      const combined = [...incomeItems, ...expenseItems].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTransactions(combined);
    } catch (err) {
      console.error('fetchTransactions error:', err);
      showToast('व्यवहार लोड करताना अडचण आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchParty = (item.party || '').toLowerCase().includes(q);
      const matchCode = (item.code || '').toLowerCase().includes(q);
      const matchPurpose = (item.purpose || '').toLowerCase().includes(q);
      return matchParty || matchCode || matchPurpose;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.transactions', 'व्यवहार इतिहास (Transaction History)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            जमा आणि खर्चाचा एकत्रित मास्टर लेजर
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                showToast('जमा CSV डाऊनलोड होत आहे...', 'info');
                await downloadCsvReport('income');
                showToast('जमा CSV यशस्वीरित्या डाऊनलोड झाला!', 'success');
              } catch (err) {
                showToast(err.message || 'डाऊनलोड करताना त्रुटी.', 'error');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>जमा CSV</span>
          </button>
          <button
            onClick={async () => {
              try {
                showToast('खर्च CSV डाऊनलोड होत आहे...', 'info');
                await downloadCsvReport('expenses');
                showToast('खर्च CSV यशस्वीरित्या डाऊनलोड झाला!', 'success');
              } catch (err) {
                showToast(err.message || 'डाऊनलोड करताना त्रुटी.', 'error');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>खर्च CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            सर्व व्यवहार ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>जमा</span>
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>खर्च</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="नाव, क्रमांक किंवा वर्णन शोधा..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">प्रकार</th>
                <th className="py-3 px-4">आयडी / दिनांक</th>
                <th className="py-3 px-4">व्यक्ती / संस्था / विक्रेता</th>
                <th className="py-3 px-4">उद्देश / वर्ग</th>
                <th className="py-3 px-4">पेमेंट</th>
                <th className="py-3 px-4 text-right">रक्कम (₹)</th>
                <th className="py-3 px-4 text-center">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    लोड होत आहे...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    कोणतेही व्यवहार सापडले नाहीत.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      {item.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          <ArrowUpRight className="w-3 h-3" /> जमा
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          <ArrowDownRight className="w-3 h-3" /> खर्च
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(item.date, lang)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{item.party}</p>
                      {item.contact && (
                        <span className="text-[10px] text-slate-400">{item.contact}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge value={item.category} />
                      {item.purpose && (
                        <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                          {item.purpose}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge value={item.paymentMethod} type="payment" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-black text-sm ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.type === 'income' && item.receiptNumber && (
                        <button
                          onClick={async () => {
                            try {
                              const r = await api.get(`/receipts/number/${item.receiptNumber}`);
                              if (r.success && r.data?.receipt) {
                                setSelectedReceipt(r.data.receipt);
                              }
                            } catch {
                              showToast('पावती मिळवता आली नाही.', 'error');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                          title="पावती पहा"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.type === 'expense' && item.billUrl && (
                        <button
                          onClick={() => setPreviewBillUrl(item.billUrl)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 hover:bg-slate-200 transition-colors"
                          title="बिल पहा"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />

      {/* Bill Preview Modal */}
      <Modal
        isOpen={!!previewBillUrl}
        onClose={() => setPreviewBillUrl(null)}
        title="बिल / पावती फोटो"
        maxWidth="max-w-2xl"
      >
        <div className="flex items-center justify-center p-2">
          <img
            src={previewBillUrl}
            alt="Bill"
            className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md border"
          />
        </div>
      </Modal>
    </div>
  );
}

export default TransactionsPage;
