import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import { GanpatiLogo } from '../components/common/GanpatiLogo';
import { Lock, Smartphone, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState(location.state?.registeredMobile || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (location.state?.registeredMobile) {
      setIdentifier(location.state.registeredMobile);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('कृपया मोबाईल / ईमेल आणि पासवर्ड टाका.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await login(identifier.trim(), password.trim());
    setIsSubmitting(false);

    if (res.success) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      showToast('लॉगिन यशस्वी! गणपती बाप्पा मोरया! 🙏', 'success');
      navigate(from, { replace: true });
    } else {
      showToast(res.message || 'लॉगिन अयशस्वी झाले. कृपया तपशील तपासा.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-900 via-orange-950 to-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

      {/* Language Bar Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs z-20">
        <button
          type="button"
          onClick={() => setLang('mr')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
            lang === 'mr' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          मराठी
        </button>
        <button
          type="button"
          onClick={() => setLang('hi')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
            lang === 'hi' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          हिंदी
        </button>
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
            lang === 'en' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          English
        </button>
      </div>

      <div className="w-full max-w-md my-8 relative z-10">
        {/* Card Box */}
        <div className="rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-block mx-auto mb-1">
              <GanpatiLogo size="lg" />
            </div>
            <p className="text-xs font-bold text-amber-400 tracking-wider">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <h1 className="text-2xl font-black text-white font-marathi tracking-tight">
              {mandal?.name_mr || 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड'}
            </h1>
            <p className="text-xs text-amber-200/80 font-medium">
              गणपती मंडळ आर्थिक व वर्गणी व्यवस्थापन प्रणाली
            </p>
          </div>

          {/* Registration Success Banner */}
          {location.state?.justRegistered && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-xs">नोंदणी यशस्वी झाली! 🚩</p>
                <p className="text-emerald-200/90 text-[11px] mt-0.5">
                  आपले स्वागत आहे, <strong>{location.state.registeredName}</strong>. कृपया आपला पासवर्ड टाकून डॅशबोर्डवर लॉगिन करा.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                मोबाईल किंवा ईमेल (Mobile / Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="मोबाईल किंवा ईमेल टाका..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                पासवर्ड (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-festive flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'लॉगिन होत आहे...' : 'लॉगिन करा (Sign In)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Registration Link */}
          <div className="text-center text-xs text-slate-400">
            <span>नवीन सभासद आहात? </span>
            <Link to="/register" className="font-bold text-amber-400 hover:text-amber-300 hover:underline">
              येथे नोंदणी करा (Register)
            </Link>
          </div>

          {/* Security & Access Info */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>अधिकृत मंडळ व्यवस्थापन पोर्टल</span>
            </div>
            <p className="text-[11px] text-slate-400">
              प्रवेश अधिकृत मंडळ विश्वस्त, खजिनदार, सचिव व नोंदणीकृत सभासदांसाठी आहे.
            </p>
          </div>

          {/* Devotional Shloka Footer */}
          <div className="text-center pt-1">
            <p className="text-[11px] font-medium text-amber-300/80 italic font-marathi">
              "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।<br />
              निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
