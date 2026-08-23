import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';
import logoImg from '../../assets/logo.png';

export function DigitalReceipt({ receipt, mandal, receiptRef }) {
  const { lang } = useLanguage();

  if (!receipt) return null;

  const currentMandal = mandal || {
    name_mr: 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड',
    name_en: 'Yuva Sports Ganeshostav Mandal, Dattawad',
    tagline_mr: 'स्थापना: १९८८ | ! नवे पर्व युवा सर्व !',
    address_mr: 'युवा स्पोर्ट्स चौक, दत्तवाड | ४१६१०७ , महाराष्ट्र |',
    contact_phone: '+91 9699049637',
    registration_no: 'MAH/PUNE/1992/F-1024',
    festival_year: 2026
  };

  const verificationUrl = `${window.location.origin}/verify-receipt/${receipt.receipt_number}`;

  return (
    <div
      ref={receiptRef}
      className="printable-area bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-4 border-amber-500 shadow-2xl relative max-w-2xl mx-auto overflow-hidden font-sans"
    >
      {/* Decorative Ornate Corner Borders */}
      <div className="absolute top-2 left-2 text-amber-500 text-lg select-none">❖</div>
      <div className="absolute top-2 right-2 text-amber-500 text-lg select-none">❖</div>
      <div className="absolute bottom-2 left-2 text-amber-500 text-lg select-none">❖</div>
      <div className="absolute bottom-2 right-2 text-amber-500 text-lg select-none">❖</div>

      {/* Header Banner */}
      <div className="border-b-2 border-amber-400/60 pb-4 relative">
        <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-sm mb-1 text-center">
          <span>॥ श्री गणेशाय नमः ॥</span>
        </div>

        <div className="flex items-center justify-center gap-4 text-center sm:text-left">
          <img
            src={logoImg}
            alt="Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-amber-500 shadow-md flex-shrink-0"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-800 tracking-wide font-marathi">
              {currentMandal.name_mr}
            </h1>
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
              {currentMandal.name_en}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-amber-600 font-extrabold mt-0.5">
              {currentMandal.tagline_mr}
            </p>
          </div>
        </div>

        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium text-center mt-2">
          पत्ता: {currentMandal.address_mr} | संपर्क: {currentMandal.contact_phone}
        </p>

        {/* Festival Badge */}
        <div className="text-center mt-2">
          <span className="inline-block px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-extrabold">
            गणेशोत्सव वर्ष {currentMandal.festival_year} | अधिकृत वर्गणी पावती
          </span>
        </div>
      </div>

      {/* Receipt Meta (No & Date) */}
      <div className="grid grid-cols-2 gap-2 my-4 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
        <div>
          <span className="text-slate-500 font-medium">पावती क्र. / Receipt No: </span>
          <span className="font-mono font-bold text-amber-800 text-sm ml-1">
            {receipt.receipt_number}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 font-medium">दिनांक / Date: </span>
          <span className="font-bold text-slate-800 ml-1">
            {formatDate(receipt.created_at, lang)}
          </span>
        </div>
      </div>

      {/* Main Donor & Amount Body */}
      <div className="space-y-3.5 text-sm py-1">
        {/* Donor Name */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-dashed border-slate-200 pb-2">
          <span className="text-slate-500 font-medium min-w-[130px]">
            श्री / सौ / मे. (Received From):
          </span>
          <span className="font-extrabold text-slate-900 text-base">
            {receipt.donor_name}
          </span>
        </div>

        {/* Mobile & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-dashed border-slate-200 pb-2 text-xs">
          <div>
            <span className="text-slate-500 font-medium">मोबाईल / Mobile: </span>
            <span className="font-semibold text-slate-800 font-mono">
              {receipt.mobile ? `+91 ${receipt.mobile}` : 'नोंद नाही'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">पत्ता / Address: </span>
            <span className="font-semibold text-slate-800">
              {receipt.address || 'स्थानिक'}
            </span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">
              जमा रक्कम (Amount Received)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-700">
              {formatCurrency(receipt.amount)}
            </span>
          </div>

          <div className="text-right text-xs">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 font-bold uppercase">
              {receipt.payment_method}
            </span>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border-b border-dashed border-slate-200 pb-2 text-xs">
          <span className="text-slate-500 font-medium">अक्षरी रक्कम (In Words): </span>
          <span className="font-bold text-slate-800 block sm:inline mt-0.5 sm:mt-0 font-marathi">
            {receipt.amount_in_words_mr || receipt.amount_in_words_en}
          </span>
        </div>

        {/* Purpose */}
        <div className="border-b border-dashed border-slate-200 pb-2 text-xs">
          <span className="text-slate-500 font-medium">उद्देश / Purpose: </span>
          <span className="font-semibold text-slate-800">
            {receipt.purpose || 'श्री गणेशोत्सव वर्गणी / देणगी'}
          </span>
        </div>
      </div>

      {/* Footer Section with QR and Signatures */}
      <div className="mt-5 pt-3 border-t-2 border-amber-300 grid grid-cols-12 items-center gap-4">
        {/* Verification QR Code */}
        <div className="col-span-4 sm:col-span-3 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200">
          <QRCodeSVG value={verificationUrl} size={70} level="M" />
          <span className="text-[9px] text-slate-500 font-bold mt-1 text-center leading-tight">
            पडताळणी QR कोड
          </span>
        </div>

        {/* Thank You & Blessing */}
        <div className="col-span-8 sm:col-span-5 text-center sm:text-left space-y-1">
          <p className="text-[11px] font-bold text-amber-800 leading-snug font-marathi">
            "श्री गणेशाच्या आशीर्वादाने आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद."
          </p>
          <p className="text-xs font-black text-amber-600">
            🚩 गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🚩
          </p>
        </div>

        {/* Stamp & Collector Sign */}
        <div className="col-span-12 sm:col-span-4 text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
          <div className="inline-block text-center">
            <div className="w-24 h-10 border-b border-slate-400 mx-auto flex items-end justify-center pb-1">
              <span className="text-[10px] font-serif text-slate-600 italic">Digitally Signed</span>
            </div>
            <p className="text-[11px] font-bold text-slate-800 mt-1">
              {receipt.collector_name || 'खजिनदार / प्रतिनिधी'}
            </p>
            <p className="text-[9px] text-slate-500 uppercase font-semibold">
              श्री गणेश मित्र मंडळ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitalReceipt;
