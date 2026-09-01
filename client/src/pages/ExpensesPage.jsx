import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { downloadCsvReport } from '../utils/exportCsv';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  Download,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

export function ExpensesPage() {
  const { t, lang } = useLanguage();
  const { isAdmin, isTreasurer } = useAuth();
  const { showToast } = useNotification();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ total: 0, totalAmount: 0, approvedAmount: 0, pendingAmount: 0 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewBillUrl, setPreviewBillUrl] = useState(null);

  // Form State
  const [expenseCategory, setExpenseCategory] = useState('mandap');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidTo, setPaidTo] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [billFile, setBillFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses', {
        page,
        limit: 15,
        search,
        category,
        status
      });
      if (res.success) {
        setExpenses(res.data || []);
        setSummary(res.summary || { total: 0, totalAmount: 0, approvedAmount: 0, pendingAmount: 0 });
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('fetchExpenses error:', err);
      showToast('खर्च यादी लोड करताना त्रुटी.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, search, category, status]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !paidTo.trim() || !amount || Number(amount) <= 0) {
      showToast('कृपया आवश्यक माहिती (वर्णन, कोणाला दिले, वैध रक्कम) भरा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('category', expenseCategory);
      formData.append('description', description.trim());
      formData.append('amount', amount);
      formData.append('payment_method', paymentMethod);
      formData.append('paid_to', paidTo.trim());
      formData.append('bill_number', billNumber.trim());
      formData.append('notes', notes.trim());
      if (billFile) {
        formData.append('bill_attachment', billFile);
      }

      const res = await api.post('/expenses', formData);
      if (res.success) {
        showToast(res.message || 'खर्च यशस्वीरित्या नोंदवला!', 'success');
        setShowAddModal(false);
        // Reset form
        setDescription('');
        setAmount('');
        setPaidTo('');
        setBillNumber('');
        setNotes('');
        setBillFile(null);
        fetchExpenses();
      }
    } catch (err) {
      console.error('handleAddExpense error:', err);
      showToast(err.message || 'नोंदवताना त्रुटी.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await api.put(`/expenses/${id}/approve`, {});
      if (res.success) {
        showToast('खर्च मंजूर केला!', 'success');
        fetchExpenses();
      }
    } catch (err) {
      showToast('मंजूर करताना त्रुटी.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('आपणास खात्री आहे की हा खर्च व्यवहार हटवायचा आहे?')) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.success) {
        showToast('खर्च हटवला.', 'success');
        fetchExpenses();
      }
    } catch (err) {
      showToast('हटवताना त्रुटी.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            {t('nav.expenses', 'खर्च व्यवस्थापन (Expenses)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            एकूण मंजूर खर्च: <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(summary.approvedAmount)}</span> • प्रलंबित: <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(summary.pendingAmount)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <span>CSV एक्सेल</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md hover:from-rose-500 hover:to-orange-500 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ खर्च नोंदवा</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="खर्च वर्णन, कोणाला दिले, बिल क्र. शोधा..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">सर्व खर्च प्रकार (All Categories)</option>
            <option value="mandap">मंडप व स्टेज (Mandap)</option>
            <option value="idol">श्री गणेश मूर्ती (Idol)</option>
            <option value="sound_system">साउंड सिस्टीम (Sound)</option>
            <option value="lighting">विद्युत रोषणाई (Lighting)</option>
            <option value="prasad">महाप्रसाद व भोजन (Prasad)</option>
            <option value="flowers">फुल सजावट व हार (Flowers)</option>
            <option value="printing">छपाई व स्टेशनरी (Printing)</option>
            <option value="security">सुरक्षा व सीसीटीव्ही (Security)</option>
            <option value="cultural">सांस्कृतिक कार्यक्रम (Cultural)</option>
            <option value="transport">वाहतूक व टेम्पो (Transport)</option>
            <option value="other">इतर (Other)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">सर्व स्थिती (All Status)</option>
            <option value="pending">प्रलंबित (Pending)</option>
            <option value="approved">मंजूर (Approved)</option>
            <option value="paid">अदा केले (Paid)</option>
            <option value="rejected">नामंजूर (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">खर्च आयडी / दिनांक</th>
                <th className="py-3 px-4">खर्च तपशील</th>
                <th className="py-3 px-4">प्रकार</th>
                <th className="py-3 px-4">कोणाला दिले</th>
                <th className="py-3 px-4 text-right">रक्कम (₹)</th>
                <th className="py-3 px-4">स्थिती</th>
                <th className="py-3 px-4 text-center">बिल / कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    लोड होत आहे...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    कोणतेही खर्च सापडले नाहीत.
                  </td>
                </tr>
              ) : (
                expenses.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {row.expense_id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(row.created_at, lang)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{row.description}</p>
                      {row.bill_number && (
                        <p className="text-[10px] text-slate-400">बिल क्र: {row.bill_number}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge value={row.category} />
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {row.paid_to}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                        - {formatCurrency(row.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge value={row.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.bill_attachment_url && (
                          <button
                            onClick={() => setPreviewBillUrl(row.bill_attachment_url)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                            title="बिल फोटो पहा"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Approver Action Button */}
                        {(isAdmin || isTreasurer) && row.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(row.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="मंजूर करा"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="हटवा"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="+ नवीन खर्च नोंदवा"
        subtitle="साहित्य, मूर्ती, डेकोरेशन किंवा इतर खर्चाची नोंद"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">खर्चाचे नाव / वर्णन *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="उदा. मंडप उभारणी ॲडव्हान्स / साउंड सिस्टीम भाडे"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">खर्च प्रकार (Category)</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="mandap">मंडप व स्टेज (Mandap)</option>
                <option value="idol">श्री गणेश मूर्ती (Idol)</option>
                <option value="sound_system">साउंड सिस्टीम (Sound)</option>
                <option value="lighting">विद्युत रोषणाई (Lighting)</option>
                <option value="prasad">महाप्रसाद व भोजन (Prasad)</option>
                <option value="flowers">फुल सजावट व हार (Flowers)</option>
                <option value="printing">छपाई व स्टेशनरी (Printing)</option>
                <option value="security">सुरक्षा व सीसीटीव्ही (Security)</option>
                <option value="cultural">सांस्कृतिक कार्यक्रम (Cultural)</option>
                <option value="transport">वाहतूक व टेम्पो (Transport)</option>
                <option value="other">इतर (Other)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">रक्कम (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-rose-600 dark:text-rose-400 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">कोणाला पैसे दिले (Paid To) *</label>
              <input
                type="text"
                required
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="दुकानदाराचे / व्यक्तीचे नाव"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पेमेंट पद्धत</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="cash">रोख (Cash)</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">बँक ट्रान्सफर</option>
                <option value="cheque">धनादेश (Cheque)</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">बिल क्र. / व्हाऊचर क्र.</label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="उदा. BILL-891"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">बिल किंवा व्हाऊचर फोटो अपलोड करा</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setBillFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'नोंद होत आहे...' : 'खर्च नोंदवा'}
            </button>
          </div>
        </form>
      </Modal>

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
            alt="Bill Preview"
            className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md border"
          />
        </div>
      </Modal>
    </div>
  );
}

export default ExpensesPage;
