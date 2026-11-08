import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import {
  Layers,
  Plus,
  Play,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Edit2
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function Installments() {
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState(null);
  const [formData, setFormData] = useState({
    financialYearId: '',
    installmentTitle: '',
    installmentNumber: 1,
    amountRupees: 1000,
    startDate: '',
    dueDate: '',
    description: '',
    applicabilityRule: 'ALL_ACTIVE'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dues generation state
  const [generatingId, setGeneratingId] = useState(null);
  const [genMessage, setGenMessage] = useState('');

  useEffect(() => {
    api.get('/financial-years').then((res) => {
      const list = res.data.financialYears || [];
      setYears(list);
      const activeYear = list.find((y) => y.isCurrent) || list[0];
      if (activeYear) {
        setSelectedYearId(activeYear._id);
      }
    });
  }, []);

  const fetchInstallments = async () => {
    if (!selectedYearId) return;
    setLoading(true);
    try {
      const res = await api.get('/installments', {
        params: { financialYearId: selectedYearId }
      });
      setInstallments(res.data.installments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, [selectedYearId]);

  const openAddModal = () => {
    setEditingInst(null);
    const nextNum = installments.length + 1;
    setFormData({
      financialYearId: selectedYearId,
      installmentTitle: `Installment ${nextNum}`,
      installmentNumber: nextNum,
      amountRupees: 1000,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
      description: '',
      applicabilityRule: 'ALL_ACTIVE'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (inst) => {
    setEditingInst(inst);
    setFormData({
      financialYearId: inst.financialYearId?._id || inst.financialYearId,
      installmentTitle: inst.installmentTitle,
      installmentNumber: inst.installmentNumber,
      amountRupees: inst.amountRupees,
      startDate: inst.startDate ? new Date(inst.startDate).toISOString().split('T')[0] : '',
      dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : '',
      description: inst.description || '',
      applicabilityRule: inst.applicabilityRule || 'ALL_ACTIVE'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingInst) {
        await api.put(`/installments/${editingInst._id}`, formData);
      } else {
        await api.post('/installments', formData);
      }
      setIsModalOpen(false);
      fetchInstallments();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving installment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Dues for this installment
  const handleGenerateDues = async (inst) => {
    if (!window.confirm(`Generate installment dues of ${inst.formattedAmount} for all eligible members for "${inst.installmentTitle}"? This will post official due records to member ledgers.`)) {
      return;
    }
    setGeneratingId(inst._id);
    setGenMessage('');
    try {
      const res = await api.post(`/installments/${inst._id}/generate-dues`);
      setGenMessage(res.data.message);
      fetchInstallments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating dues');
    } finally {
      setGeneratingId(null);
    }
  };

  const selectedYearObj = years.find((y) => y._id === selectedYearId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600" />
            Dynamic Installment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic year-wise installments (1, 2, 3 or more installments per year) and generate member dues.
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={!selectedYearId}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Installment
        </button>
      </div>

      {/* Year Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-80">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Select Accounting Year
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
          >
            {years.map((y) => (
              <option key={y._id} value={y._id}>
                Year {y.yearName} {y.isCurrent ? '★ (Active Accounting Year)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedYearObj && (
          <div className="flex items-center gap-4 text-xs bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-500">Period:</span>
              <p className="font-semibold text-slate-800">
                {new Date(selectedYearObj.startDate).toLocaleDateString()} to {new Date(selectedYearObj.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500">Configured Installments:</span>
              <p className="font-bold text-indigo-700 text-sm">{installments.length}</p>
            </div>
          </div>
        )}
      </div>

      {genMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{genMessage}</span>
        </div>
      )}

      {/* Installments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading year installments...</div>
        ) : installments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No installments configured for this year. Click "Add Installment" to define Installment 1.
          </div>
        ) : (
          installments.map((inst) => {
            const stats = inst.stats || {};
            return (
              <div
                key={inst._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm">
                      #{inst.installmentNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{inst.installmentTitle}</h3>
                      <p className="text-xs text-slate-500">
                        Due Date: <strong className="text-slate-800">{new Date(inst.dueDate).toLocaleDateString()}</strong> • Amount: <strong className="text-indigo-700 font-bold">{inst.formattedAmount}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateDues(inst)}
                      disabled={generatingId === inst._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-2xs transition disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {generatingId === inst._id ? 'Generating...' : 'Generate Member Dues'}
                    </button>
                    <button
                      onClick={() => openEditModal(inst)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                      title="Edit Installment"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Collection Performance Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500">Billed Members:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{stats.totalMembers || 0} members</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Demand:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{stats.formattedDemand || '₹0.00'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Collected:</span>
                    <p className="font-bold text-emerald-700 mt-0.5">{stats.formattedCollected || '₹0.00'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Pending Outstanding:</span>
                    <p className="font-bold text-rose-600 mt-0.5">{stats.formattedOutstanding || '₹0.00'}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInst ? `Edit Installment: ${editingInst.installmentTitle}` : 'Add Dynamic Installment'}
        subtitle="Installments can be configured flexibly with distinct due dates and amounts."
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Installment Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.installmentTitle}
                onChange={(e) => setFormData({ ...formData, installmentTitle: e.target.value })}
                placeholder="e.g. Installment 1"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Installment Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.installmentNumber}
                onChange={(e) => setFormData({ ...formData, installmentNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Amount per Member (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                step="any"
                required
                value={formData.amountRupees}
                onChange={(e) => setFormData({ ...formData, amountRupees: e.target.value })}
                placeholder="e.g. 1000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Annual membership first quarter tranche"
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
              {submitting ? 'Saving...' : editingInst ? 'Update Installment' : 'Create Installment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
