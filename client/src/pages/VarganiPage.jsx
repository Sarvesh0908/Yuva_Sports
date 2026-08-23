import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useMandal } from '../context/MandalContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import {
  Receipt,
  Search,
  User,
  Smartphone,
  MapPin,
  IndianRupee,
  CreditCard,
  Sparkles,
  History,
  CheckCircle2,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function VarganiPage() {
  const { t, lang } = useLanguage();
  const { showToast } = useNotification();
  const { mandal } = useMandal();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form State
  const [donorId, setDonorId] = useState(null);
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [amount, setAmount] = useState(501);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [purpose, setPurpose] = useState('गणेशोत्सव वर्गणी');
  const [notes, setNotes] = useState('');

  // Selected Donor History
  const [donorHistory, setDonorHistory] = useState(null);

  // Submitting and Generated Receipt Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get('/donors/search', { q: searchQuery });
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const selectExistingDonor = (donor) => {
    setDonorId(donor.id);
    setDonorName(donor.name);
    setMobile(donor.mobile || '');
    setAddress(donor.address || '');
    setArea(donor.area || '');
    setDonorHistory({
      totalDonated: donor.total_donated,
      donationsCount: donor.donations_count,
      lastDonatedAt: donor.last_donated_at
    });
    setSearchResults([]);
    setSearchQuery('');
    showToast(`देणगीदार "${donor.name}" निवडले.`, 'info');
  };

  const quickAmounts = [101, 251, 501, 1001, 2100, 5001, 11000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!donorName.trim()) {
      showToast('कृपया देणगीदाराचे नाव टाका.', 'warning');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('कृपया वैध वर्गणी रक्कम भरा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/income', {
        donor_id: donorId,
        donor_name: donorName,
        mobile,
        address,
        area,
        amount: numAmount,
        payment_method: paymentMethod,
        category: 'vargani',
        purpose,
        notes
      });

      if (res.success && res.data?.receipt) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        showToast('वर्गणी यशस्वीरित्या जमा झाली व पावती तयार झाली! 🕉️', 'success');
        setGeneratedReceipt(res.data.receipt);

        // Reset form for next fast entry
        setDonorId(null);
        setDonorName('');
        setMobile('');
        setAddress('');
        setArea('');
        setAmount(501);
        setDonorHistory(null);
        setNotes('');
      }
    } catch (err) {
      console.error('Submit vargani error:', err);
      showToast(err.message || 'वर्गणी जतन करताना त्रुटी आली.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('vargani.title', 'जलद वर्गणी संकलन (Fast Collection < 20s)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('vargani.subtitle', 'देणगीदाराची माहिती भरा किंवा शोधा व तत्काळ डिजिटल पावती मिळवा')}
          </p>
        </div>
      </div>

      {/* 1. Instant Search Donor Bar */}
      <div className="relative">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('vargani.searchPlaceholder', 'नाव, मोबाईल किंवा परिसर शोधा... (उदा. रमेश पाटील / 98230...)')}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm shadow-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden z-30">
            {searchResults.map((donor) => (
              <div
                key={donor.id}
                onClick={() => selectExistingDonor(donor)}
                className="p-3.5 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    {donor.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    📞 {donor.mobile || 'मोबाईल नाही'} • 📍 {donor.area || donor.address || 'स्थानिक'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    मागील: {formatCurrency(donor.total_donated)}
                  </span>
                  <p className="text-[10px] text-slate-400">{donor.donations_count} वेळा वर्गणी दिली</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Donor History Banner (if selected) */}
      {donorHistory && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-400/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                मागील योगदान माहिती (Previous Giving History)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                एकूण दिलेली रक्कम: <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(donorHistory.totalDonated)}</span> • {donorHistory.donationsCount} वेळा
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDonorId(null);
              setDonorHistory(null);
            }}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            साफ करा
          </button>
        </div>
      )}

      {/* 3. Main Fast Vargani Entry Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Donor Name */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-600" />
              {t('vargani.donorName', 'देणगीदार / व्यक्तीचे नाव')} *
            </label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="उदा. अमोल रमेश पाटील"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              {t('vargani.mobileNumber', 'मोबाईल क्रमांक (WhatsApp)')}
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="98230XXXXX"
              maxLength={10}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Area / Locality */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              {t('vargani.area', 'परिसर / पेठ')}
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="उदा. कसबा पेठ, शनिवार पेठ"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Address */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('vargani.address', 'पत्ता / घर क्र. / सोसायटी')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="फ्लॅट क्र., सोसायटीचे नाव..."
              className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* 4. Amount Selection & Preset Chips */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
            {t('vargani.amount', 'वर्गणी रक्कम (₹)')} *
          </label>

          {/* Quick Amount Chips */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 ${
                  Number(amount) === amt
                    ? 'bg-amber-600 text-white shadow-festive ring-2 ring-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ₹ {amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {/* Amount input box */}
          <div className="relative max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-600 dark:text-amber-400 font-extrabold text-xl">
              ₹
            </span>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-amber-500/10 border-2 border-amber-400 dark:border-amber-600 text-slate-900 dark:text-white font-black text-2xl tracking-wide focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* 5. Payment Method & Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              {t('vargani.paymentMethod', 'पेमेंट पद्धत')}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="cash">रोख (Cash)</option>
              <option value="upi">UPI (GooglePay / PhonePe / Paytm)</option>
              <option value="bank_transfer">बँक ट्रान्सफर (NEFT / IMPS)</option>
              <option value="cheque">धनादेश (Cheque)</option>
              <option value="other">इतर</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('vargani.purpose', 'उद्देश / संकल्प')}
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="गणेशोत्सव वर्गणी"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* 6. Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white font-black text-base shadow-festive flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>
              {isSubmitting ? t('vargani.saving', 'जतन करत आहे...') : t('vargani.recordAndGenerateReceipt', 'वर्गणी जतन करा व पावती बनवा (Generate Receipt)')}
            </span>
          </button>
        </div>
      </form>

      {/* 7. Generated Receipt & WhatsApp Share Modal */}
      <ReceiptModal
        isOpen={!!generatedReceipt}
        onClose={() => setGeneratedReceipt(null)}
        receipt={generatedReceipt}
      />
    </div>
  );
}

export default VarganiPage;
