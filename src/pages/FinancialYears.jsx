import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { Calendar, Plus, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function FinancialYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    yearName: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    status: 'ACTIVE',
    description: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await api.get('/financial-years');
      setYears(res.data.financialYears || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const openAddModal = () => {
    setEditingYear(null);
    setFormData({
      yearName: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      status: 'ACTIVE',
      description: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (y) => {
    setEditingYear(y);
    setFormData({
      yearName: y.yearName,
      startDate: y.startDate ? new Date(y.startDate).toISOString().split('T')[0] : '',
      endDate: y.endDate ? new Date(y.endDate).toISOString().split('T')[0] : '',
      isCurrent: !!y.isCurrent,
      status: y.status,
      description: y.description || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingYear) {
        await api.put(`/financial-years/${editingYear._id}`, formData);
      } else {
        await api.post('/financial-years', formData);
      }
      setIsModalOpen(false);
      fetchYears();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving financial year');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Financial Year Master
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define exclusive accounting periods and track dynamic installments per annual cycle.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Financial Year
        </button>
      </div>

      {/* Grid of Financial Years */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400">Loading financial years...</div>
        ) : (
          years.map((y) => (
            <div
              key={y._id}
              className={`bg-white rounded-xl p-5 border shadow-2xs space-y-4 relative ${
                y.isCurrent ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-200'
              }`}
            >
              {y.isCurrent && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Active FY
                </span>
              )}

              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {y.yearName.slice(-2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{y.yearName}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{y.fyCode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500">Start Date:</span>
                  <p className="font-medium text-slate-800">{new Date(y.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">End Date:</span>
                  <p className="font-medium text-slate-800">{new Date(y.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">
                  Installments: <strong className="text-indigo-700 font-bold">{y.installmentCount}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Badge status={y.status} />
                  <button
                    onClick={() => openEditModal(y)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingYear ? `Edit Financial Year: ${editingYear.yearName}` : 'Add Financial Year'}
        subtitle="Dates must be exclusive and cannot overlap with another active financial period."
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
              Financial Year Title / Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.yearName}
              onChange={(e) => setFormData({ ...formData, yearName: e.target.value })}
              placeholder="e.g. 2026 or 2026-2027"
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.isCurrent}
                  onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Set as Active Accounting Year
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {submitting ? 'Saving...' : editingYear ? 'Update Year' : 'Create Year'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
