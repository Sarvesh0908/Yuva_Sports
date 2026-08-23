import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  Activity,
  FileCode
} from 'lucide-react';

export function AuditLogsPage() {
  const { t, lang } = useLanguage();
  const { showToast } = useNotification();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs', { page, limit: 20, entity, action });
      if (res.success) {
        setLogs(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('fetchLogs error:', err);
      showToast('ऑडिट नोंदी लोड करताना अडचण आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entity, action]);

  const getActionColor = (act) => {
    switch (act) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'APPROVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'REJECT':
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      case 'RECONCILE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.auditLogs', 'सुरक्षा व ऑडिट नोंदी (System Audit Trail)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            सिस्टीममधील सर्व आर्थिक व्यवहार, मंजुऱ्या व बदलांची सुरक्षित अपरिवर्तनीय नोंद (Immutable Audit Log)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">सर्व विभाग (All Entities)</option>
            <option value="INCOME">जमा व्यवहार (Income)</option>
            <option value="EXPENSE">खर्च व्यवहार (Expense)</option>
            <option value="CASH">रोख ताळेबंद (Cash)</option>
            <option value="MEMBER">सदस्य (Member)</option>
            <option value="EVENT">कार्यक्रम (Event)</option>
            <option value="SETTINGS">सेटिंग्ज (Settings)</option>
            <option value="USER">वापरकर्ता (User / Login)</option>
          </select>
        </div>

        <div>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">सर्व कृती (All Actions)</option>
            <option value="CREATE">CREATE (नवीन नोंद)</option>
            <option value="APPROVE">APPROVE (मंजुरी)</option>
            <option value="REJECT">REJECT (नामंजूर)</option>
            <option value="DELETE">DELETE (हटवले)</option>
            <option value="RECONCILE">RECONCILE (ताळेबंद)</option>
            <option value="LOGIN">LOGIN (लॉगिन)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">वेळ व दिनांक</th>
                <th className="py-3 px-4">वापरकर्ता</th>
                <th className="py-3 px-4">कृती</th>
                <th className="py-3 px-4">विभाग / संदर्भ</th>
                <th className="py-3 px-4">तपशील व वर्णन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    लोड होत आहे...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    कोणत्याही ऑडिट नोंदी सापडल्या नाहीत.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(row.created_at, lang)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{row.user_name || 'System'}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{row.user_role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getActionColor(row.action)}`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {row.entity} {row.entity_id ? `(#${row.entity_id})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {lang === 'en' && row.description_en ? row.description_en : row.description_mr}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsPage;
