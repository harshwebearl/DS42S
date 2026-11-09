import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Search,
  Filter,
  Check,
  XCircle,
  Building2,
  Layers,
  ArrowRight,
  Trash2,
  X
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export default function ChequeClearance() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals for Actions
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [actionType, setActionType] = useState(null); // 'DEPOSIT', 'CLEAR', 'BOUNCE'
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [clearanceDate, setClearanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [clearanceReference, setClearanceReference] = useState('');
  const [bounceDate, setBounceDate] = useState(new Date().toISOString().split('T')[0]);
  const [bounceReason, setBounceReason] = useState('Insufficient Funds / Signature Difference');

  // Modal for Delete
  const [chequeToDelete, setChequeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // View linked allocations modal
  const [viewAllocationsCheque, setViewAllocationsCheque] = useState(null);

  const fetchCheques = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cheques', {
        params: { search, status: statusFilter }
      });
      setCheques(res.data.cheques || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();
  }, [search, statusFilter]);

  const openActionModal = (c, type) => {
    setSelectedCheque(c);
    setActionType(type);
    setErrorMsg('');
    if (type === 'CLEAR') {
      setClearanceReference('');
      setClearanceDate(new Date().toISOString().split('T')[0]);
    } else if (type === 'BOUNCE') {
      setBounceReason('Insufficient Funds / Refer to Drawer');
      setBounceDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCheque || !actionType) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      let payload = { status: actionType === 'DEPOSIT' ? 'DEPOSITED' : actionType === 'CLEAR' ? 'CLEARED' : 'BOUNCED' };
      if (actionType === 'DEPOSIT') {
        payload.depositDate = depositDate;
      } else if (actionType === 'CLEAR') {
        payload.clearanceDate = clearanceDate;
        payload.clearanceReference = clearanceReference;
      } else if (actionType === 'BOUNCE') {
        payload.bounceDate = bounceDate;
        payload.bounceReason = bounceReason;
      }

      const res = await api.patch(`/cheques/${selectedCheque._id}/status`, payload);
      setFeedback(res.data.message);
      setActionType(null);
      fetchCheques();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating cheque status');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (c) => {
    setChequeToDelete(c);
    setErrorMsg('');
  };

  const handleDeleteCheque = async () => {
    if (!chequeToDelete) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      const res = await api.delete(`/cheques/${chequeToDelete._id}`);
      setFeedback(res.data.message || 'Cheque deleted successfully.');
      setChequeToDelete(null);
      fetchCheques();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error deleting cheque.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-indigo-600" />
            Cheque Clearance Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track cheques from Received to Deposited, Cleared, or Bounced. Clearance updates all linked member accounts atomically.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Cheque No, Bank, Payer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 font-semibold"
          >
            <option value="">All Cheques</option>
            <option value="RECEIVED">Received (Pending Deposit)</option>
            <option value="DEPOSITED">Deposited (Awaiting Clearance)</option>
            <option value="CLEARED">Cleared</option>
            <option value="BOUNCED">Bounced</option>
          </select>
        </div>
      </div>

      {/* Cheques Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Cheque Particulars</th>
                <th className="py-3 px-4">Payer / Source</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Clearance Ref / Dates</th>
                <th className="py-3 px-4 text-right">Clearance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading cheques queue...</td>
                </tr>
              ) : cheques.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No cheque transactions found.</td>
                </tr>
              ) : (
                cheques.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900">
                        #{c.chequeDetails?.chequeNumber || 'N/A'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {c.chequeDetails?.bankName} (Dated: {c.chequeDetails?.chequeDate ? new Date(c.chequeDetails.chequeDate).toLocaleDateString() : '-'})
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{c.payerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{c.transactionId}</p>
                    </td>

                    <td className="py-3 px-4">
                      {c.isBulk ? (
                        <button
                          type="button"
                          onClick={() => setViewAllocationsCheque(c)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                        >
                          <Layers className="h-3 w-3" />
                          Group ({c.allocations?.length || 0})
                        </button>
                      ) : (
                        <span className="text-slate-500 font-medium">Single Member</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-black font-mono text-sm text-indigo-900">
                      {c.formattedTotalAmount}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge status={c.paymentStatus} />
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      {c.paymentStatus === 'CLEARED' && (
                        <div>
                          <p className="font-bold text-emerald-700">Cleared: {c.chequeDetails?.clearanceDate ? new Date(c.chequeDetails.clearanceDate).toLocaleDateString() : '-'}</p>
                          <p className="font-mono text-slate-500">Ref: {c.chequeDetails?.clearanceReference}</p>
                        </div>
                      )}
                      {c.paymentStatus === 'DEPOSITED' && (
                        <p className="text-amber-700">Deposited on: {new Date(c.chequeDetails?.depositDate).toLocaleDateString()}</p>
                      )}
                      {c.paymentStatus === 'BOUNCED' && (
                        <p className="text-rose-600 font-medium">Reason: {c.chequeDetails?.bounceReason}</p>
                      )}
                      {c.paymentStatus === 'RECEIVED' && (
                        <p className="text-slate-400">Awaiting bank deposit</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.paymentStatus === 'RECEIVED' && (
                          <button
                            onClick={() => openActionModal(c, 'DEPOSIT')}
                            className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 transition cursor-pointer"
                          >
                            Deposit
                          </button>
                        )}

                        {['RECEIVED', 'DEPOSITED'].includes(c.paymentStatus) && (
                          <>
                            <button
                              onClick={() => openActionModal(c, 'CLEAR')}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => openActionModal(c, 'BOUNCE')}
                              className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 transition cursor-pointer"
                            >
                              Bounce
                            </button>
                          </>
                        )}

                        {c.paymentStatus === 'CLEARED' && (
                          <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Cleared
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(c)}
                          title="ચેક ડિલીટ કરો (Delete Cheque)"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition inline-flex items-center cursor-pointer ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog Modal */}
      <Modal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        title={
          actionType === 'DEPOSIT'
            ? `Mark Cheque #${selectedCheque?.chequeDetails?.chequeNumber} as Deposited`
            : actionType === 'CLEAR'
            ? `Confirm Clearance of Cheque #${selectedCheque?.chequeDetails?.chequeNumber}`
            : `Record Cheque Bounce for #${selectedCheque?.chequeDetails?.chequeNumber}`
        }
        subtitle="This action will synchronize all member allocations linked to this cheque."
      >
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <p><strong>Payer:</strong> {selectedCheque?.payerName}</p>
            <p><strong>Cheque Amount:</strong> {selectedCheque?.formattedTotalAmount}</p>
            <p><strong>Linked Members:</strong> {selectedCheque?.allocations?.length || 1} members</p>
          </div>

          {actionType === 'DEPOSIT' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bank Deposit Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          )}

          {actionType === 'CLEAR' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                Marking this cheque as <strong>CLEARED</strong> will confirm all {selectedCheque?.allocations?.length || 1} member allocation(s), credit their running financial ledgers, and mark installment dues as PAID.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Clearance Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={clearanceDate}
                  onChange={(e) => setClearanceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Clearance Reference / UTR Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clearanceReference}
                  onChange={(e) => setClearanceReference(e.target.value)}
                  placeholder="e.g. UTR-HDFC-99887711 or Bank Statement Ref"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          )}

          {actionType === 'BOUNCE' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                Marking this cheque as <strong>BOUNCED</strong> will keep all installment dues PENDING and ensure no member receives paid credit for this cheque.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bounce Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={bounceDate}
                  onChange={(e) => setBounceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Reason for Return / Bounce <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bounceReason}
                  onChange={(e) => setBounceReason(e.target.value)}
                  placeholder="e.g. Insufficient Funds / Refer to Drawer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActionType(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg font-bold text-white transition disabled:opacity-50 ${
                actionType === 'CLEAR'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : actionType === 'BOUNCE'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submitting ? 'Updating...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Linked Allocations Modal */}
      <Modal
        isOpen={!!viewAllocationsCheque}
        onClose={() => setViewAllocationsCheque(null)}
        title={`Linked Member Allocations: Cheque #${viewAllocationsCheque?.chequeDetails?.chequeNumber}`}
        subtitle={`Master Transaction ID: ${viewAllocationsCheque?.transactionId} • Total Amount: ${viewAllocationsCheque?.formattedTotalAmount}`}
      >
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-3">Member ID</th>
                  <th className="py-2 px-3">Member Name</th>
                  <th className="py-2 px-3 text-right">Allocated Amount</th>
                  <th className="py-2 px-3">Allocation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(viewAllocationsCheque?.allocations || []).map((a) => (
                  <tr key={a.allocationId}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{a.memberId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{a.fullName}</td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-700 font-mono">₹{a.amountINR}</td>
                    <td className="py-2 px-3"><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!chequeToDelete}
        onClose={() => setChequeToDelete(null)}
        title={`ચેક ડિલીટ કરો: #${chequeToDelete?.chequeDetails?.chequeNumber || 'N/A'}`}
        subtitle="ચેક ટ્રાન્ઝેક્શનને સિસ્ટમમાંથી કાયમ માટે ડિલીટ કરવા માટે પુષ્ટિ કરો."
      >
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {chequeToDelete?.paymentStatus === 'CLEARED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">મહત્વપૂર્ણ ચેતવણી:</p>
                <p className="mt-0.5">
                  આ ચેક <strong>CLEARED</strong> છે. તેને ડિલીટ કરવાથી જોડાયેલા તમામ સભ્યોના હપ્તા ચૂકવણી (Dues) રિવર્ટ થશે અને લેજરમાંથી ક્રેડિટ આપમેળે હટી જશે.
                </p>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">ચેક નંબર:</span>
              <span className="font-mono font-bold text-slate-800">#{chequeToDelete?.chequeDetails?.chequeNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">બેંકનું નામ:</span>
              <span className="font-bold text-slate-800">{chequeToDelete?.chequeDetails?.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">ચૂકવનારનું નામ (Payer):</span>
              <span className="font-bold text-slate-800">{chequeToDelete?.payerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">ટ્રાન્ઝેક્શન ID:</span>
              <span className="font-mono text-slate-600">{chequeToDelete?.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">રકમ (Amount):</span>
              <span className="font-mono font-black text-indigo-700">{chequeToDelete?.formattedTotalAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">હાલનું સ્ટેટસ:</span>
              <Badge status={chequeToDelete?.paymentStatus} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">જોડાયેલા સભ્યો:</span>
              <span className="font-bold text-slate-700">{chequeToDelete?.allocations?.length || 1} સભ્ય</span>
            </div>
          </div>

          <p className="text-slate-600 font-medium">
            શું તમે ખરેખર આ ચેક ટ્રાન્ઝેક્શન ડિલીટ કરવા માંગો છો? આ ક્રિયા રદ થઈ શકશે નહીં.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setChequeToDelete(null)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              રદ કરો (Cancel)
            </button>
            <button
              type="button"
              onClick={handleDeleteCheque}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {deleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>હા, ડિલીટ કરો (Delete Cheque)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
