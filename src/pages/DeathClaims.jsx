import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { fetchAllMembers } from '../utils/memberApi';
import {
  HeartCrack,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck,
  Upload,
  ArrowRight
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function DeathClaims() {
  const [claims, setClaims] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');

  // Register Claim Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState(new Date().toISOString().split('T')[0]);
  const [nomineeId, setNomineeId] = useState('');
  const [nomineeList, setNomineeList] = useState([]);
  const [deathCertFile, setDeathCertFile] = useState(null);

  // Pre-flight calculation preview
  const [evaluation, setEvaluation] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);

  // Director Review Modal
  const [reviewingClaim, setReviewingClaim] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [approvedAmountRupees, setApprovedAmountRupees] = useState(100000);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/death-claims', {
        params: { status: statusFilter }
      });
      setClaims(res.data.claims || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  useEffect(() => {
    fetchAllMembers().then(setMembers);
  }, []);

  // When member or date of death changes, calculate pre-flight eligibility
  useEffect(() => {
    if (!selectedMemberId || !dateOfDeath) return;
    setEvalLoading(true);
    setEvaluation(null);

    Promise.all([
      api.post('/death-claims/check-eligibility', { memberId: selectedMemberId, dateOfDeath }),
      api.get(`/nominees/member/${selectedMemberId}`)
    ]).then(([evalRes, nomRes]) => {
      setEvaluation(evalRes.data.evaluation);
      const noms = nomRes.data.nominees || [];
      setNomineeList(noms);
      if (noms.length > 0) {
        setNomineeId(noms[0]._id);
      }
    }).catch((err) => {
      console.error(err);
    }).finally(() => {
      setEvalLoading(false);
    });
  }, [selectedMemberId, dateOfDeath]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setModalError('Search for and select a member before submitting.');
      return;
    }
    setModalError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('memberId', selectedMemberId);
      formData.append('dateOfDeath', dateOfDeath);
      if (nomineeId) formData.append('nomineeId', nomineeId);
      if (deathCertFile) formData.append('deathCertificate', deathCertFile);

      const res = await api.post('/death-claims', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFeedbackMsg(res.data.message);
      setIsRegisterModalOpen(false);
      fetchClaims();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error registering death claim');
    } finally {
      setSubmitting(false);
    }
  };

  const matchingMembers = members.filter((member) => {
    const query = memberSearchQuery.trim().toLowerCase();
    return query.length >= 3 && (
      member.fullName.toLowerCase().includes(query) ||
      member.memberId.toLowerCase().includes(query)
    );
  });

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingClaim) return;
    setModalError('');
    setSubmitting(true);

    try {
      const res = await api.post(`/death-claims/${reviewingClaim._id}/review`, {
        action: reviewAction,
        approvedAmountRupees: Number(approvedAmountRupees),
        remarks: reviewRemarks,
        rejectionReason
      });

      setFeedbackMsg(res.data.message);
      setReviewingClaim(null);
      fetchClaims();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error reviewing claim');
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
            <HeartCrack className="h-6 w-6 text-rose-600" />
            Death Claim & Assistance Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Validate membership death assistance claims under strict society rules. Cheques are issued only when required installments are 100% cleared.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedMemberId('');
            setMemberSearchQuery('');
            setEvaluation(null);
            setNomineeId('');
            setNomineeList([]);
            setDeathCertFile(null);
            setModalError('');
            setIsRegisterModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          File Death Claim
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Rules Notice Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">CRITICAL SOCIETY BUSINESS RULE:</strong>
          <p className="mt-0.5">
            A death claim cannot proceed to cheque issuance if the deceased member has unpaid required installments under society policy.
            Uncleared and bounced cheques are never counted as paid. Claims must be reviewed and approved by the Director prior to cheque issuance.
          </p>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Deceased Member</th>
                <th className="py-3 px-4">Date of Death</th>
                <th className="py-3 px-4">Registered Nominee</th>
                <th className="py-3 px-4 text-right">Pending Dues at Death</th>
                <th className="py-3 px-4 text-center">Eligibility Rule</th>
                <th className="py-3 px-4 text-center">Claim Status</th>
                <th className="py-3 px-4 text-right">Director Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading claims...</td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No death claims registered.</td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.claimId}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.memberId?.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {c.memberId?.memberId} • {c.memberId?.villageId?.name || '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {new Date(c.dateOfDeath).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{c.nomineeName}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{c.nomineeRelation}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {c.pendingInstallmentsPaise > 0 ? (
                        <span className="text-rose-600">{c.formattedPending}</span>
                      ) : (
                        <span className="text-emerald-700">₹0.00 (Cleared)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={c.eligibilityStatus} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={c.claimStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.claimStatus === 'PENDING_REVIEW' ? (
                        <button
                          onClick={() => {
                            setReviewingClaim(c);
                            setReviewAction('APPROVE');
                            setApprovedAmountRupees(c.approvedAmountPaise > 0 ? c.approvedAmountPaise / 100 : 100000);
                            setReviewRemarks('Approved after verifying society eligibility records.');
                            setModalError('');
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow-2xs"
                        >
                          Review & Decide
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {c.claimStatus === 'APPROVED' ? `Approved: ${c.formattedApprovedAmount}` : c.claimStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Death Claim Modal with Pre-Flight Eligibility Calculator */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="File New Death Claim"
        subtitle="Automatic calculation verifies if member has cleared all required installment dues."
        maxWidth="max-w-2xl"
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Deceased Member <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="search"
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value);
                    setSelectedMemberId('');
                    setEvaluation(null);
                    setNomineeId('');
                    setNomineeList([]);
                  }}
                  placeholder="Type at least 3 characters to search members..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              {memberSearchQuery.trim().length >= 3 && (
                <div className="mt-1 max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {matchingMembers.length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-400">No members match your search.</p>
                  ) : matchingMembers.map((member) => (
                    <button
                      type="button"
                      key={member._id}
                      onClick={() => {
                        setSelectedMemberId(member._id);
                        setMemberSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-rose-50"
                    >
                      {member.memberId} — {member.fullName}
                    </button>
                  ))}
                </div>
              )}
              {selectedMemberId && (
                <p className="mt-1 text-xs font-semibold text-rose-700">
                  Selected: {members.find((member) => member._id === selectedMemberId)?.memberId} — {members.find((member) => member._id === selectedMemberId)?.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Date of Death <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Pre-Flight Eligibility Calculator Box */}
          {evalLoading ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
              Calculating installment dues up to date of death...
            </div>
          ) : evaluation && (
            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Real-Time Eligibility Calculation</span>
                <Badge status={evaluation.eligibilityStatus} />
              </h4>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Required Dues:</span>
                  <p className="font-bold text-slate-800">{evaluation.formattedRequired}</p>
                </div>
                <div className="p-2 bg-white rounded border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Confirmed Paid:</span>
                  <p className="font-bold text-emerald-700">{evaluation.formattedPaid}</p>
                </div>
                <div className="p-2 bg-white rounded border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Pending Dues:</span>
                  <p className="font-bold text-rose-600">{evaluation.formattedPending}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 italic">
                {evaluation.eligibilityReason}
              </p>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Registered Nominee / Beneficiary <span className="text-rose-500">*</span>
            </label>
            {nomineeList.length > 0 ? (
              <select
                value={nomineeId}
                onChange={(e) => setNomineeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                {nomineeList.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.nomineeName} ({n.relation}) — Share: {n.sharePercentage}%
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                No nominees registered on file for this member. Nominee details can be entered manually during review.
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Upload Death Certificate (PDF, PNG, JPG)</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setDeathCertFile(e.target.files[0])}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Registering Claim...' : 'Register Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Director Review & Approval Modal */}
      <Modal
        isOpen={!!reviewingClaim}
        onClose={() => setReviewingClaim(null)}
        title={`Director Claim Review: ${reviewingClaim?.claimId}`}
        subtitle="Formal review step: Ensure all society requirements are fulfilled before releasing death benefit."
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <p><strong>Member:</strong> {reviewingClaim?.memberId?.fullName} ({reviewingClaim?.memberId?.memberId})</p>
            <p><strong>Nominee Beneficiary:</strong> {reviewingClaim?.nomineeName} ({reviewingClaim?.nomineeRelation})</p>
            <p><strong>Pending Installment Dues:</strong> <span className="font-mono font-bold text-rose-600">{reviewingClaim?.formattedPending}</span></p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Director Decision</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReviewAction('APPROVE')}
                className={`py-2 px-3 rounded-lg font-bold border text-center ${
                  reviewAction === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Approve Assistance Claim
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('REJECT')}
                className={`py-2 px-3 rounded-lg font-bold border text-center ${
                  reviewAction === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Reject Claim
              </button>
            </div>
          </div>

          {reviewAction === 'APPROVE' ? (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Approved Assistance Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={approvedAmountRupees}
                  onChange={(e) => setApprovedAmountRupees(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-sm text-indigo-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Approval Remarks</label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Verified zero dues and death certificate on file."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Rejection</label>
              <textarea
                required
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State formal justification under Gnati rules..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReviewingClaim(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg font-bold text-white transition disabled:opacity-50 ${
                reviewAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? 'Submitting Decision...' : `Confirm ${reviewAction}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
