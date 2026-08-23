import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Receipt, CreditCard, FileSpreadsheet, Menu, CalendarDays, UserCheck, QrCode } from 'lucide-react';

export function BottomMobileNav({ onOpenMenu, onQuickAction }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isMember = user?.role === 'member';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg no-print">
      {/* 1. Home */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-bold ${
            isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t('nav.dashboard', 'डॅशबोर्ड')}</span>
      </NavLink>

      {/* 2. Primary Action depending on role */}
      {isMember ? (
        <NavLink
          to="/events"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>कार्यक्रम</span>
        </NavLink>
      ) : (
        <NavLink
          to="/vargani"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <div className="relative p-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20">
            <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span>{t('nav.vargani', 'वर्गणी')}</span>
        </NavLink>
      )}

      {/* 3. Secondary Action */}
      {isMember ? (
        <NavLink
          to="/members"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <UserCheck className="w-5 h-5" />
          <span>समिती</span>
        </NavLink>
      ) : (
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <CreditCard className="w-5 h-5" />
          <span>{t('nav.expenses', 'खर्च')}</span>
        </NavLink>
      )}

      {/* 4. Action 4 */}
      {isMember ? (
        <NavLink
          to="/digital-payments"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <QrCode className="w-5 h-5" />
          <span>देणगी / UPI</span>
        </NavLink>
      ) : (
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>{t('nav.reports', 'अहवाल')}</span>
        </NavLink>
      )}

      {/* 5. More Menu */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900"
      >
        <Menu className="w-5 h-5" />
        <span>मेनू (More)</span>
      </button>
    </div>
  );
}

export default BottomMobileNav;
