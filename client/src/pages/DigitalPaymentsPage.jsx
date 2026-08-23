import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../utils/formatCurrency';
import {
  QrCode,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  IndianRupee,
  ShieldCheck,
  Building,
  Smartphone
} from 'lucide-react';

export function DigitalPaymentsPage() {
  const { t, lang } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();

  const [amount, setAmount] = useState(501);
  const [note, setNote] = useState('श्री गणेशोत्सव देणगी');
  const [isCopied, setIsCopied] = useState(false);

  const upiId = mandal?.upi_id || 'ganeshmandal@sbi';
  const upiName = mandal?.upi_name || 'Shree Ganesh Mitra Mandal Trust';

  const upiUri = amount > 0
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
    : `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR&tn=${encodeURIComponent(note)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    showToast(`UPI आयडी (${upiId}) कॉपी झाला!`, 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrintStandee = () => {
    window.print();
  };

  const quickAmounts = [101, 251, 501, 1001, 2100, 5001, 11000];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.digitalPayments', 'UPI व डिजिटल पेमेंट ट्रॅकिंग (Digital Payments)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            मंडळाचा अधिकृत UPI QR कोड, स्टँडी प्रिंट व डिजिटल संकलन
          </p>
        </div>

        <button
          onClick={handlePrintStandee}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>स्टँडी प्रिंट करा (Print Standee)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Interactive QR Code Standee Card */}
        <div className="printable-area rounded-3xl bg-white dark:bg-slate-900 border-4 border-amber-500 p-6 sm:p-8 shadow-2xl text-center space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 font-marathi">
              {mandal?.name_mr || 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड'}
            </h3>
            <p className="text-xs text-slate-500">
              {mandal?.address_mr}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl border-2 border-amber-400 shadow-festive inline-block mx-auto">
            <QRCodeSVG value={upiUri} size={210} level="H" />
          </div>

          {/* Amount Badge */}
          {amount > 0 && (
            <div className="inline-block px-4 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-base border border-emerald-300 dark:border-emerald-800">
              रक्कम: ₹ {Number(amount).toLocaleString('en-IN')}
            </div>
          )}

          {/* UPI Information */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 text-left text-xs space-y-1">
            <div>
              <span className="text-slate-500">खाते नाव: </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{upiName}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-500">UPI ID: </span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{upiId}</span>
              </div>
              <button
                onClick={handleCopyUpi}
                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px]"
              >
                {isCopied ? 'कॉपी!' : 'कॉपी'}
              </button>
            </div>
          </div>

          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 font-marathi">
            🚩 गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🚩
          </p>
        </div>

        {/* Right: Dynamic Amount Adjuster & Instructions */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>QR कोड रक्कम बदला (Dynamic QR Amount)</span>
            </h3>

            {/* Quick chips */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                त्वरित रक्कम निवडा:
              </label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      amount === amt
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    ₹ {amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                इतर ऐच्छिक रक्कम (₹):
              </label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="रक्कम टाका..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500 text-base"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                संकल्प / संदेश (Payment Note):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="श्री गणेशोत्सव देणगी"
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Payment Instructions Card */}
          <div className="rounded-3xl bg-amber-500/10 border border-amber-400/30 p-6 space-y-3">
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              सुरक्षित डिजिटल पेमेंट मार्गदर्शक
            </h4>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
              <li>भाविकांनी QR कोड स्कॅन करून थेट मंडळाच्या अधिकृत ट्रस्ट खात्यात पैसे जमा करावेत.</li>
              <li>पेमेंट पूर्ण झाल्यानंतर देणगीदाराला त्वरित डिजिटल पावती व WhatsApp मेसेज पाठवावा.</li>
              <li>हा QR कोड A4 किंवा स्टँडी आकारात प्रिंट करून मुख्य मंडप काउंटरवर लावता येतो.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitalPaymentsPage;
