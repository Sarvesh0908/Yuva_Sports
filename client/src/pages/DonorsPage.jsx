import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Modal } from '../components/common/Modal';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import {
  Users,
  Search,
  PlusCircle,
  Download,
  Eye,
  Smartphone,
  MapPin,
  History,
  MessageCircle,
  IndianRupee,
  UserCheck
} from 'lucide-react';

export function DonorsPage() {
  const { t, lang } = useLanguage();
  const { showToast } = useNotification();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ totalDonors: 0, grandTotal: 0 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Add Donor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Profile / History Modal
  const [selectedDonorProfile, setSelectedDonorProfile] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donors', { page, limit: 15, search });
      if (res.success) {
        setDonors(res.data || []);
        setSummary(res.summary || { totalDonors: 0, grandTotal: 0 });
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('fetchDonors error:', err);
      showToast('देणगीदार यादी लोड करताना त्रुटी.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [page, search]);

  const handleAddDonor = async (e) => {
    e.preventDefault();
    if (!donorName.trim() || !mobile.trim()) {
      showToast('कृपया नाव आणि मोबाईल क्रमांक भरा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/donors', {
        name: donorName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        address: address.trim(),
        area: area.trim(),
        notes: notes.trim()
      });

      if (res.success) {
        showToast('देणगीदार यशस्वीरित्या जोडला!', 'success');
        setShowAddModal(false);
        setDonorName('');
        setMobile('');
        setEmail('');
        setAddress('');
        setArea('');
        setNotes('');
        fetchDonors();
      }
    } catch (err) {
      showToast(err.message || 'नोंदणी करताना त्रुटी.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDonorProfile = async (id) => {
    try {
      const res = await api.get(`/donors/${id}`);
      if (res.success && res.data) {
        setSelectedDonorProfile(res.data);
      }
    } catch (err) {
      showToast('माहिती मिळवता आली नाही.', 'error');
    }
  };

  const handleDirectWhatsApp = (donor) => {
    const rawMobile = donor.mobile ? donor.mobile.replace(/\D/g, '') : '';
    const formatted = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;
    const text = encodeURIComponent(`🙏 नमस्कार ${donor.name},\n\nश्री गणेश मित्र मंडळाच्या उपक्रमांमध्ये आपले स्वागत आहे.\nगणपती बाप्पा मोरया! 🚩`);
    window.open(`https://wa.me/${formatted}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.donors', 'देणगीदार यादी (Donor Directory)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            एकूण देणगीदार: <span className="font-bold text-slate-900 dark:text-white">{summary.totalDonors}</span> • एकूण संकलन: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.grandTotal)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/reports/export/donors"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV एक्सेल</span>
          </a>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-festive hover:from-orange-500 hover:to-amber-500 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ देणगीदार जोडा</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
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
            placeholder="नाव, मोबाईल, पत्ता किंवा परिसर शोधा..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Donors Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">देणगीदाराचे नाव</th>
                <th className="py-3 px-4">मोबाईल</th>
                <th className="py-3 px-4">परिसर / पत्ता</th>
                <th className="py-3 px-4 text-center">वेळा वर्गणी</th>
                <th className="py-3 px-4 text-right">एकूण योगदान (₹)</th>
                <th className="py-3 px-4 text-center">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    लोड होत आहे...
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    कोणतेही देणगीदार सापडले नाहीत.
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{d.name}</p>
                      {d.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{d.notes}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {d.mobile ? `+91 ${d.mobile}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {d.area || d.address || 'पुणे'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {d.donations_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-amber-700 dark:text-amber-400 text-sm">
                        {formatCurrency(d.total_donated)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDonorProfile(d.id)}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                          title="माहिती व इतिहास पहा"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {d.mobile && (
                          <button
                            onClick={() => handleDirectWhatsApp(d)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="WhatsApp मेसेज"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
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

      {/* Add Donor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="+ नवीन देणगीदार जोडा"
        subtitle="देणगीदाराची वैयक्तिक माहिती नोंदवा"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddDonor} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पूर्ण नाव *</label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="उदा. अमोल रमेश पाटील"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">मोबाईल क्रमांक *</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="98230XXXXX"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">परिसर / पेठ</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="उदा. कसबा पेठ"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पत्ता</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="फ्लॅट क्र., सोसायटी..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              {isSubmitting ? 'जतन होत आहे...' : 'जतन करा'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Donor History Profile Modal */}
      <Modal
        isOpen={!!selectedDonorProfile}
        onClose={() => setSelectedDonorProfile(null)}
        title={selectedDonorProfile?.donor?.name}
        subtitle={`मोबाईल: ${selectedDonorProfile?.donor?.mobile || '-'} • परिसर: ${selectedDonorProfile?.donor?.area || 'पुणे'}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">एकूण दिलेली वर्गणी / देणगी:</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {formatCurrency(selectedDonorProfile?.donor?.total_donated)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">एकूण पावत्या: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDonorProfile?.donor?.donations_count}</span></p>
            </div>
          </div>

          {/* History List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              मागील वर्गणी व देणगी इतिहास
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b text-slate-500">
                  <tr>
                    <th className="p-2.5">पावती क्र.</th>
                    <th className="p-2.5">दिनांक</th>
                    <th className="p-2.5">उद्देश</th>
                    <th className="p-2.5 text-right">रक्कम (₹)</th>
                    <th className="p-2.5 text-center">पावती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedDonorProfile?.history || []).map((h) => (
                    <tr key={h.id}>
                      <td className="p-2.5 font-mono font-bold text-amber-800 dark:text-amber-400">{h.receipt_number}</td>
                      <td className="p-2.5 text-slate-500">{formatDate(h.created_at, lang)}</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">{h.purpose || 'वर्गणी'}</td>
                      <td className="p-2.5 text-right font-black text-emerald-600">{formatCurrency(h.amount)}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={async () => {
                            try {
                              const r = await api.get(`/receipts/number/${h.receipt_number}`);
                              if (r.success && r.data?.receipt) {
                                setSelectedReceipt(r.data.receipt);
                              }
                            } catch {
                              showToast('पावती मिळवता आली नाही.', 'error');
                            }
                          }}
                          className="p-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Receipt Preview */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}

export default DonorsPage;
