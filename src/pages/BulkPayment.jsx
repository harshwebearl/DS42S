import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import {
  Users2,
  Search,
  Plus,
  Trash2,
  Split,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Building,
  Printer,
  ArrowRight
} from 'lucide-react';
import Modal from '../components/common/Modal';
import BulkPaymentReceipt from '../components/receipts/BulkPaymentReceipt';
import Badge from '../components/common/Badge';

export default function BulkPayment() {
  const [allMembers, setAllMembers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('');

  // Master Payment Transaction Fields
  const [payerName, setPayerName] = useState('');
  const [payerMobile, setPayerMobile] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CHEQUE');
  const [totalAmountRupees, setTotalAmountRupees] = useState('5000');
  const [chequeDetails, setChequeDetails] = useState({
    chequeNumber: '',
    bankName: '',
    chequeDate: new Date().toISOString().split('T')[0]
  });
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // Selected Members Allocations Grid
  // Array of { memberId, memberObj, amountRupees, notes }
  const [allocatedRows, setAllocatedRows] = useState([]);

  // Modals & Feedback
  const [receipt, setReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/members?limit=200'),
      api.get('/villages')
    ]).then(([memRes, vilRes]) => {
      setAllMembers(memRes.data.members || []);
      setVillages(vilRes.data.villages || []);
    });
  }, []);

  // Filter members available to add
  const availableMembers = allMembers.filter((m) => {
    // Exclude already added
    if (allocatedRows.some((r) => r.memberId === m._id)) return false;
    if (selectedVillageFilter && m.villageId?._id !== selectedVillageFilter && m.villageId !== selectedVillageFilter) {
      return false;
    }
    if (memberSearchQuery) {
      const q = memberSearchQuery.toLowerCase();
      const matchName = m.fullName.toLowerCase().includes(q);
      const matchId = m.memberId.toLowerCase().includes(q);
      const matchMobile = (m.mobileNumber || '').includes(q);
      return matchName || matchId || matchMobile;
    }
    return true;
  });

  // Add Member to allocation grid
  const handleAddMember = async (member) => {
    // Fetch member's outstanding balance
    let duesInfo = null;
    try {
      const res = await api.get(`/installments/member/${member._id}/dues`);
      duesInfo = res.data.dues || [];
    } catch (e) {
      console.error(e);
    }

    const pendingTotal = duesInfo ? duesInfo.reduce((acc, d) => acc + (d.outstandingRupees || 0), 0) : 0;

    const newRow = {
      memberId: member._id,
      memberObj: member,
      pendingTotal,
      amountRupees: pendingTotal > 0 ? pendingTotal : 1000,
      notes: ''
    };

    setAllocatedRows([...allocatedRows, newRow]);
  };

  // Remove row
  const handleRemoveRow = (memberId) => {
    setAllocatedRows(allocatedRows.filter((r) => r.memberId !== memberId));
  };

  // Change individual allocation amount (Custom Distribution)
  const handleAmountChange = (memberId, val) => {
    setAllocatedRows(
      allocatedRows.map((r) => {
        if (r.memberId === memberId) {
          return { ...r, amountRupees: val };
        }
        return r;
      })
    );
  };

  // EQUAL SPLIT BUTTON
  // Divides totalAmountRupees equally among all selected members
  const handleEqualSplit = () => {
    const count = allocatedRows.length;
    if (count === 0) {
      alert('Please add at least one member first.');
      return;
    }

    const total = parseFloat(totalAmountRupees);
    if (isNaN(total) || total <= 0) {
      alert('Please enter a valid Total Cheque Amount greater than zero.');
      return;
    }

    // Integer paise division to prevent rounding discrepancies
    const totalPaise = Math.round(total * 100);
    const basePaisePerMember = Math.floor(totalPaise / count);
    const remainderPaise = totalPaise % count;

    const newRows = allocatedRows.map((r, idx) => {
      // Add 1 paise remainder to the first remainder members
      const allocatedPaise = basePaisePerMember + (idx < remainderPaise ? 1 : 0);
      return {
        ...r,
        amountRupees: (allocatedPaise / 100).toFixed(2)
      };
    });

    setAllocatedRows(newRows);
  };

  // Real-time calculation totals
  const totalReceived = parseFloat(totalAmountRupees) || 0;
  const sumAllocated = allocatedRows.reduce((acc, r) => acc + (parseFloat(r.amountRupees) || 0), 0);
  const remainingUnallocated = Math.round((totalReceived - sumAllocated) * 100) / 100;
  const isExactMatch = Math.abs(remainingUnallocated) === 0 && allocatedRows.length > 0;

  // Form submission with strict validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (allocatedRows.length === 0) {
      setErrorMsg('Please select at least one member for bulk payment.');
      return;
    }

    if (!isExactMatch) {
      setErrorMsg(
        `Strict Allocation Mismatch: Total Cheque Amount (₹${totalReceived.toFixed(2)}) must exactly equal Sum of Member Allocations (₹${sumAllocated.toFixed(2)}). Difference is ₹${remainingUnallocated.toFixed(2)}.`
      );
      return;
    }

    // Check for negative or zero amounts
    for (let i = 0; i < allocatedRows.length; i++) {
      const val = parseFloat(allocatedRows[i].amountRupees);
      if (isNaN(val) || val <= 0) {
        setErrorMsg(`Row #${i + 1} (${allocatedRows[i].memberObj.fullName}) has invalid or zero amount. Zero/Negative allocations are prohibited.`);
        return;
      }
    }

    if (paymentMode === 'CHEQUE' && (!chequeDetails.chequeNumber || !chequeDetails.bankName)) {
      setErrorMsg('Cheque Number and Bank Name are required for cheque payments.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        payerName,
        payerMobile,
        paymentDate,
        paymentMode,
        totalAmountRupees: totalReceived,
        referenceNumber,
        remarks,
        chequeDetails: paymentMode === 'CHEQUE' ? chequeDetails : undefined,
        allocations: allocatedRows.map((r) => ({
          memberId: r.memberId,
          amountRupees: parseFloat(r.amountRupees),
          notes: r.notes || `Bulk allocation for ${r.memberObj.fullName}`
        }))
      };

      const res = await api.post('/payments/bulk', payload);
      setReceipt(res.data.receipt);
      setIsReceiptModalOpen(true);
      // Reset form
      setAllocatedRows([]);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing bulk payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 mb-1">
            Critical Society Financial Module
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="h-6 w-6 text-indigo-600" />
            Bulk / Group Payment Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Receive one master payment (e.g. ₹5,000 cheque) from a payer on behalf of multiple society members and allocate atomically.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <strong className="font-bold">Validation Error:</strong>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Top Section: Master Payment Voucher Particulars */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between pb-2 border-b border-slate-100">
          <span>1. Master Cheque / Payment Details</span>
          <span className="text-[11px] text-indigo-600 font-semibold">1 Master Transaction → Multiple Relational Allocations</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Payer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="e.g. Kantilal Mohanlal Shah (Family Head)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payer Mobile Number</label>
            <input
              type="tel"
              value={payerMobile}
              onChange={(e) => setPayerMobile(e.target.value)}
              placeholder="10-digit mobile"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Total Cheque / Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              step="any"
              required
              value={totalAmountRupees}
              onChange={(e) => setTotalAmountRupees(e.target.value)}
              placeholder="5000"
              className="w-full px-3 py-2 text-base font-black text-indigo-700 rounded-lg border border-slate-300 font-mono"
            />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {['CHEQUE', 'BANK_TRANSFER', 'UPI', 'CASH'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMode(m)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border text-center transition ${
                    paymentMode === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {paymentMode === 'CHEQUE' ? (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cheque Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={chequeDetails.chequeNumber}
                  onChange={(e) => setChequeDetails({ ...chequeDetails, chequeNumber: e.target.value })}
                  placeholder="e.g. 882233"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-amber-50/50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Name & Branch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={chequeDetails.bankName}
                  onChange={(e) => setChequeDetails({ ...chequeDetails, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank, Mahuva"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-amber-50/50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cheque Date</label>
                <input
                  type="date"
                  value={chequeDetails.chequeDate}
                  onChange={(e) => setChequeDetails({ ...chequeDetails, chequeDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-amber-50/50"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Bank UTR / Transaction Reference</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR-9988771122"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Middle Section: Member Selection Drawer & Live Allocation Math */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member Search & Quick Add */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Search & Add Members
          </h3>

          <div className="space-y-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, Name, Mobile..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <select
              value={selectedVillageFilter}
              onChange={(e) => setSelectedVillageFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Filter by Village (All)</option>
              {villages.map((v) => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {availableMembers.slice(0, 15).map((m) => (
              <div
                key={m._id}
                onClick={() => handleAddMember(m)}
                className="p-2.5 hover:bg-indigo-50/60 cursor-pointer text-xs flex items-center justify-between transition group"
              >
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-indigo-700">{m.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {m.memberId} • {m.villageId?.name || '-'}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-2 py-1 bg-indigo-50 text-indigo-700 font-bold rounded group-hover:bg-indigo-600 group-hover:text-white transition flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
            ))}
            {availableMembers.length === 0 && (
              <p className="p-4 text-center text-xs text-slate-400">No more members to add.</p>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Member Allocation Grid (CRITICAL MATH WORKFLOW) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Member Allocations Grid ({allocatedRows.length} Members Selected)
              </h3>
              <p className="text-[11px] text-slate-400">
                Sum of member allocations must match the Cheque amount down to the rupee.
              </p>
            </div>

            {/* EQUAL SPLIT ACTION BUTTON */}
            <button
              type="button"
              onClick={handleEqualSplit}
              disabled={allocatedRows.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs hover:bg-indigo-100 shadow-2xs disabled:opacity-40 transition"
            >
              <Split className="h-3.5 w-3.5" />
              Equal Split (₹{totalReceived > 0 && allocatedRows.length > 0 ? (totalReceived / allocatedRows.length).toFixed(2) : '0'}/member)
            </button>
          </div>

          {/* Allocation Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Member Details</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3 text-right">Pending Dues</th>
                  <th className="py-2.5 px-3 text-right w-44">Allocated Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      No members added yet. Search and select members from the left panel to begin group allocation.
                    </td>
                  </tr>
                ) : (
                  allocatedRows.map((row, idx) => (
                    <tr key={row.memberId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{row.memberObj.fullName}</p>
                        <p className="font-mono text-[10px] text-slate-500">{row.memberObj.memberId}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{row.memberObj.villageId?.name || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        ₹{row.pendingTotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={1}
                          step="any"
                          required
                          value={row.amountRupees}
                          onChange={(e) => handleAmountChange(row.memberId, e.target.value)}
                          className="w-full px-2.5 py-1 text-right text-xs font-mono font-bold rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.memberId)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          title="Remove member from this allocation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* REAL-TIME ALLOCATION TOTALS BAR */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Total Cheque Amount:</span>
              <p className="font-black text-slate-900 text-sm font-mono">₹{totalReceived.toFixed(2)}</p>
            </div>

            <div>
              <span className="text-slate-500">Total Allocated:</span>
              <p className="font-black text-indigo-700 text-sm font-mono">₹{sumAllocated.toFixed(2)}</p>
            </div>

            <div>
              <span className="text-slate-500">Remaining Unallocated:</span>
              <p className={`font-black text-sm font-mono ${
                remainingUnallocated === 0
                  ? 'text-emerald-700'
                  : 'text-rose-600'
              }`}>
                ₹{remainingUnallocated.toFixed(2)}
              </p>
            </div>

            <div>
              <span className="text-slate-500">Allocation Status:</span>
              <div className="mt-0.5">
                {isExactMatch ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Exact 100% Match
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Difference: ₹{Math.abs(remainingUnallocated).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Posting Submission Action */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              * Atomic database transaction ensures all {allocatedRows.length} member records are saved consistently or safely rolled back.
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !isExactMatch}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 shadow-md transition disabled:opacity-40"
            >
              {submitting ? 'Posting Bulk Transaction...' : 'Post Bulk Payment Voucher & Receipt'}
            </button>
          </div>
        </div>
      </div>

      {/* Master Bulk Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Group / Bulk Payment Receipt"
        subtitle="One Master Cheque Transaction linked to multiple member allocations."
        maxWidth="max-w-2xl"
      >
        <BulkPaymentReceipt
          receipt={receipt}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
