import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  MapPin,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  CheckSquare,
  Square,
  MinusSquare,
  RotateCcw,
  Check,
  Building2,
  ExternalLink
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function Villages() {
  const navigate = useNavigate();
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVillageDropdown, setSelectedVillageDropdown] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Header checkbox ref for indeterminate state
  const headerCheckboxRef = useRef(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    taluka: '',
    district: '',
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

  // Client-side filtering when a specific village is picked from dropdown
  const displayedVillages = useMemo(() => {
    if (!selectedVillageDropdown) return villages;
    return villages.filter(v => v._id === selectedVillageDropdown);
  }, [villages, selectedVillageDropdown]);

  // Distinct list of villages for selection dropdown (sorted by name)
  const villageOptions = useMemo(() => {
    return [...villages].sort((a, b) => a.name.localeCompare(b.name, 'gu', { sensitivity: 'base' }));
  }, [villages]);

  // Selection helpers
  const isAllSelected = displayedVillages.length > 0 && displayedVillages.every(v => selectedIds.includes(v._id));
  const isSomeSelected = displayedVillages.some(v => selectedIds.includes(v._id)) && !isAllSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all currently displayed
      const displayedIdSet = new Set(displayedVillages.map(v => v._id));
      setSelectedIds(prev => prev.filter(id => !displayedIdSet.has(id)));
    } else {
      // Select all currently displayed
      const newIds = new Set([...selectedIds, ...displayedVillages.map(v => v._id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Bulk Actions
  const handleBulkStatus = async (targetStatus) => {
    if (selectedIds.length === 0) return;
    const actionLabel = targetStatus === 'ACTIVE' ? 'સક્રિય (ACTIVE)' : 'નિષ્ક્રિય (INACTIVE)';
    if (!window.confirm(`શું તમે પસંદ કરેલા ${selectedIds.length} ગામને ${actionLabel} કરવા માંગો છો?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await api.post('/villages/bulk-status', {
        villageIds: selectedIds,
        status: targetStatus
      });
      setFeedbackMsg({
        type: 'success',
        text: res.data?.message || `Selected ${selectedIds.length} village(s) updated to ${targetStatus}.`
      });
      setSelectedIds([]);
      await fetchVillages();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error updating villages status.'
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    // Check which ones have linked members
    const busyVillages = displayedVillages.filter(v => selectedIds.includes(v._id) && v.memberCount > 0);
    let confirmPrompt = `શું તમે પસંદ કરેલા ${selectedIds.length} ગામને ડિલીટ કરવા માંગો છો?`;
    if (busyVillages.length > 0) {
      confirmPrompt += `\n\nનોંધ: આમાંથી ${busyVillages.length} ગામમાં સભ્યો નોંધાયેલા હોવાથી તે ડિલીટ નહીં થાય. બાકીના ખાલી ગામ ડિલીટ થશે.`;
    }

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await api.post('/villages/bulk-delete', {
        villageIds: selectedIds
      });
      setFeedbackMsg({
        type: res.data?.deletedCount > 0 ? 'success' : 'error',
        text: res.data?.message || 'Bulk delete operation completed.'
      });
      setSelectedIds([]);
      await fetchVillages();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error deleting villages.'
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const openAddModal = () => {
    setEditingVillage(null);
    setFormData({
      name: '',
      taluka: '',
      district: '',
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
      district: v.district || '',
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
        setSelectedIds(prev => prev.filter(id => id !== v._id));
        setFeedbackMsg({ type: 'success', text: `Village "${v.name}" deleted successfully.` });
        await fetchVillages();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting village');
      }
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSelectedVillageDropdown('');
    setSelectedIds([]);
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
            Configure native villages of 42 Gnati members with multi-selection, bulk operations, and member linkages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Add Village
          </button>
        </div>
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

      {/* Filters and Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search village name or taluka..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          {/* Village Selector Dropdown */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedVillageDropdown}
                onChange={(e) => setSelectedVillageDropdown(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 min-w-[180px] focus:ring-2 focus:ring-indigo-600"
                title="ગામ પસંદ કરો (Select Village)"
              >
                <option value="">બધા ગામ (All Villages - {villageOptions.length})</option>
                {villageOptions.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} {v.taluka ? `(${v.taluka})` : ''} - {v.memberCount || 0} સભ્યો
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Reset Filter Button */}
            {(search || statusFilter || selectedVillageDropdown || selectedIds.length > 0) && (
              <button
                onClick={resetAllFilters}
                title="Reset all filters and selection"
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Selection Action Toolbar (when >=1 village selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border-2 border-indigo-200 p-3.5 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
              <CheckSquare className="h-3.5 w-3.5" />
              {selectedIds.length} ગામ પસંદ કરેલ ({selectedIds.length} Selected)
            </span>
            <span className="text-xs text-indigo-900 font-semibold hidden sm:inline">
              તમે પસંદ કરેલા ગામ પર બલ્ક એક્શન લઈ શકો છો:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Members button for single or multiple selected villages */}
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  if (selectedIds.length === 1) {
                    navigate(`/members?villageId=${selectedIds[0]}`);
                  } else {
                    navigate(`/members?villageIds=${selectedIds.join(',')}`);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-bold shadow-2xs transition cursor-pointer"
                title={selectedIds.length === 1 ? 'આ ગામના સભ્યો જુઓ' : `પસંદ કરેલા ${selectedIds.length} ગામના સભ્યો જુઓ`}
              >
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                <span>સભ્યો જુઓ ({selectedIds.length > 1 ? `${selectedIds.length} ગામ` : 'View Members'})</span>
                <ExternalLink className="h-3 w-3 text-indigo-500" />
              </button>
            )}

            {/* Set Active */}
            <button
              onClick={() => handleBulkStatus('ACTIVE')}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50"
              title="પસંદ કરેલા ગામ સક્રિય કરો"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>સક્રિય કરો (Set Active)</span>
            </button>

            {/* Set Inactive */}
            <button
              onClick={() => handleBulkStatus('INACTIVE')}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50"
              title="પસંદ કરેલા ગામ નિષ્ક્રિય કરો"
            >
              <Power className="h-3.5 w-3.5" />
              <span>નિષ્ક્રિય કરો (Set Inactive)</span>
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50"
              title="પસંદ કરેલા ગામ ડિલીટ કરો"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ડિલીટ કરો (Delete Selected)</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={handleClearSelection}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
              title="પસંદગી રદ કરો"
            >
              <X className="h-3.5 w-3.5 text-slate-500" />
              <span>રદ કરો</span>
            </button>
          </div>
        </div>
      )}

      {/* Villages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                {/* Select All Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    disabled={displayedVillages.length === 0}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title={isAllSelected ? 'Deselect All' : 'Select All Displayed'}
                  />
                </th>
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
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading villages...</td>
                </tr>
              ) : displayedVillages.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No villages found matching criteria.</td>
                </tr>
              ) : (
                displayedVillages.map((v) => {
                  const isSelected = selectedIds.includes(v._id);
                  return (
                    <tr
                      key={v._id}
                      className={`transition ${
                        isSelected
                          ? 'bg-indigo-50/70 hover:bg-indigo-100/60 border-l-4 border-l-indigo-600'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(v._id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{v.villageId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span
                          onClick={() => handleToggleSelect(v._id)}
                          className="cursor-pointer hover:text-indigo-600"
                        >
                          {v.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{v.taluka || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{v.district}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/members?villageId=${v._id}`)}
                          title={`Click to view ${v.memberCount || 0} member(s) of ${v.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition"
                        >
                          <Users className="h-3 w-3" />
                          <span>{v.memberCount || 0} members</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={v.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(v)}
                          title="Edit Village"
                          className="p-1.5 rounded text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(v._id)}
                          title={v.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-100"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          title="Delete Village"
                          className="p-1.5 rounded text-slate-600 hover:text-rose-600 hover:bg-slate-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table summary footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{displayedVillages.length}</span> village(s)
            {selectedVillageDropdown && (
              <span className="ml-1 text-indigo-600 font-semibold">(Filtered by selected village)</span>
            )}
          </div>
          {selectedIds.length > 0 && (
            <div className="font-semibold text-indigo-700">
              {selectedIds.length} of {displayedVillages.length} selected
            </div>
          )}
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
