import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Check,
  Building
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function ClaimCheques() {
  const [claimCheques, setClaimCheques] = useState([]);
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Issue Cheque Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    claimId: '',
    beneficiaryName: '',
    bankName: '',
    bankAccountNumber: '',
    chequeNumber: '',
    chequeAmountRupees: 100000,
    issueDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Handover Modal
  const [handoverModalCheque, setHandoverModalCheque] = useState(null);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [handoverRecipientName, setHandoverRecipientName] = useState('');
  const [handoverRecipientPhone, setHandoverRecipientPhone] = useState('');
  const [handoverAckFile, setHandoverAckFile] = useState(null);

  // Clearance Modal
  const [clearanceModalCheque, setClearanceModalCheque] = useState(null);
  const [clearanceDate, setClearanceDate] = useState(new Date().toISOString().split('T')[0]);

  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchClaimCheques = async () => {
    setLoading(true);
    try {
      const res = await api.get('/claim-cheques');
      setClaimCheques(res.data.cheques || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedClaims = async () => {
    try {
      const res = await api.get('/death-claims?status=APPROVED');
      setApprovedClaims(res.data.claims || []);
      if (res.data.claims?.length > 0) {
        const first = res.data.claims[0];
        setIssueForm((prev) => ({
          ...prev,
          claimId: first._id,
          beneficiaryName: first.nomineeName,
          chequeAmountRupees: first.approvedAmountRupees || 100000
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClaimCheques();
    fetchApprovedClaims();
  }, []);

  const handleClaimSelect = (claimId) => {
    const claim = approvedClaims.find((c) => c._id === claimId);
    if (claim) {
      setIssueForm({
        ...issueForm,
        claimId,
        beneficiaryName: claim.nomineeName,
        chequeAmountRupees: claim.approvedAmountRupees || 100000
      });
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      const res = await api.post('/claim-cheques', issueForm);
      setFeedbackMsg(res.data.message);
      setIsIssueModalOpen(false);
      fetchClaimCheques();
      fetchApprovedClaims();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error issuing claim cheque');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    if (!handoverModalCheque) return;
    setSubmitting(true);
    setModalError('');

    try {
      const formData = new FormData();
      formData.append('handoverDate', handoverDate);
      formData.append('handoverRecipientName', handoverRecipientName);
      formData.append('handoverRecipientPhone', handoverRecipientPhone);
      if (handoverAckFile) formData.append('handoverAckDocument', handoverAckFile);

      const res = await api.post(`/claim-cheques/${handoverModalCheque._id}/handover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFeedbackMsg(res.data.message);
      setHandoverModalCheque(null);
      fetchClaimCheques();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error recording handover');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearanceSubmit = async (e) => {
    e.preventDefault();
    if (!clearanceModalCheque) return;
    setSubmitting(true);

    try {
      const res = await api.patch(`/claim-cheques/${clearanceModalCheque._id}/status`, {
        status: 'CLEARED',
        clearanceDate
      });
      setFeedbackMsg(res.data.message);
      setClearanceModalCheque(null);
      fetchClaimCheques();
    } catch (err) {
      alert(err.response?.data?.message || 'Error clearing cheque');
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
            <FileCheck2 className="h-6 w-6 text-indigo-600" />
            Claim Cheque Issue Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Issue and disburse assistance cheques for approved claims. Track preparation, handover, and bank clearance.
          </p>
        </div>
        <button
          onClick={() => {
            fetchApprovedClaims();
            setModalError('');
            setIsIssueModalOpen(true);
          }}
          disabled={approvedClaims.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Issue Claim Cheque ({approvedClaims.length} Approved Ready)
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Cheques Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Cheque Record ID</th>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Deceased Member</th>
                <th className="py-3 px-4">Beneficiary Payee</th>
                <th className="py-3 px-4">Bank & Cheque No</th>
                <th className="py-3 px-4 text-right">Cheque Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading claim cheques...</td>
                </tr>
              ) : claimCheques.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No claim cheques issued yet.</td>
                </tr>
              ) : (
                claimCheques.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.claimChequeId}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.claimId?.claimId}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.memberId?.fullName}</p>
                      <p className="text-[10px] text-slate-500">{c.memberId?.villageId?.name || '-'}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{c.beneficiaryName}</td>
                    <td className="py-3 px-4 font-mono">
                      <p className="font-bold text-slate-900">#{c.chequeNumber}</p>
                      <p className="text-[10px] text-slate-500 font-sans">{c.bankName}</p>
                      {c.bankAccountNumber && (
                        <p className="text-[10px] text-slate-500 font-mono">Account: {c.bankAccountNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-sm text-indigo-700">
                      {c.formattedAmount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={c.chequeStatus} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {c.chequeStatus === 'ISSUED' && (
                        <button
                          onClick={() => {
                            setHandoverModalCheque(c);
                            setHandoverRecipientName(c.beneficiaryName);
                            setHandoverRecipientPhone('');
                            setHandoverAckFile(null);
                            setModalError('');
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-100 text-xs"
                        >
                          Record Handover
                        </button>
                      )}

                      {c.chequeStatus === 'HANDED_OVER' && (
                        <button
                          onClick={() => {
                            setClearanceModalCheque(c);
                            setClearanceDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs shadow-2xs"
                        >
                          Mark Cleared
                        </button>
                      )}

                      {c.chequeStatus === 'CLEARED' && (
                        <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Disbursed
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

      {/* Prepare / Issue Cheque Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Prepare & Issue Death Claim Cheque"
        subtitle="Only Director-approved death claims are eligible for cheque issuance."
      >
        {modalError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Select Approved Death Claim <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={issueForm.claimId}
              onChange={(e) => handleClaimSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              {approvedClaims.map((ac) => (
                <option key={ac._id} value={ac._id}>
                  {ac.claimId} — {ac.memberId?.fullName} (Nominee: {ac.nomineeName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Beneficiary / Payee Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={issueForm.beneficiaryName}
                onChange={(e) => setIssueForm({ ...issueForm, beneficiaryName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cheque Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={issueForm.chequeAmountRupees}
                onChange={(e) => setIssueForm({ ...issueForm, chequeAmountRupees: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-indigo-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={issueForm.bankName}
                onChange={(e) => setIssueForm({ ...issueForm, bankName: e.target.value })}
                placeholder="e.g. State Bank of India, Bhavnagar"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bank Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={issueForm.bankAccountNumber}
                onChange={(e) => setIssueForm({ ...issueForm, bankAccountNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cheque Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={issueForm.chequeNumber}
                onChange={(e) => setIssueForm({ ...issueForm, chequeNumber: e.target.value })}
                placeholder="e.g. 556677"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Issuing...' : 'Issue Claim Cheque'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Handover Modal */}
      <Modal
        isOpen={!!handoverModalCheque}
        onClose={() => setHandoverModalCheque(null)}
        title={`Record Handover: Cheque #${handoverModalCheque?.chequeNumber}`}
        subtitle="Track delivery of assistance cheque to the registered beneficiary."
      >
        <form onSubmit={handleHandoverSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Handover Date</label>
            <input
              type="date"
              required
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={handoverRecipientName}
                onChange={(e) => setHandoverRecipientName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Contact</label>
              <input
                type="tel"
                value={handoverRecipientPhone}
                onChange={(e) => setHandoverRecipientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Upload Handover Acknowledgement Document</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setHandoverAckFile(e.target.files[0])}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setHandoverModalCheque(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Handover'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Cleared Modal */}
      <Modal
        isOpen={!!clearanceModalCheque}
        onClose={() => setClearanceModalCheque(null)}
        title={`Confirm Clearance of Cheque #${clearanceModalCheque?.chequeNumber}`}
        subtitle="Once cleared, the death claim will be officially marked as finalized and DISBURSED."
      >
        <form onSubmit={handleClearanceSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
            Confirming clearance signifies the beneficiary has successfully encashed the assistance cheque of {clearanceModalCheque?.formattedAmount}.
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Bank Clearance Realization Date</label>
            <input
              type="date"
              required
              value={clearanceDate}
              onChange={(e) => setClearanceDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setClearanceModalCheque(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Confirm Clearance & Disburse'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
