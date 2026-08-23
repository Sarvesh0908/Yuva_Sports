import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { GanpatiLogo } from '../components/common/GanpatiLogo';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import { UpiQrModal } from '../components/upi/UpiQrModal';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Receipt,
  Users,
  Clock,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  Sparkles,
  Award,
  CheckCircle,
  PlusCircle,
  ShieldAlert,
  Info,
  CalendarDays,
  UserCheck,
  HeartHandshake,
  FileCheck2,
  Phone,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export function DashboardPage() {
  const { t, lang } = useLanguage();
  const { user, isMember } = useAuth();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('fetchDashboard error:', err);
      showToast('डॅशबोर्ड डेटा लोड करताना अडचण आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const COLORS = ['#ea580c', '#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500">डॅशबोर्ड लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  const summary = stats?.summary || {};
  const topDonors = stats?.topDonors || [];
  const recentTransactions = stats?.recentTransactions || [];
  const upcomingEvents = stats?.upcomingEvents || [];
  const dailyTrend = stats?.dailyTrend || [];
  const paymentMethods = stats?.paymentMethods || [];
  const expenseCategories = stats?.expenseCategories || [];

  // ==========================================
  // 1. MEMBER-SPECIFIC DASHBOARD VIEW
  // ==========================================
  if (isMember) {
    return (
      <div className="space-y-6">
        {/* Royal Hero Header */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border-2 border-amber-500/40 p-6 sm:p-7 shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 sm:gap-6 text-center sm:text-left flex-col sm:flex-row z-10">
            <GanpatiLogo size="xl" glow={true} />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                ॥ श्री गणेशाय नमः ॥
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi tracking-tight">
                {mandal?.name_mr || 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड'}
              </h2>
              <p className="text-xs sm:text-sm font-extrabold text-amber-300">
                {mandal?.tagline_mr || '! नवे पर्व युवा सर्व !'}
              </p>
              <p className="text-xs text-slate-300 pt-1">
                स्वागतम्, <strong>{user?.name || 'सभासद'}</strong>! (उत्सव वर्ष {mandal?.festival_year || 2026})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={() => setShowUpiModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-white font-black text-xs sm:text-sm shadow-festive transition-all transform hover:scale-105 active:scale-95 border border-amber-300/40"
            >
              <QrCode className="w-4 h-4" />
              <span>+ ऑनलाईन देणगी (UPI QR)</span>
            </button>
          </div>
        </div>

        {/* Role & Access Explanation Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                आपले अधिकृत खाते: <strong>सभासद (Member)</strong> 👤
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                आपण मंडळाचे उत्सव कार्यक्रम, आरती वेळापत्रक व समिती सदस्य पाहू शकता. वर्गणी जमा किंवा खर्च मंजुरी अधिकारांसाठी कृपया मंडळाच्या अध्यक्षांशी संपर्क साधा.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-200/60 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap self-start sm:self-auto">
            सक्रिय सभासद
          </span>
        </div>

        {/* Festival Arrival Countdown Timer */}
        <CountdownTimer targetDate={mandal?.arrival_date} />

        {/* Quick Action Tiles for Member */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setShowUpiModal(true)}
            className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-festive cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-0.5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black">ऑनलाईन देणगी (UPI)</h3>
            <p className="text-xs text-amber-100">QR कोड स्कॅन करून मंडळाला थेट देणगी द्या.</p>
          </div>

          <div
            onClick={() => navigate('/events')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-amber-400 transition-all transform hover:-translate-y-0.5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">उत्सव कार्यक्रम व आरती</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">दैनिक पूजा, महाप्रसाद व सांस्कृतिक कार्यक्रम.</p>
          </div>

          <div
            onClick={() => navigate('/members')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-amber-400 transition-all transform hover:-translate-y-0.5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">मंडळ समिती व कार्यकर्ते</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">अध्यक्ष, खजिनदार, सचिव व कार्यकारिणी सूची.</p>
          </div>

          <div
            onClick={() => navigate('/verify-receipt')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-amber-400 transition-all transform hover:-translate-y-0.5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">पावती पडताळणी</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">आपल्या अधिकृत डिजिटल पावतीची पडताळणी करा.</p>
          </div>
        </div>

        {/* Mandal Overview Card & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mandal Details */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              मंडळ माहिती (Mandal Details)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <p className="text-slate-400 text-[10px] font-bold">मंडळाचे नाव</p>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">{mandal?.name_mr}</p>
                <p className="text-slate-500">{mandal?.tagline_mr}</p>
              </div>

              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{mandal?.address_mr || 'पत्ता उपलब्ध नाही'}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-mono">{mandal?.contact_phone || '+91 9699049637'}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">
                  अधिकृत नोंदणी क्र: <strong className="text-slate-700 dark:text-slate-200 font-mono">{mandal?.registration_no || '-'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                आगामी उत्सव कार्यक्रम व पूजा
              </h3>
              <button
                onClick={() => navigate('/events')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                सर्व पहा &rarr;
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <CalendarDays className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold">सध्या कोणतेही आगामी कार्यक्रम नोंदवलेले नाहीत.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{evt.title_mr || evt.title_en}</p>
                      <p className="text-[11px] text-slate-500">{formatDate(evt.event_date, lang)} • {evt.event_time}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {evt.location || 'मंडप'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* UPI QR Modal */}
        <UpiQrModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          upiId={mandal?.upi_id}
          upiName={mandal?.upi_name}
          mandalName={mandal?.name_mr}
        />
      </div>
    );
  }

  // ==========================================
  // 2. PRIVILEGED COMMITTEE / FINANCIAL DASHBOARD VIEW
  // (Admin, Treasurer, Secretary, Volunteer)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* 1. Royal Committee Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border-2 border-amber-500/40 p-6 sm:p-7 shadow-2xl text-white flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-6 text-center sm:text-left flex-col sm:flex-row z-10">
          <GanpatiLogo size="xl" glow={true} />
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ॥ श्री गणेशाय नमः ॥
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi tracking-tight">
              {mandal?.name_mr || 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड'}
            </h2>
            <p className="text-xs sm:text-sm font-extrabold text-amber-300">
              {mandal?.tagline_mr || '! नवे पर्व युवा सर्व !'}
            </p>
            <p className="text-xs text-slate-300 pt-1">
              स्वागतम्, <strong>{user?.name || 'कार्यकर्ता'}</strong>! ({t(`roles.${user?.role}`, user?.role)} • उत्सव वर्ष {mandal?.festival_year || 2026})
            </p>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 z-10">
          <button
            onClick={() => navigate('/vargani')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-white font-black text-xs sm:text-sm shadow-festive transition-all duration-150 transform hover:scale-105 active:scale-95 border border-amber-300/40"
          >
            <Receipt className="w-4 h-4" />
            <span>{t('dashboard.addVargani', '+ वर्गणी नोंदवा')}</span>
          </button>

          <button
            onClick={() => setShowUpiModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-amber-400/40 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs sm:text-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>UPI QR कोड</span>
          </button>
        </div>
      </div>

      {/* 2. Festival Arrival Countdown Timer */}
      <CountdownTimer targetDate={mandal?.arrival_date} />

      {/* 3. Primary Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <StatCard
          title={t('dashboard.totalIncome', 'एकूण जमा रक्कम')}
          value={formatCurrency(summary.totalIncome)}
          subtitle={`आजची जमा: ${formatCurrency(summary.todayCollection)}`}
          icon={TrendingUp}
          variant="emerald"
          onClick={() => navigate('/income')}
        />

        {/* Total Expenses */}
        <StatCard
          title={t('dashboard.totalExpenses', 'एकूण खर्च')}
          value={formatCurrency(summary.totalExpense)}
          subtitle={summary.pendingExpensesCount > 0 ? `${summary.pendingExpensesCount} खर्च मंजुरी बाकी` : 'सर्व खर्च मंजूर'}
          icon={CreditCard}
          variant="rose"
          onClick={() => navigate('/expenses')}
        />

        {/* Current Balance */}
        <StatCard
          title={t('dashboard.currentBalance', 'शिल्लक रक्कम')}
          value={formatCurrency(summary.currentBalance)}
          subtitle={`हातातील रोख: ${formatCurrency(summary.cashIncome - summary.cashExpense)}`}
          icon={Wallet}
          variant="amber"
          onClick={() => navigate('/cash-management')}
        />

        {/* Total Vargani & Donors */}
        <StatCard
          title={t('dashboard.totalVargani', 'एकूण वर्गणी संकलन')}
          value={formatCurrency(summary.totalVargani)}
          subtitle={`${summary.totalDonors} देणगीदारांकडून संकलित`}
          icon={Receipt}
          variant="saffron"
          onClick={() => navigate('/vargani')}
        />
      </div>

      {/* 4. Secondary Row: Quick Stats & Trends */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">एकूण देणगीदार</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{summary.totalDonors}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">प्रायोजकत्व देणगी</p>
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{formatCurrency(summary.totalSponsorship)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">डिजिटल (UPI/बँक) जमा</p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(summary.digitalIncome)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">प्रलंबित मंजुऱ्या</p>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{summary.pendingExpensesCount || 0}</p>
        </div>
      </div>

      {/* 5. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Collection Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('dashboard.dailyTrend', 'दैनिक संकलन कल (Daily Trend)')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">मागील १४ दिवसांमधील दैनिक वर्गणी व देणगी</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'रक्कम']}
                    labelFormatter={(lbl) => `दिनांक: ${lbl}`}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                आलेखासाठी पुरेशी माहिती उपलब्ध नाही.
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution Donut Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('dashboard.paymentMethodShare', 'पेमेंट पद्धतींचे प्रमाण')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">रोख वि. UPI वि. बँक</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="total_amount"
                    nameKey="payment_method"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatCurrency(val), 'रक्कम']} />
                  <Legend
                    formatter={(val) => t(`paymentMethods.${val}`, val)}
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">माहिती उपलब्ध नाही</div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Lower Grid: Recent Transactions & Top Donors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('dashboard.recentTransactions', 'अलीकडील व्यवहार')}
            </h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              सर्व पहा &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold">अद्याप कोणतेही जमा व्यवहार नोंदवलेले नाहीत.</p>
                <p className="text-[11px] text-slate-400">वर्गणी किंवा देणगी नोंदवून सुरुवात करा.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="py-3 px-3">पावती क्र.</th>
                    <th className="py-3 px-3">देणगीदार</th>
                    <th className="py-3 px-3">रक्कम</th>
                    <th className="py-3 px-3">पद्धत</th>
                    <th className="py-3 px-3">दिनांक</th>
                    <th className="py-3 px-3 text-right">पावती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{tx.receipt_number}</td>
                      <td className="py-3 px-3">
                        <p className="font-extrabold text-slate-900 dark:text-white">{tx.donor_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{tx.mobile || '-'}</p>
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={tx.payment_method === 'cash' ? 'amber' : 'emerald'} size="sm">
                          {t(`paymentMethods.${tx.payment_method}`, tx.payment_method)}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {formatDate(tx.created_at, lang)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedReceipt({
                            receipt_number: tx.receipt_number,
                            transaction_id: tx.transaction_id,
                            donor_name: tx.donor_name,
                            mobile: tx.mobile,
                            address: tx.address,
                            amount: tx.amount,
                            amount_in_words_mr: tx.amount_in_words_mr,
                            amount_in_words_en: tx.amount_in_words_en,
                            payment_method: tx.payment_method,
                            category: tx.category,
                            purpose: tx.purpose,
                            collector_name: tx.collector_name,
                            created_at: tx.created_at,
                            verification_code: tx.verification_code
                          })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                          title="पावती पहा"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Donors Ranking (1 Col) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              {t('dashboard.topDonors', 'प्रमुख देणगीदार')}
            </h3>
            <button
              onClick={() => navigate('/donors')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              सर्व &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {topDonors.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold">अद्याप देणगीदार माहिती उपलब्ध नाही.</p>
              </div>
            ) : (
              topDonors.map((donor, idx) => (
                <div
                  key={donor.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-500 text-white' :
                      idx === 1 ? 'bg-slate-400 text-white' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white">{donor.name}</p>
                      <p className="text-[10px] text-slate-400">{donor.area || 'दत्तवाड'}</p>
                    </div>
                  </div>
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                    {formatCurrency(donor.total_donated)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      )}

      {/* UPI QR Modal */}
      <UpiQrModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        upiId={mandal?.upi_id}
        upiName={mandal?.upi_name}
        mandalName={mandal?.name_mr}
      />
    </div>
  );
}

export default DashboardPage;
