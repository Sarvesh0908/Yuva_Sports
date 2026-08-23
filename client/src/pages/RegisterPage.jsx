import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import { GanpatiLogo } from '../components/common/GanpatiLogo';
import { User, Lock, Smartphone, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function RegisterPage() {
  const { register, isLoading } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('कृपया आपले पूर्ण नाव भरा.', 'warning');
      return;
    }

    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      showToast('कृपया वैध १० अंकी मोबाईल क्रमांक टाका.', 'warning');
      return;
    }

    if (!password || password.length < 6) {
      showToast('पासवर्ड किमान ६ अक्षरांचा असावा.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('दोन्ही पासवर्ड जुळत नाहीत. कृपया तपासा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register(name.trim(), cleanMobile, email.trim(), password);
      if (res.success) {
        showToast('नोंदणी यशस्वी! कृपया आपला पासवर्ड टाकून लॉगिन करा. 🚩', 'success');
        navigate('/login', {
          replace: true,
          state: {
            registeredMobile: cleanMobile,
            registeredName: name.trim(),
            justRegistered: true
          }
        });
      } else {
        showToast(res.message || 'नोंदणी अयशस्वी झाली.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'नोंदणी करताना त्रुटी निर्माण झाली.', 'error');
    } finally {
      setIsSubmitting(false);
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
          <div className="text-center space-y-1.5">
            <div className="inline-block mx-auto mb-1">
              <GanpatiLogo size="md" />
            </div>
            <p className="text-xs font-bold text-amber-400 tracking-wider">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <h1 className="text-xl font-black text-white font-marathi tracking-tight">
              नवीन सभासद नोंदणी
            </h1>
            <p className="text-xs text-amber-200/80 font-medium">
              {mandal?.name_mr || 'श्री गणेश मित्र मंडळ'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                पूर्ण नाव (Full Name) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. राहुल बापूराव पाटील"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                मोबाईल क्रमांक (Mobile Number) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="९८२२०XXXXX (10 अंक)"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500 font-mono"
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                ईमेल पत्ता (Email - ऐच्छिक)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                पासवर्ड (Password) *
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
                  placeholder="किमान ६ अक्षरे..."
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                पासवर्ड पुष्टी (Confirm Password) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="पासवर्ड पुन्हा टाका..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Role Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                नोंदणीनंतर आपले खाते <strong>'सभासद (Member)'</strong> म्हणून सक्रिय होईल. मंडळाचे अध्यक्ष/अ‍ॅडमिन आवश्यकतेनुसार आपल्याला खजिनदार, सचिव किंवा स्वयंसेवक पदाचे अधिकार देतील.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-festive flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'नोंदणी होत आहे...' : 'खाते तयार करा (Register)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-2 text-center text-xs text-slate-400">
            <span>आधीच नोंदणी केली आहे? </span>
            <Link to="/login" className="font-bold text-amber-400 hover:text-amber-300 hover:underline">
              येथे लॉगिन करा (Sign In)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
