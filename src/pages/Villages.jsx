import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { Plus, Search, Edit2, Trash2, Power, MapPin, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function Villages() {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    taluka: '',
    district: 'Bhavnagar',
    state: 'Gujarat',
    description: '',
    status: 'ACTIVE'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVillages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/villages', {
        params: { search, status: statusFilter }
      });
      setVillages(res.data.villages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillages();
  }, [search, statusFilter]);

  const openAddModal = () => {
    setEditingVillage(null);
    setFormData({
      name: '',
      taluka: '',
      district: 'Bhavnagar',
      state: 'Gujarat',
      description: '',
      status: 'ACTIVE'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVillage(v);
    setFormData({
      name: v.name,
      taluka: v.taluka || '',
      district: v.district || 'Bhavnagar',
      state: v.state || 'Gujarat',
      description: v.description || '',
      status: v.status
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingVillage) {
        const res = await api.put(`/villages/${editingVillage._id}`, formData);
        const updated = res.data.village;
        if (updated) {
          setVillages(prev => prev.map(v => v._id === updated._id ? { ...v, ...updated } : v));
        }
        setFeedbackMsg({ type: 'success', text: `Village "${updated?.name || formData.name}" updated successfully.` });
      } else {
        const res = await api.post('/villages', formData);
        setFeedbackMsg({ type: 'success', text: `Village "${res.data?.village?.name || formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      await fetchVillages();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving village.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/villages/${id}/toggle-status`);
      const updated = res.data.village;
      if (updated) {
        setVillages(prev => prev.map(v => v._id === id ? { ...v, ...updated } : v));
      }
      setFeedbackMsg({ type: 'success', text: `Village status changed to ${updated?.status || 'updated'}.` });
      await fetchVillages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (v) => {
    if (v.memberCount > 0) {
      alert(`Cannot delete "${v.name}". It is linked to ${v.memberCount} member(s). You may deactivate it instead.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${v.name}"?`)) {
      try {
        await api.delete(`/villages/${v._id}`);
        setVillages(prev => prev.filter(item => item._id !== v._id));
        setFeedbackMsg({ type: 'success', text: `Village "${v.name}" deleted successfully.` });
        await fetchVillages();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting village');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-indigo-600" />
            Village Master Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure native villages of 42 Gnati members with member linkages.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Add Village
        </button>
      </div>

      {/* Dismissible Feedback Message */}
      {feedbackMsg.text && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          feedbackMsg.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg({ type: '', text: '' })}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search village name or taluka..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Villages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Village ID</th>
                <th className="py-3 px-4">Village Name</th>
                <th className="py-3 px-4">Taluka</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4 text-center">Linked Members</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading villages...</td>
                </tr>
              ) : villages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No villages found matching criteria.</td>
                </tr>
              ) : (
                villages.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{v.villageId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{v.name}</td>
                    <td className="py-3 px-4 text-slate-600">{v.taluka || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{v.district}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {v.memberCount} members
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={v.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(v)}
                        title="Edit Village"
                        className="p-1 rounded text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(v._id)}
                        title={v.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        className="p-1 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-100"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        title="Delete Village"
                        className="p-1 rounded text-slate-600 hover:text-rose-600 hover:bg-slate-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Village Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVillage ? `Edit Village: ${editingVillage.villageId}` : 'Add New Gnati Village'}
        subtitle="Villages are linked to member registration and bulk payment workflows."
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
              Village Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mahuva, Talaja, Palitana"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Taluka</label>
              <input
                type="text"
                value={formData.taluka}
                onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                placeholder="Taluka name"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional remarks"
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
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
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingVillage ? 'Update Village' : 'Create Village'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
