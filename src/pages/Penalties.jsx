import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { fetchAllMembers } from '../utils/memberApi';
import { AlertTriangle, Plus, ShieldCheck, UserX, AlertCircle, CheckCircle2, Edit, Trash2, Power, HelpCircle } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function Penalties() {
  const [penaltyMasters, setPenaltyMasters] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Penalty Master Modal (Create / Edit)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    title: '',
    type: 'FIXED',
    rateOrAmount: 100,
    applicableRule: 'MANUAL',
    gracePeriodDays: 0,
    description: '',
    status: 'ACTIVE'
  });

  // Delete Rule Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState(null);

  // Assign Penalty Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    penaltyMasterId: '',
    title: 'Late Payment Penalty',
    amountRupees: 100,
    reason: ''
  });

  // Waive Penalty Modal
  const [isWaiveModalOpen, setIsWaiveModalOpen] = useState(false);
  const [waivingPenalty, setWaivingPenalty] = useState(null);
  const [waiverReason, setWaiverReason] = useState('');

  // Selected Member Penalties list
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberPenalties, setMemberPenalties] = useState([]);
  const [penaltiesLoading, setPenaltiesLoading] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPenaltyMasters = async () => {
    try {
      const pmRes = await api.get('/penalties/masters');
      setPenaltyMasters(pmRes.data.penaltyMasters || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/penalties/masters'),
      fetchAllMembers()
    ]).then(([pmRes, memberList]) => {
      setPenaltyMasters(pmRes.data.penaltyMasters || []);
      setMembers(memberList);
      if (memberList.length > 0) {
        setSelectedMemberId(memberList[0]._id);
      }
      setLoading(false);
    });
  }, []);

  const fetchMemberPenalties = async () => {
    if (!selectedMemberId) return;
    setPenaltiesLoading(true);
    try {
      const res = await api.get(`/penalties/member/${selectedMemberId}`);
      setMemberPenalties(res.data.penalties || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPenaltiesLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberPenalties();
  }, [selectedMemberId]);

  // Handle open create penalty rule
  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      title: '',
      type: 'FIXED',
      rateOrAmount: 100,
      applicableRule: 'MANUAL',
      gracePeriodDays: 0,
      description: '',
      status: 'ACTIVE'
    });
    setModalError('');
    setIsRuleModalOpen(true);
  };

  // Handle open edit penalty rule
  const handleOpenEditRule = (pm) => {
    setEditingRule(pm);
    const rateVal = pm.rateOrAmountRupees !== undefined 
      ? pm.rateOrAmountRupees 
      : (pm.type === 'FIXED' ? (pm.rateOrAmount / 100) : pm.rateOrAmount);

    setRuleForm({
      title: pm.title || '',
      type: pm.type || 'FIXED',
      rateOrAmount: rateVal,
      applicableRule: pm.applicableRule || 'MANUAL',
      gracePeriodDays: pm.gracePeriodDays || 0,
      description: pm.description || '',
      status: pm.status || 'ACTIVE'
    });
    setModalError('');
    setIsRuleModalOpen(true);
  };

  // Submit Rule Form (Create or Update)
  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingRule) {
        const res = await api.put(`/penalties/masters/${editingRule._id}`, ruleForm);
        setFeedbackMsg(res.data.message || 'Penalty rule updated successfully');
      } else {
        const res = await api.post('/penalties/masters', ruleForm);
        setFeedbackMsg(res.data.message || 'Penalty rule created successfully');
      }
      setIsRuleModalOpen(false);
      await fetchPenaltyMasters();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving penalty rule');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Rule Status (ACTIVE <-> INACTIVE)
  const handleToggleRuleStatus = async (pm) => {
    try {
      const res = await api.patch(`/penalties/masters/${pm._id}/status`);
      setFeedbackMsg(res.data.message || 'Rule status updated');
      await fetchPenaltyMasters();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  // Delete Rule
  const handleDeleteRule = async () => {
    if (!deletingRule) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/penalties/masters/${deletingRule._id}`);
      setFeedbackMsg(res.data.message || 'Penalty rule deleted');
      setIsDeleteModalOpen(false);
      setDeletingRule(null);
      await fetchPenaltyMasters();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting penalty rule');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Penalty Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      const res = await api.post('/penalties/assign', assignForm);
      setFeedbackMsg(res.data.message);
      setIsAssignModalOpen(false);
      fetchMemberPenalties();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error assigning penalty');
    } finally {
      setSubmitting(false);
    }
  };

  // Waive Penalty Submit
  const handleWaiveSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/penalties/waive/${waivingPenalty._id}`, { waiverReason });
      setFeedbackMsg(res.data.message);
      setIsWaiveModalOpen(false);
      fetchMemberPenalties();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error waiving penalty');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Penalty Master & Waiver Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure default penalty schedules, assign penalties, and issue audit-recorded director waivers.
          </p>
        </div>
        <button
          onClick={() => {
            setAssignForm({
              memberId: selectedMemberId,
              penaltyMasterId: penaltyMasters[0]?._id || '',
              title: penaltyMasters[0]?.title || 'Late Payment Penalty',
              amountRupees: 100,
              reason: ''
            });
            setModalError('');
            setIsAssignModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Assign Penalty to Member
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
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

      {/* Penalty Masters Grid (Configured Penalty Rules CRUD) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Configured Penalty Rules
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage society penalty rules, flat amounts, percentage rates, grace periods, and triggers.
            </p>
          </div>
          <button
            onClick={handleOpenCreateRule}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Penalty Rule
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {penaltyMasters.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No penalty rules configured yet. Click "Add Penalty Rule" above to create one.
            </div>
          ) : (
            penaltyMasters.map((pm) => (
              <div key={pm._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {pm.penaltyId}
                    </span>
                    <Badge status={pm.status} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{pm.title}</h4>
                  
                  <div className="space-y-1.5 pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Type & Amount:</span>
                      <span className="font-black text-amber-700">
                        {pm.type === 'PERCENTAGE' ? `${pm.rateOrAmount}%` : pm.displayRate}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({pm.type})</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Applies On:</span>
                      <span className="font-semibold text-slate-700 text-[11px]">
                        {pm.applicableRule === 'AFTER_DUE_DATE' ? 'After Due Date' :
                         pm.applicableRule === 'BOUNCED_CHEQUE' ? 'Bounced Cheque' : 'Manual Assignment'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Grace Period:</span>
                      <span className="font-semibold text-slate-700 text-[11px]">
                        {pm.gracePeriodDays ? `${pm.gracePeriodDays} Days` : '0 Days (Immediate)'}
                      </span>
                    </div>
                  </div>

                  {pm.description && (
                    <p className="text-[11px] text-slate-500 pt-2 mt-2 border-t border-slate-100 line-clamp-2">
                      {pm.description}
                    </p>
                  )}
                </div>

                {/* Card Actions: Edit, Toggle Active/Inactive, Delete */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleToggleRuleStatus(pm)}
                    title={pm.status === 'ACTIVE' ? 'Click to Deactivate' : 'Click to Activate'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                      pm.status === 'ACTIVE'
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="h-3 w-3" />
                    {pm.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditRule(pm)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-[11px] font-semibold transition-colors"
                      title="Edit Penalty Rule"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeletingRule(pm);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Penalty Rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Member Penalties View */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-4 border-b border-slate-100">
          <div className="w-full sm:w-80">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Member to Inspect Penalties
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
            >
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.memberId} — {m.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Penalties Table for selected member */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Penalty ID</th>
                <th className="py-2.5 px-3">Title / Reason</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Waived</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {penaltiesLoading ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">Loading member penalties...</td>
                </tr>
              ) : memberPenalties.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">No penalties recorded for this member.</td>
                </tr>
              ) : (
                memberPenalties.map((pen) => (
                  <tr key={pen._id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{pen.memberPenaltyId}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800">{pen.title}</p>
                      {pen.reason && <p className="text-[10px] text-slate-500">{pen.reason}</p>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{pen.formattedAmount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">{pen.formattedWaived}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">{pen.formattedOutstanding}</td>
                    <td className="py-2.5 px-3"><Badge status={pen.status} /></td>
                    <td className="py-2.5 px-3 text-right">
                      {pen.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setWaivingPenalty(pen);
                            setWaiverReason('');
                            setIsWaiveModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100"
                        >
                          Waive
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Penalty Rule Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title={editingRule ? `Edit Penalty Rule (${editingRule.penaltyId})` : 'Add New Penalty Rule'}
        subtitle={editingRule ? 'Update parameters for this penalty rule.' : 'Define a new penalty rule for the society.'}
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleRuleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Rule Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Late Installment Fine, Bounced Cheque Fee"
              value={ruleForm.title}
              onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fee Type</label>
              <select
                value={ruleForm.type}
                onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="FIXED">FIXED (₹ Flat Amount)</option>
                <option value="PERCENTAGE">PERCENTAGE (% of Installment)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {ruleForm.type === 'FIXED' ? 'Amount in Rupees (₹)' : 'Percentage Rate (%)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={ruleForm.type === 'PERCENTAGE' ? '0.1' : '1'}
                required
                value={ruleForm.rateOrAmount}
                onChange={(e) => setRuleForm({ ...ruleForm, rateOrAmount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                placeholder={ruleForm.type === 'FIXED' ? 'e.g. 100' : 'e.g. 5'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Applicable Trigger</label>
              <select
                value={ruleForm.applicableRule}
                onChange={(e) => setRuleForm({ ...ruleForm, applicableRule: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="AFTER_DUE_DATE">After Due Date (Overdue Installment)</option>
                <option value="BOUNCED_CHEQUE">Bounced / Dishonored Cheque</option>
                <option value="MANUAL">Manual / Ad-hoc Assessment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Grace Period (Days)</label>
              <input
                type="number"
                min={0}
                value={ruleForm.gracePeriodDays}
                onChange={(e) => setRuleForm({ ...ruleForm, gracePeriodDays: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                placeholder="0 for immediate"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Rule Status</label>
            <select
              value={ruleForm.status}
              onChange={(e) => setRuleForm({ ...ruleForm, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={ruleForm.description}
              onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              placeholder="Society policy remarks or penalty terms..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Penalty Rule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Rule Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Penalty Rule"
        subtitle="Are you sure you want to delete this penalty rule?"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are about to delete <strong>{deletingRule?.title}</strong> ({deletingRule?.penaltyId}).
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
            <strong>Note:</strong> If this rule has already been applied to any member penalties, the system will safely deactivate it instead of hard-deleting, preserving all financial and audit records.
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
              onClick={handleDeleteRule}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Penalty Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Penalty to Member"
        subtitle="Assessing a penalty creates a debit in the member ledger, increasing outstanding balance."
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Member</label>
            <select
              value={assignForm.memberId}
              onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.memberId} — {m.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Configured Rule (Optional)</label>
            <select
              value={assignForm.penaltyMasterId}
              onChange={(e) => {
                const chosen = penaltyMasters.find(p => p._id === e.target.value);
                const rateVal = chosen 
                  ? (chosen.rateOrAmountRupees !== undefined ? chosen.rateOrAmountRupees : (chosen.type === 'FIXED' ? (chosen.rateOrAmount / 100) : 100))
                  : assignForm.amountRupees;
                setAssignForm({
                  ...assignForm,
                  penaltyMasterId: e.target.value,
                  title: chosen ? chosen.title : assignForm.title,
                  amountRupees: chosen && chosen.type === 'FIXED' ? rateVal : assignForm.amountRupees
                });
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">-- Custom / Ad-hoc Penalty --</option>
              {penaltyMasters.map((pm) => (
                <option key={pm._id} value={pm._id}>
                  {pm.penaltyId} — {pm.title} ({pm.displayRate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Penalty Title</label>
            <input
              type="text"
              required
              value={assignForm.title}
              onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Penalty Amount (₹)</label>
            <input
              type="number"
              min={1}
              required
              value={assignForm.amountRupees}
              onChange={(e) => setAssignForm({ ...assignForm, amountRupees: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Assessment</label>
            <textarea
              rows={2}
              value={assignForm.reason}
              onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
              placeholder="e.g. Failure to submit required documents by deadline"
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign Penalty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Waive Penalty Modal */}
      <Modal
        isOpen={isWaiveModalOpen}
        onClose={() => setIsWaiveModalOpen(false)}
        title={`Waive Penalty: ${waivingPenalty?.memberPenaltyId}`}
        subtitle="Director authorization required. A waiver will credit the member ledger and record an audit log."
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleWaiveSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
            <p><strong>Waiving Penalty:</strong> {waivingPenalty?.title}</p>
            <p><strong>Outstanding Amount:</strong> {waivingPenalty?.formattedOutstanding}</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Director Reason for Waiver <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={waiverReason}
              onChange={(e) => setWaiverReason(e.target.value)}
              placeholder="Provide justification for granting waiver under society rules..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsWaiveModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Processing Waiver...' : 'Authorize Waiver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}