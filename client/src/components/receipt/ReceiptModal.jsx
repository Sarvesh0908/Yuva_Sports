import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { DigitalReceipt } from './DigitalReceipt';
import { useLanguage } from '../../context/LanguageContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/dateUtils';
import { Share2, Download, Printer, Copy, Check, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function ReceiptModal({ isOpen, onClose, receipt }) {
  const { t, lang } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!receipt) return null;

  const mandalName = mandal?.name_mr || 'श्री गणेश मित्र मंडळ';
  const verificationUrl = `${window.location.origin}/verify-receipt/${receipt.receipt_number}`;

  // WhatsApp formatted messages
  const getWhatsAppMessage = () => {
    if (lang === 'en') {
      return `🙏 *Greetings ${receipt.donor_name}*,

Thank you wholeheartedly for your contribution to *${mandal?.name_en || 'Shree Ganesh Mitra Mandal'}*.

🧾 *Receipt No:* ${receipt.receipt_number}
💰 *Amount:* ₹${Number(receipt.amount).toLocaleString('en-IN')}
📅 *Date:* ${formatDate(receipt.created_at, 'en')}
🎯 *Purpose:* ${receipt.purpose || 'Ganpati Festival Contribution'}

🔗 *Verify & View Digital Receipt:*
${verificationUrl}

🚩 *Ganpati Bappa Morya! Mangalmurti Morya!* 🙏`;
    }

    if (lang === 'hi') {
      return `🙏 *नमस्कार ${receipt.donor_name} जी*,

*${mandalName}* गणेशोत्सव के लिए आपके द्वारा दिए गए चंदे/दान के लिए हार्दिक धन्यवाद।

🧾 *रसीद क्र:* ${receipt.receipt_number}
💰 *राशि:* ₹${Number(receipt.amount).toLocaleString('en-IN')}
📅 *दिनांक:* ${formatDate(receipt.created_at, 'hi')}
🎯 *उद्देश्य:* ${receipt.purpose || 'गणेशोत्सव चंदा'}

🔗 *डिजिटल रसीद देखें व सत्यापित करें:*
${verificationUrl}

🚩 *गणपति बाप्पा मोरया! मंगलमूर्ति मोरया!* 🙏`;
    }

    // Default Marathi
    return `🙏 *नमस्कार ${receipt.donor_name}*,

*${mandalName}* गणेशोत्सवासाठी आपण दिलेल्या वर्गणी/देणगीबद्दल मनःपूर्वक धन्यवाद!

🧾 *पावती क्र:* ${receipt.receipt_number}
💰 *रक्कम:* ₹${Number(receipt.amount).toLocaleString('en-IN')}
📅 *दिनांक:* ${formatDate(receipt.created_at, 'mr')}
🎯 *उद्देश:* ${receipt.purpose || 'गणेशोत्सव वर्गणी'}

🔗 *आपली अधिकृत डिजिटल पावती येथे पहा:*
${verificationUrl}

आपले सहकार्य आमच्यासाठी मोलाचे आहे.

🚩 *गणपती बाप्पा मोरया! मंगलमूर्ती मोरया!* 🙏`;
  };

  const handleWhatsAppShare = () => {
    const rawMobile = receipt.mobile ? receipt.mobile.replace(/\D/g, '') : '';
    // Format to 91XXXXXXXXXX if standard 10 digit Indian number
    const formattedMobile = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;

    const message = getWhatsAppMessage();
    const encodedText = encodeURIComponent(message);

    let url = '';
    if (formattedMobile) {
      url = `https://wa.me/${formattedMobile}?text=${encodedText}`;
    } else {
      url = `https://wa.me/?text=${encodedText}`;
    }

    window.open(url, '_blank');
    showToast('WhatsApp उघडत आहे...', 'success');
  };

  const handleCopyMessage = () => {
    const message = getWhatsAppMessage();
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    showToast('पावती संदेश क्लिपबोर्डवर कॉपी झाला!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExporting(true);
      showToast('PDF तयार होत आहे...', 'info');

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const imgWidth = 148;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Receipt_${receipt.receipt_number}.pdf`);
      showToast('पावती PDF यशस्वीरित्या डाऊनलोड झाली!', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF डाऊनलोड करताना त्रुटी आली.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('receipt.title', 'डिजिटल वर्गणी पावती')}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-slate-800/60 border border-amber-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Direct Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all duration-150 transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              {t('receipt.sendOnWhatsApp', 'WhatsApp वर पाठवा')}
            </button>

            {/* Download PDF */}
            <button
              disabled={isExporting}
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm transition-all duration-150"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'डाऊनलोड...' : t('receipt.downloadPdf', 'PDF डाऊनलोड')}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 font-semibold text-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              {t('receipt.print', 'प्रिंट')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy WhatsApp Text */}
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {isCopied ? t('receipt.copied', 'कॉपी झाले!') : t('receipt.copyMessage', 'संदेश कॉपी करा')}
            </button>
          </div>
        </div>

        {/* Printable Digital Receipt Card */}
        <div className="overflow-x-auto pb-2">
          <DigitalReceipt
            receipt={receipt}
            mandal={mandal}
            receiptRef={receiptRef}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ReceiptModal;
