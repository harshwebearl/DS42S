import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { AlertTriangle, Plus, ShieldCheck, UserX, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function Penalties() {
  const [penaltyMasters, setPenaltyMasters] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    Promise.all([
      api.get('/penalties/masters'),
      api.get('/members?limit=100')
    ]).then(([pmRes, memRes]) => {
      setPenaltyMasters(pmRes.data.penaltyMasters || []);
      const mList = memRes.data.members || [];
      setMembers(mList);
      if (mList.length > 0) {
        setSelectedMemberId(mList[0]._id);
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Penalty Masters Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Configured Penalty Rules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {penaltyMasters.map((pm) => (
            <div key={pm._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500">{pm.penaltyId}</span>
                <Badge status={pm.status} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{pm.title}</h4>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Rate / Amount:</span>
                <span className="font-black text-amber-700">{pm.displayRate}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">{pm.description}</p>
            </div>
          ))}
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
