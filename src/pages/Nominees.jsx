import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { UserCheck, Plus, Search, Edit2, Power, AlertCircle, History } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function Nominees() {
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNominee, setEditingNominee] = useState(null);
  const [formData, setFormData] = useState({
    memberId: '',
    nomineeName: '',
    mobileNumber: '',
    relation: 'SPOUSE',
    aadhaarCard: '',
    panCard: '',
    sharePercentage: 100,
    priority: 1,
    status: 'ACTIVE'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/members?limit=100').then((res) => {
      setMembers(res.data.members || []);
      if (res.data.members?.length > 0) {
        setSelectedMemberId(res.data.members[0]._id);
      }
    });
  }, []);

  const fetchNominees = async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const res = await api.get(`/nominees/member/${selectedMemberId}`);
      setNominees(res.data.nominees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNominees();
  }, [selectedMemberId]);

  const openAddModal = () => {
    setEditingNominee(null);
    setFormData({
      memberId: selectedMemberId,
      nomineeName: '',
      mobileNumber: '',
      relation: 'SPOUSE',
      aadhaarCard: '',
      panCard: '',
      sharePercentage: 100,
      priority: nominees.length + 1,
      status: 'ACTIVE'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (n) => {
    setEditingNominee(n);
    setFormData({
      memberId: n.memberId,
      nomineeName: n.nomineeName,
      mobileNumber: n.mobileNumber || '',
      relation: n.relation,
      aadhaarCard: n.aadhaarCard || '',
      panCard: n.panCard || '',
      sharePercentage: n.sharePercentage,
      priority: n.priority,
      status: n.status
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingNominee) {
        await api.put(`/nominees/${editingNominee._id}`, formData);
      } else {
        await api.post('/nominees', formData);
      }
      setIsModalOpen(false);
      fetchNominees();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving nominee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/nominees/${id}/toggle-status`);
      fetchNominees();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const selectedMemberObj = members.find((m) => m._id === selectedMemberId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-indigo-600" />
            Nominee & Beneficiary Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage member-linked nominees, beneficiary priority, share ratios, and change audit history.
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={!selectedMemberId}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Nominee
        </button>
      </div>

      {/* Member Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-96">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Select Member to View / Edit Nominees
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.memberId} — {m.fullName} ({m.villageId?.name || 'Village'})
              </option>
            ))}
          </select>
        </div>

        {selectedMemberObj && (
          <div className="flex items-center gap-3 text-xs bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-500">Member Status:</span>
              <div className="mt-0.5"><Badge status={selectedMemberObj.status} /></div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500">Registered Nominees:</span>
              <p className="font-bold text-slate-900">{nominees.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nominees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Loading registered nominees...</div>
        ) : nominees.length === 0 ? (
          <div className="col-span-2 bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
            No nominees found for this member. Click "Add Nominee" above to register one.
          </div>
        ) : (
          nominees.map((n) => (
            <div key={n._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    #{n.priority}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{n.nomineeName}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Badge status={n.status} />
                  <button
                    onClick={() => openEditModal(n)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(n._id)}
                    className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-50"
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Nominee ID:</span>
                  <p className="font-mono font-bold text-slate-800">{n.nomineeId}</p>
                </div>
                <div>
                  <span className="text-slate-500">Relation:</span>
                  <p className="font-semibold text-slate-800">{n.relation}</p>
                </div>
                <div>
                  <span className="text-slate-500">Beneficiary Share:</span>
                  <p className="font-bold text-indigo-600">{n.sharePercentage}%</p>
                </div>
                <div>
                  <span className="text-slate-500">Mobile:</span>
                  <p className="font-mono text-slate-800">{n.mobileNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Masked Aadhaar:</span>
                  <p className="font-mono text-slate-800">{n.maskedAadhaar || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Masked PAN:</span>
                  <p className="font-mono text-slate-800">{n.maskedPan || '-'}</p>
                </div>
              </div>

              {/* Change history summary */}
              {n.historyNotes && n.historyNotes.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <History className="h-3 w-3" /> Audit Log:
                  </span>
                  <p className="truncate text-slate-600">
                    {n.historyNotes[n.historyNotes.length - 1].details} ({new Date(n.historyNotes[n.historyNotes.length - 1].changedAt).toLocaleDateString()})
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Nominee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNominee ? `Edit Nominee: ${editingNominee.nomineeName}` : 'Add Nominee / Beneficiary'}
        subtitle="Nominee share ratios across active nominees must not exceed 100%."
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
                Nominee Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nomineeName}
                onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                placeholder="e.g. Kokilaben R. Shah"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Relation <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="SPOUSE">Spouse</option>
                <option value="SON">Son</option>
                <option value="DAUGHTER">Daughter</option>
                <option value="FATHER">Father</option>
                <option value="MOTHER">Mother</option>
                <option value="BROTHER">Brother</option>
                <option value="SISTER">Sister</option>
                <option value="DAUGHTER_IN_LAW">Daughter-in-law</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Beneficiary Share % <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={formData.sharePercentage}
                onChange={(e) => setFormData({ ...formData, sharePercentage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority Order</label>
              <input
                type="number"
                min={1}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="10 digit mobile"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">PAN Card</label>
              <input
                type="text"
                maxLength={10}
                value={formData.panCard}
                onChange={(e) => setFormData({ ...formData, panCard: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Aadhaar Card</label>
            <input
              type="text"
              maxLength={12}
              value={formData.aadhaarCard}
              onChange={(e) => setFormData({ ...formData, aadhaarCard: e.target.value.replace(/\D/g, '') })}
              placeholder="12 digit Aadhaar"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
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
              {submitting ? 'Saving...' : editingNominee ? 'Update Nominee' : 'Save Nominee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
