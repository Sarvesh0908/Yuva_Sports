import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Lock,
  Smartphone,
  Mail,
  User
} from 'lucide-react';

export function UsersManagementPage() {
  const { t, lang } = useLanguage();
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('fetchUsers error:', err);
      showToast('वापरकर्ते यादी मिळवताना त्रुटी.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole, userName) => {
    try {
      setIsUpdating(true);
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      if (res.success) {
        showToast(`${userName} यांची भूमिका बदलून यशस्वीरित्या "${t('roles.' + newRole, newRole)}" अशी केली! 🕉️`, 'success');
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error('updateRole error:', err);
      showToast(err.message || 'भूमिका बदलताना त्रुटी निर्माण झाली.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus, userName) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/users/${userId}/status`, { status: nextStatus });
      if (res.success) {
        showToast(`${userName} यांचे खाते ${nextStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} केले.`, 'info');
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      }
    } catch (err) {
      showToast(err.message || 'स्थिती बदलताना त्रुटी.', 'error');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`आपणास खात्री आहे की "${userName}" यांचे खाते कायमचे हटवायचे आहे?`)) return;

    try {
      const res = await api.delete(`/users/${userId}`);
      if (res.success) {
        showToast(`वापरकर्ता ${userName} हटवला.`, 'success');
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      showToast(err.message || 'हटवताना त्रुटी.', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newMobile.trim() || !newPassword) {
      showToast('कृपया नाव, मोबाईल आणि पासवर्ड भरा.', 'warning');
      return;
    }

    try {
      setIsCreating(true);
      const res = await api.post('/users', {
        name: newName.trim(),
        mobile: newMobile.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole
      });

      if (res.success) {
        showToast('नवीन वापरकर्ता यशस्वीरित्या तयार केला! 🚩', 'success');
        setShowAddModal(false);
        setNewName('');
        setNewMobile('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('member');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message || 'तयार करताना त्रुटी.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mobile?.includes(searchQuery) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  // KPI counters
  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    treasurer: users.filter(u => u.role === 'treasurer').length,
    secretary: users.filter(u => u.role === 'secretary').length,
    volunteer: users.filter(u => u.role === 'volunteer').length,
    member: users.filter(u => u.role === 'member').length,
  };

  const roleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'treasurer':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'secretary':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'volunteer':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.users', 'वापरकर्ते व अधिकार व्यवस्थापन (Users & Role Management)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            नोंदणीकृत सभासदांची सूची आणि त्यांची अधिकार भूमिका (Admin, खजिनदार, सचिव, स्वयंसेवक, सभासद) नियंत्रित करा
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="रिफ्रेश करा"
          >
            <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-festive transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ नवीन वापरकर्ता जोडा</span>
          </button>
        </div>
      </div>

      {/* Role Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedRoleFilter('all')}
          className={`p-3 rounded-2xl border text-center transition-all ${
            selectedRoleFilter === 'all'
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-black ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold">एकूण वापरकर्ते</p>
          <p className="text-xl font-black mt-0.5">{counts.total}</p>
        </button>

        <button
          onClick={() => setSelectedRoleFilter('admin')}
          className={`p-3 rounded-2xl border text-center transition-all ${
            selectedRoleFilter === 'admin'
              ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-black ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold">👑 अध्यक्ष (Admin)</p>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{counts.admin}</p>
        </button>

        <button
          onClick={() => setSelectedRoleFilter('treasurer')}
          className={`p-3 rounded-2xl border text-center transition-all ${
            selectedRoleFilter === 'treasurer'
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-black ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold">💰 खजिनदार (Treasurer)</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{counts.treasurer}</p>
        </button>

        <button
          onClick={() => setSelectedRoleFilter('secretary')}
          className={`p-3 rounded-2xl border text-center transition-all ${
            selectedRoleFilter === 'secretary'
              ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-black ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold">📝 सचिव (Secretary)</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{counts.secretary}</p>
        </button>

        <button
          onClick={() => setSelectedRoleFilter('volunteer')}
          className={`p-3 rounded-2xl border text-center transition-all ${
            selectedRoleFilter === 'volunteer'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold">🚩 स्वयंसेवक</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{counts.volunteer}</p>
        </button>

        <button
          onClick={() => setSelectedRoleFilter('member')}
          className={`p-3 rounded-2xl border text-center transition-all ${
            selectedRoleFilter === 'member'
              ? 'bg-slate-500/10 border-slate-500 text-slate-700 dark:text-slate-200 font-black ring-2 ring-slate-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold">👤 सभासद (Member)</p>
          <p className="text-xl font-black text-slate-700 dark:text-slate-200 mt-0.5">{counts.member}</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नाव, मोबाईल किंवा ईमेलने शोधा..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">भूमिका फिल्टर:</label>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">सर्व भूमिका (All Roles)</option>
            <option value="admin">👑 अध्यक्ष (Admin)</option>
            <option value="treasurer">💰 खजिनदार (Treasurer)</option>
            <option value="secretary">📝 सचिव (Secretary)</option>
            <option value="volunteer">🚩 स्वयंसेवक (Volunteer)</option>
            <option value="member">👤 सभासद (Member)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold">वापरकर्ते लोड होत आहेत...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-bold">कोणतेही वापरकर्ते सापडले नाहीत.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="py-3.5 px-4">वापरकर्ता नाव</th>
                  <th className="py-3.5 px-4">संपर्क (Mobile / Email)</th>
                  <th className="py-3.5 px-4">सध्याची भूमिका</th>
                  <th className="py-3.5 px-4">भूमिका बदला (Assign Role)</th>
                  <th className="py-3.5 px-4 text-center">स्थिती</th>
                  <th className="py-3.5 px-4 text-center">नोंदणी दिनांक</th>
                  <th className="py-3.5 px-4 text-center">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                  (आपण)
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">+91 {u.mobile}</p>
                        {u.email && <p className="text-[10px] text-slate-400">{u.email}</p>}
                      </td>

                      {/* Current Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${roleBadgeStyle(u.role)}`}>
                          {t('roles.' + u.role, u.role)}
                        </span>
                      </td>

                      {/* Assign Role Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(u.id, e.target.value, u.name)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="member">👤 सभासद (Member)</option>
                          <option value="volunteer">🚩 स्वयंसेवक (Volunteer)</option>
                          <option value="secretary">📝 सचिव (Secretary)</option>
                          <option value="treasurer">💰 खजिनदार (Treasurer)</option>
                          <option value="admin">👑 अध्यक्ष (Admin)</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(u.id, u.status, u.name)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-colors ${
                            u.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>सक्रिय</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>निष्क्रिय</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                        {formatDate(u.created_at, lang)}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-center">
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="वापरकर्ता हटवा"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="+ नवीन वापरकर्ता / सभासद जोडा"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पूर्ण नाव *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="उदा. अमित सुरेश मोहिते"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">मोबाईल क्रमांक *</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="९८२२०XXXXX"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ईमेल (ऐच्छिक)</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पासवर्ड *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="किमान ६ अक्षरे..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">भूमिका निवडा (Assign Role) *</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="member">👤 सभासद (Member - Default)</option>
              <option value="volunteer">🚩 स्वयंसेवक (Volunteer)</option>
              <option value="secretary">📝 सचिव (Secretary)</option>
              <option value="treasurer">💰 खजिनदार (Treasurer)</option>
              <option value="admin">👑 अध्यक्ष (Admin)</option>
            </select>
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
              disabled={isCreating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold shadow-festive"
            >
              {isCreating ? 'तयार होत आहे...' : 'वापरकर्ता तयार करा'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UsersManagementPage;
