import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Edit,
  Trash2,
  Power,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function UserManagement() {
  const { director: currentDirector } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Director',
    role: 'DIRECTOR',
    isActive: true
  });

  // Quick Change Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);

    return matchesSearch && matchesStatus;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      designation: 'Director',
      role: 'DIRECTOR',
      isActive: true
    });
    setModalError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      designation: user.designation || 'Director',
      role: user.role || 'DIRECTOR',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setModalError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Submit User (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      if (editingUser) {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          designation: form.designation,
          role: form.role,
          isActive: form.isActive
        };
        if (form.password && form.password.trim()) {
          payload.password = form.password.trim();
        }

        const res = await api.put(`/users/${editingUser._id}`, payload);
        setFeedbackMsg(res.data.message || 'Director updated successfully');
      } else {
        if (!form.password || form.password.length < 6) {
          setModalError('Password must be at least 6 characters long.');
          setSubmitting(false);
          return;
        }

        const res = await api.post('/users', form);
        setFeedbackMsg(res.data.message || 'Director account created successfully');
      }

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving director account');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (user) => {
    if (user._id === currentDirector?._id || user._id === currentDirector?.id) {
      alert('You cannot deactivate your own logged-in Director account.');
      return;
    }

    try {
      const res = await api.patch(`/users/${user._id}/status`);
      setFeedbackMsg(res.data.message || 'Status updated');
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  // Open Quick Password Reset Modal
  const handleOpenPasswordModal = (user) => {
    setTargetUser(user);
    setPasswordForm({ password: '', confirmPassword: '' });
    setModalError('');
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (passwordForm.password.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setModalError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/users/${targetUser._id}`, {
        password: passwordForm.password
      });
      setFeedbackMsg(`Password for Director '${targetUser.name}' updated successfully.`);
      setIsPasswordModalOpen(false);
      setTargetUser(null);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error updating password');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (user) => {
    if (user._id === currentDirector?._id || user._id === currentDirector?.id) {
      alert('You cannot delete your own logged-in Director account.');
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/users/${userToDelete._id}`);
      setFeedbackMsg(res.data.message || 'Director deleted');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting director');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;
  const adminCount = users.filter((u) => u.role === 'SYSTEM_ADMIN' || u.role === 'SUPER_ADMIN').length;
  const directorCount = users.filter((u) => u.role === 'DIRECTOR').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            System Admin & User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage System Administrators and Directors who can login to the CRM console with their Name, Login Email ID, and Password.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
        >
          <UserPlus className="h-4 w-4" />
          Add New User / Admin
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg('')}
            className="text-[11px] text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Users</p>
            <p className="text-lg font-black text-slate-900">{users.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">System Admins</p>
            <p className="text-lg font-black text-purple-600">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Directors</p>
            <p className="text-lg font-black text-blue-600">{directorCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Power className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Accounts</p>
            <p className="text-lg font-black text-emerald-600">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Director Name, Email, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="ALL">All Status ({users.length})</option>
              <option value="ACTIVE">Active Only ({activeCount})</option>
              <option value="INACTIVE">Inactive Only ({inactiveCount})</option>
            </select>
          </div>
        </div>

        {/* Directors Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Director Details</th>
                <th className="py-2.5 px-3">Login Email ID</th>
                <th className="py-2.5 px-3">Phone / Mobile</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading director accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No director records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent =
                    user._id === currentDirector?._id || user._id === currentDirector?.id;

                  return (
                    <tr
                      key={user._id}
                      className={isCurrent ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/60'}
                    >
                      {/* Name & Badge */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {user.role === 'SYSTEM_ADMIN' || user.role === 'SUPER_ADMIN' ? (
                                <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-200 font-extrabold px-1.5 py-0.5 rounded uppercase">
                                  SYSTEM ADMIN
                                </span>
                              ) : user.role === 'MANAGER' ? (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.5 rounded uppercase">
                                  MANAGER
                                </span>
                              ) : (
                                <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 font-bold px-1.5 py-0.5 rounded uppercase">
                                  DIRECTOR
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Login Email */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 text-slate-600">
                        {user.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {user.designation || 'Director'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-3 text-slate-500">
                        {user.lastLogin ? (
                          <div>
                            <p className="font-medium text-slate-700">
                              {new Date(user.lastLogin).toLocaleDateString('en-GB')}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(user.lastLogin).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Never logged in</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Toggle Active / Inactive */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isCurrent}
                            title={
                              isCurrent
                                ? 'Cannot deactivate self'
                                : user.isActive
                                ? 'Click to Deactivate'
                                : 'Click to Activate'
                            }
                            className={`p-1.5 rounded transition ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : user.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>

                          {/* Change Password */}
                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            title="Reset / Set New Password"
                            className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Director Details"
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(user)}
                            disabled={isCurrent}
                            title={isCurrent ? 'Cannot delete your own account' : 'Delete Director'}
                            className={`p-1.5 rounded transition ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Director Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit Director: ${editingUser.name}` : 'Add New Director'}
        subtitle={
          editingUser
            ? 'Update director credentials, personal details, or change password.'
            : 'Register a new Director who will have full authorized CRM portal access.'
        }
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Director Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shree Harshbhai Shah"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Login Email ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="director@ds24g.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phone / Mobile Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9825012345"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                System Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="SYSTEM_ADMIN">System Admin (Full Access)</option>
                <option value="DIRECTOR">Director</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                placeholder="e.g. System Administrator, Director"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Account Status
              </label>
              <select
                value={form.isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'ACTIVE' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="ACTIVE">ACTIVE (Can login)</option>
                <option value="INACTIVE">INACTIVE (Blocked)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                {editingUser ? 'New Password (Leave blank to keep unchanged)' : 'Login Password'}{' '}
                {!editingUser && <span className="text-rose-500">*</span>}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingUser}
                minLength={6}
                placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Saving...' : editingUser ? 'Update Director' : 'Create Director'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Set New Password: ${targetUser?.name}`}
        subtitle={`Update login password for ${targetUser?.email}`}
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                New Password <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Re-enter new password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Director Account"
        subtitle="This action will remove the director credentials from the system."
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Are you sure you want to delete the account for{' '}
            <strong className="text-slate-900">{userToDelete?.name}</strong> (
            <span className="font-mono">{userToDelete?.email}</span>)?
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
            <strong>Security Warning:</strong> This director will immediately lose access to the portal. Past audit logs and recorded operations made by this director will be preserved.
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}