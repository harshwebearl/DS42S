import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CreditCard, FileText, Pencil, Search, Save, UserPlus, X } from 'lucide-react';
import api from '../api/axiosClient';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { fetchAllMembers } from '../utils/memberApi';
import IfscInput from '../components/common/IfscInput';
import SinglePaymentReceipt from '../components/receipts/SinglePaymentReceipt';
import BulkPaymentReceipt from '../components/receipts/BulkPaymentReceipt';

const blankChequeDetails = {
  chequeNumber: '',
  bankName: '',
  ifscCode: '',
  chequeDate: ''
};

export default function PaymentManagement() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [form, setForm] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payments', {
        params: { search, page, limit: 50 }
      });
      setTransactions(response.data.transactions || []);
      setTotalPages(Math.max(1, response.data.totalPages || 1));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, page]);

  useEffect(() => {
    fetchAllMembers()
      .then(setMembers)
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Could not load members for payment editing.');
      });
  }, []);

  const matchingMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (query.length < 3) return [];
    return members.filter((member) =>
      member.fullName.toLowerCase().includes(query) ||
      member.memberId.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [memberSearch, members]);

  const openEdit = async (transactionId) => {
    setError('');
    try {
      const response = await api.get(`/payments/${transactionId}`);
      const transaction = response.data.transaction;
      const allocations = (response.data.allocations || []).map((allocation) => ({
        memberId: allocation.memberId || allocation.member?.id,
        memberName: allocation.member
          ? `${allocation.member.memberId} — ${allocation.member.fullName}`
          : '',
        amountRupees: String(allocation.amountRupees),
        selectedDueIds: allocation.selectedDueIds || [],
        waivedDueIds: allocation.waivedDueIds || [],
        waivePenalty: allocation.waivePenalty,
        notes: allocation.notes || ''
      }));
      setForm({
        _id: transaction._id,
        transactionId: transaction.transactionId,
        isBulk: transaction.isBulk,
        paymentStatus: transaction.paymentStatus,
        payerName: transaction.payerName || '',
        payerMobile: transaction.payerMobile || '',
        paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().slice(0, 10) : '',
        paymentMode: transaction.paymentMode,
        totalAmountRupees: String(transaction.totalAmountRupees),
        chequeDetails: { ...blankChequeDetails, ...transaction.chequeDetails },
        referenceNumber: transaction.referenceNumber || '',
        remarks: transaction.remarks || '',
        allocations
      });
      setMemberSearch('');
      setEditing(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this payment for editing.');
    }
  };

  const openReceipt = async (transactionId) => {
    setError('');
    setReceiptLoading(true);
    try {
      const response = await api.get(`/payments/${transactionId}`);
      const transaction = response.data.transaction;
      const allocations = response.data.allocations || [];

      if (transaction.isBulk) {
        setSelectedReceipt({ ...transaction, allocations });
      } else {
        const allocation = allocations[0];
        const member = allocation?.member || transaction.singleMemberId;
        setSelectedReceipt({
          ...transaction,
          totalAmountINR: transaction.formattedTotalAmount,
          member: {
            memberId: member?.memberId || '-',
            fullName: member?.fullName || transaction.payerName,
            village: member?.village || member?.villageId?.name || ''
          },
          installments: allocation?.installments || []
        });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this payment receipt.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const setAllocationValue = (index, key, value) => {
    setForm((current) => ({
      ...current,
      allocations: current.allocations.map((allocation, rowIndex) =>
        rowIndex === index ? { ...allocation, [key]: value } : allocation
      )
    }));
  };

  const selectAllocationMember = (index, member) => {
    setForm((current) => ({
      ...current,
      allocations: current.allocations.map((allocation, rowIndex) =>
        rowIndex === index
          ? {
              ...allocation,
              memberId: member._id,
              memberName: `${member.memberId} — ${member.fullName}`,
              selectedDueIds: [],
              waivedDueIds: [],
              waivePenalty: false
            }
          : allocation
      )
    }));
    setMemberSearch('');
  };

  const addAllocation = (member) => {
    if (form.allocations.some((allocation) => allocation.memberId === member._id)) return;
    setForm((current) => ({
      ...current,
      allocations: [
        ...current.allocations,
        {
          memberId: member._id,
          memberName: `${member.memberId} — ${member.fullName}`,
          amountRupees: '',
          selectedDueIds: [],
          waivedDueIds: [],
          waivePenalty: false,
          notes: ''
        }
      ]
    }));
    setMemberSearch('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await api.put(`/payments/${form._id}`, {
        payerName: form.payerName,
        payerMobile: form.payerMobile,
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        totalAmountRupees: Number(form.totalAmountRupees),
        chequeDetails: form.paymentMode === 'CHEQUE' ? {
          chequeNumber: form.chequeDetails.chequeNumber,
          bankName: form.chequeDetails.bankName,
          ifscCode: form.chequeDetails.ifscCode,
          chequeDate: form.chequeDetails.chequeDate
        } : undefined,
        referenceNumber: form.referenceNumber,
        remarks: form.remarks,
        allocations: form.allocations.map((allocation) => ({
          memberId: allocation.memberId,
          amountRupees: Number(allocation.amountRupees),
          selectedDueIds: allocation.selectedDueIds,
          waivedDueIds: allocation.waivedDueIds,
          waivePenalty: allocation.waivePenalty,
          notes: allocation.notes
        }))
      });
      const updatedTransaction = response.data.transaction;
      const formattedTotalAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(updatedTransaction.totalAmountPaise / 100);
      const updatedMember = !form.isBulk
        ? members.find((member) => member._id === form.allocations[0]?.memberId)
        : null;
      setTransactions((current) => current.map((transaction) => (
        transaction._id === form._id
          ? {
              ...transaction,
              ...updatedTransaction,
              formattedTotalAmount,
              singleMemberId: updatedMember || transaction.singleMemberId,
              memberIds: form.isBulk
                ? form.allocations.map((allocation) => (
                    members.find((member) => member._id === allocation.memberId)?.memberId || allocation.memberId
                  ))
                : transaction.memberIds
            }
          : transaction
      )));
      setEditing(false);
      setForm(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Payment update failed.');
    } finally {
      setSaving(false);
    }
  };

  const allocationTotal = form?.allocations.reduce(
    (total, allocation) => total + (Number(allocation.amountRupees) || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
          <CreditCard className="h-6 w-6 text-indigo-600" />
          Payment Management
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Find and edit payments. Edits to cleared payments create ledger reversals and re-apply the revised allocations.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        {error && !editing && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search transaction, payer, cheque or reference..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="px-3 py-2.5">Transaction</th>
                <th className="px-3 py-2.5">Payer / Member</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Mode</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-400">Loading payments...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-400">No payments found.</td></tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="px-3 py-2.5 font-mono font-bold">{transaction.transactionId}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold">{transaction.payerName}</p>
                    <p className="text-[10px] text-slate-400">
                      {transaction.isBulk
                        ? `Group payment · ${transaction.memberIds?.join(', ') || 'No member IDs'}`
                        : `${transaction.singleMemberId?.memberId || '-'} · ${transaction.singleMemberId?.fullName || 'Single member'}`}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">{new Date(transaction.paymentDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5">{transaction.paymentMode}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold">{transaction.formattedTotalAmount}</td>
                  <td className="px-3 py-2.5"><Badge status={transaction.paymentStatus} /></td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={receiptLoading}
                        onClick={() => openReceipt(transaction._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <FileText className="h-3.5 w-3.5" /> Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(transaction._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 font-bold text-indigo-700 hover:bg-indigo-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editing}
        onClose={() => {
          if (!saving) {
            setEditing(false);
            setForm(null);
          }
        }}
        title={`Edit Payment ${form?.transactionId || ''}`}
        subtitle="All changes are recorded in the audit log. Cleared payments are reversed and re-applied."
        maxWidth="max-w-5xl"
      >
        {form && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="font-bold text-slate-700">Payer Name
                <input required value={form.payerName} onChange={(event) => setForm({ ...form, payerName: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
              </label>
              <label className="font-bold text-slate-700">Payer Mobile
                <input value={form.payerMobile} onChange={(event) => setForm({ ...form, payerMobile: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
              </label>
              <label className="font-bold text-slate-700">Payment Date
                <input type="date" required value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
              </label>
              <label className="font-bold text-slate-700">Payment Mode
                <select value={form.paymentMode} onChange={(event) => setForm({ ...form, paymentMode: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal">
                  {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => <option key={mode} value={mode}>{mode.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className="font-bold text-slate-700">Total Amount (₹)
                <input type="number" min="0.01" step="0.01" required value={form.totalAmountRupees} onChange={(event) => setForm({ ...form, totalAmountRupees: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono font-bold" />
              </label>
              <label className="font-bold text-slate-700">
                {form.paymentMode === 'UPI' ? 'UPI Reference Number' : 'Reference / UTR'}
                <input value={form.referenceNumber} onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
              </label>
            </div>
            {form.paymentMode === 'CHEQUE' && (
              <div className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 sm:grid-cols-2 lg:grid-cols-4">
                <IfscInput
                  value={form.chequeDetails.ifscCode}
                  onChange={(key, value) => setForm((current) => ({
                    ...current,
                    chequeDetails: { ...current.chequeDetails, [key]: value }
                  }))}
                />
                {[
                  ['chequeNumber', 'Cheque Number'],
                  ['bankName', 'Bank Name & Branch']
                ].map(([key, label]) => (
                  <label key={key} className="font-bold text-slate-700">{label}
                    <input required value={form.chequeDetails[key] || ''} onChange={(event) => setForm({
                      ...form,
                      chequeDetails: { ...form.chequeDetails, [key]: event.target.value }
                    })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
                  </label>
                ))}
                <label className="font-bold text-slate-700">Cheque Date
                  <input type="date" value={form.chequeDetails.chequeDate ? new Date(form.chequeDetails.chequeDate).toISOString().slice(0, 10) : ''} onChange={(event) => setForm({
                    ...form,
                    chequeDetails: { ...form.chequeDetails, chequeDate: event.target.value }
                  })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
                </label>
              </div>
            )}
            <label className="block font-bold text-slate-700">Remarks
              <textarea rows="2" value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>

            {form.isBulk && (
              <div className="relative">
                <label className="block font-bold text-slate-700">Search and add member to allocations</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Type at least 3 characters..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3" />
                </div>
                {matchingMembers.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {matchingMembers.map((member) => (
                      <button key={member._id} type="button" onClick={() => addAllocation(member)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-indigo-50">
                        <UserPlus className="h-3.5 w-3.5 text-indigo-600" /> {member.memberId} — {member.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr><th className="px-3 py-2">Member</th><th className="px-3 py-2 text-right">Allocation (₹)</th><th className="px-3 py-2">Remove</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.allocations.map((allocation, index) => (
                    <tr key={`${allocation.memberId}-${index}`}>
                      <td className="min-w-64 px-3 py-2">
                        <p className="font-semibold">{allocation.memberName}</p>
                        <div className="mt-1">
                          <input value={allocation.memberSearch || ''} onChange={(event) => setAllocationValue(index, 'memberSearch', event.target.value)} placeholder="Change member (type 3+ chars)" className="w-full rounded border px-2 py-1 text-[10px]" />
                          {(allocation.memberSearch || '').trim().length >= 3 && (
                            <div className="mt-1 max-h-24 overflow-y-auto rounded border bg-white">
                              {members.filter((member) => member.fullName.toLowerCase().includes(allocation.memberSearch.trim().toLowerCase()) || member.memberId.toLowerCase().includes(allocation.memberSearch.trim().toLowerCase())).slice(0, 10).map((member) => (
                                <button key={member._id} type="button" onClick={() => {
                                  selectAllocationMember(index, member);
                                  setAllocationValue(index, 'memberSearch', '');
                                }} className="block w-full px-2 py-1 text-left hover:bg-indigo-50">{member.memberId} — {member.fullName}</button>
                              ))}
                        </div>
                          )}
                          </div>
                      </td>
                      <td className="w-40 px-3 py-2 text-right">
                        <input type="number" min="0.01" step="0.01" required value={allocation.amountRupees} onChange={(event) => setAllocationValue(index, 'amountRupees', event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-right font-mono" />
                      </td>
                      <td className="px-3 py-2">
                        {form.isBulk && (
                          <button type="button" onClick={() => setForm({
                            ...form,
                            allocations: form.allocations.filter((_, rowIndex) => rowIndex !== index)
                          })} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="Remove allocation">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={`border-t px-3 py-2 text-right font-bold ${Math.round(allocationTotal * 100) === Math.round(Number(form.totalAmountRupees) * 100) ? 'text-emerald-700' : 'text-rose-700'}`}>
                Allocations total: ₹{allocationTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button type="button" disabled={saving} onClick={() => setEditing(false)} className="rounded-lg border px-4 py-2 font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt?.isBulk ? 'Official Group Payment Receipt' : 'Official Payment Receipt'}
        maxWidth={selectedReceipt?.isBulk ? 'max-w-5xl' : 'max-w-2xl'}
      >
        {selectedReceipt?.isBulk ? (
          <BulkPaymentReceipt receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        ) : (
          <SinglePaymentReceipt receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        )}
      </Modal>
    </div>
  );
}
