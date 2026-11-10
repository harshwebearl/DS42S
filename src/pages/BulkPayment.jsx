import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { fetchAllMembers } from '../utils/memberApi';
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
  ArrowRight,
  Layers,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import Modal from '../components/common/Modal';
import BulkPaymentReceipt from '../components/receipts/BulkPaymentReceipt';
import Badge from '../components/common/Badge';

export default function BulkPayment() {
  const [allMembers, setAllMembers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [activeInstallments, setActiveInstallments] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('');

  // Master Payment Transaction Fields
  const [payerName, setPayerName] = useState('');
  const [payerMobile, setPayerMobile] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CHEQUE');
  const [totalAmountRupees, setTotalAmountRupees] = useState('');
  const [chequeDetails, setChequeDetails] = useState({
    chequeNumber: '',
    bankName: '',
    bankAccountNumber: '',
    chequeDate: new Date().toISOString().split('T')[0]
  });
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // Selected Members Allocations Grid
  // Array of { memberId, memberObj, dues, selectedDueId, amountRupees, notes }
  const [allocatedRows, setAllocatedRows] = useState([]);
  const [bulkInstallmentToApply, setBulkInstallmentToApply] = useState('');

  // Modals & Feedback
  const [receipt, setReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAllMembers(),
      api.get('/villages'),
      api.get('/installments')
    ]).then(([memRes, vilRes, instRes]) => {
      setAllMembers(memRes);
      setVillages(vilRes.data.villages || []);
      setActiveInstallments(instRes.data.installments || []);
    });
  }, []);

  // Filter members available to add
  const availableMembers = allMembers.filter((m) => {
    if (allocatedRows.some((r) => r.memberId === m._id)) return false;
    if (selectedVillageFilter && m.villageId?._id !== selectedVillageFilter && m.villageId !== selectedVillageFilter) {
      return false;
    }
    if (memberSearchQuery) {
      const q = memberSearchQuery.trim().toLowerCase();
      const matchName = m.fullName.toLowerCase().includes(q);
      const matchId = m.memberId.toLowerCase().includes(q);
      const matchMobile = (m.mobileNumber || '').includes(q);
      return matchName || matchId || matchMobile;
    }
    return true;
  });
  const canSearchMembers = memberSearchQuery.trim().length >= 3;

  // Add Member to allocation grid with installment selection
  const handleAddMember = async (member) => {
    let duesInfo = [];
    try {
      const res = await api.get(`/installments/member/${member._id}/dues`);
      duesInfo = (res.data.dues || []).filter((d) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(d.status));
    } catch (e) {
      console.error(e);
    }

    const firstDue = duesInfo.length > 0 ? duesInfo[0] : null;
    const initialAmount = firstDue
      ? (firstDue.isThreeMonthsOverdue ? firstDue.totalWithPenaltyRupees : firstDue.outstandingRupees)
      : (duesInfo.length === 0 ? 0 : 1000);
    const pendingTotal = duesInfo.reduce((acc, d) => acc + (d.outstandingRupees || 0), 0);

    const newRow = {
      memberId: member._id,
      memberObj: member,
      dues: duesInfo,
      selectedDueId: firstDue ? firstDue._id : '',
      pendingTotal,
      waivePenalty: false,
      amountRupees: initialAmount > 0 ? initialAmount : '',
      notes: ''
    };

    setAllocatedRows([...allocatedRows, newRow]);
  };

  // Change installment selection for an individual row
  const handleRowDueChange = (memberId, dueId) => {
    setAllocatedRows(
      allocatedRows.map((r) => {
        if (r.memberId === memberId) {
          const matchedDue = r.dues.find((d) => d._id === dueId);
          let newAmt = r.amountRupees;
          if (matchedDue) {
            if (matchedDue.isThreeMonthsOverdue) {
              newAmt = r.waivePenalty ? matchedDue.outstandingRupees : matchedDue.totalWithPenaltyRupees;
            } else {
              newAmt = matchedDue.outstandingRupees;
            }
          }
          return {
            ...r,
            selectedDueId: dueId,
            amountRupees: newAmt
          };
        }
        return r;
      })
    );
  };

  // Toggle waive penalty for a specific member row
  const handleToggleRowPenaltyWaive = (memberId) => {
    setAllocatedRows(
      allocatedRows.map((r) => {
        if (r.memberId === memberId) {
          const nextWaive = !r.waivePenalty;
          const matchedDue = r.dues.find((d) => d._id === r.selectedDueId);
          let newAmt = r.amountRupees;
          if (matchedDue && matchedDue.isThreeMonthsOverdue) {
            newAmt = nextWaive ? matchedDue.outstandingRupees : matchedDue.totalWithPenaltyRupees;
          }
          return {
            ...r,
            waivePenalty: nextWaive,
            amountRupees: newAmt
          };
        }
        return r;
      })
    );
  };

  // Toggle waive penalty for all rows with overdue penalties
  const handleToggleWaiveAllPenalties = () => {
    const anyOverdueNotWaived = allocatedRows.some((r) => {
      const due = r.dues.find((d) => d._id === r.selectedDueId);
      return due && due.isThreeMonthsOverdue && !r.waivePenalty;
    });

    const targetWaive = anyOverdueNotWaived;

    setAllocatedRows(
      allocatedRows.map((r) => {
        const matchedDue = r.dues.find((d) => d._id === r.selectedDueId);
        if (matchedDue && matchedDue.isThreeMonthsOverdue) {
          return {
            ...r,
            waivePenalty: targetWaive,
            amountRupees: targetWaive ? matchedDue.outstandingRupees : matchedDue.totalWithPenaltyRupees
          };
        }
        return r;
      })
    );
  };

  // Apply a specific installment to all added members in one click
  const handleApplyInstallmentToAll = () => {
    if (!bulkInstallmentToApply) {
      alert('Please choose an installment from the dropdown first.');
      return;
    }

    const updated = allocatedRows.map((r) => {
      // Find if this member has a pending due for this installment
      const matchingDue = r.dues.find(
        (d) => d.installmentId?._id === bulkInstallmentToApply || d.installmentId === bulkInstallmentToApply
      );

      if (matchingDue) {
        let newAmt = matchingDue.outstandingRupees;
        if (matchingDue.isThreeMonthsOverdue) {
          newAmt = r.waivePenalty ? matchingDue.outstandingRupees : matchingDue.totalWithPenaltyRupees;
        }

        return {
          ...r,
          selectedDueId: matchingDue._id,
          amountRupees: newAmt
        };
      }
      return r;
    });

    setAllocatedRows(updated);
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
  const totalPenaltiesIncluded = allocatedRows.reduce((acc, r) => {
    if (r.waivePenalty) return acc;
    const due = r.dues.find((d) => d._id === r.selectedDueId);
    return acc + (due && due.isThreeMonthsOverdue ? (due.penaltyAmountRupees || 0) : 0);
  }, 0);
  const totalPenaltiesWaived = allocatedRows.reduce((acc, r) => {
    if (!r.waivePenalty) return acc;
    const due = r.dues.find((d) => d._id === r.selectedDueId);
    return acc + (due && due.isThreeMonthsOverdue ? (due.penaltyAmountRupees || 0) : 0);
  }, 0);
  const hasAnyOverdueRows = allocatedRows.some((r) => {
    const due = r.dues.find((d) => d._id === r.selectedDueId);
    return due && due.isThreeMonthsOverdue;
  });
  const allOverdueWaived = hasAnyOverdueRows && allocatedRows
    .filter((r) => {
      const due = r.dues.find((d) => d._id === r.selectedDueId);
      return due && due.isThreeMonthsOverdue;
    })
    .every((r) => r.waivePenalty);

  const totalBaseInstallmentAmount = sumAllocated - totalPenaltiesIncluded;
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

    const normalizedChequeDetails = paymentMode === 'CHEQUE'
      ? {
          ...chequeDetails,
          chequeNumber: chequeDetails.chequeNumber.trim(),
          bankName: chequeDetails.bankName.trim(),
          bankAccountNumber: chequeDetails.bankAccountNumber.trim()
        }
      : undefined;

    if (paymentMode === 'CHEQUE' && (!normalizedChequeDetails.chequeNumber || !normalizedChequeDetails.bankName || !normalizedChequeDetails.bankAccountNumber)) {
      setErrorMsg('Cheque Number, Bank Name, and Bank Account Number are required for cheque payments.');
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
        chequeDetails: normalizedChequeDetails,
        allocations: allocatedRows.map((r) => ({
          memberId: r.memberId,
          amountRupees: parseFloat(r.amountRupees),
          selectedDueIds: r.selectedDueId ? [r.selectedDueId] : [],
          waivePenalty: Boolean(r.waivePenalty),
          waivedDueIds: r.waivePenalty && r.selectedDueId ? [r.selectedDueId] : [],
          notes: r.notes || `Bulk allocation for ${r.memberObj.fullName}`
        }))
      };

      const res = await api.post('/payments/bulk', payload);
      setReceipt(res.data.receipt);
      setIsReceiptModalOpen(true);
      // Reset form
      setAllocatedRows([]);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error executing bulk allocation transaction.');
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
              placeholder="Enter total amount"
              className="w-full px-3 py-2 text-base font-black text-indigo-700 rounded-lg border border-slate-300 font-mono"
            />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-4 pt-1 text-xs">
          <div className="max-w-xs">
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
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-amber-200 bg-amber-50/40 p-3 sm:grid-cols-2 lg:grid-cols-4">
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
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="bulk-cheque-bank-account-number"
                  name="bankAccountNumber"
                  autoComplete="off"
                  value={chequeDetails.bankAccountNumber}
                  onChange={(e) => setChequeDetails({ ...chequeDetails, bankAccountNumber: e.target.value })}
                  placeholder="Enter bank account number"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-amber-50/50 font-mono"
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
            </div>
          ) : (
            <div className="max-w-xl">
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
            {!canSearchMembers ? (
              <p className="p-4 text-center text-xs text-slate-400">Type at least 3 characters to search members.</p>
            ) : availableMembers.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">No more members match your search.</p>
            ) : null}
            {canSearchMembers && availableMembers.map((m) => (
              <div
                key={m._id}
                onClick={() => handleAddMember(m)}
                className="p-2.5 hover:bg-indigo-50/60 cursor-pointer text-xs flex items-center justify-between transition group"
              >
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {m.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {m.memberId} • {m.villageId?.name || '-'}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-2 py-1 text-[11px] font-bold rounded bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Member Allocation Grid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Member Allocations Grid ({allocatedRows.length} Members Selected)
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose installment per member or set all to the same installment.
              </p>
            </div>

            {/* QUICK ACTIONS: EQUAL SPLIT & BULK INSTALLMENT APPLIER */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Apply Installment to All Selector */}
              {activeInstallments.length > 0 && allocatedRows.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <select
                    value={bulkInstallmentToApply}
                    onChange={(e) => setBulkInstallmentToApply(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Choose Installment...</option>
                    {activeInstallments.map((inst) => {
                      const yr = inst.financialYearId?.yearName;
                      return (
                        <option key={inst._id} value={inst._id}>
                          {inst.installmentTitle} {yr ? `(${yr})` : ''} (₹{inst.amountRupees || inst.installmentAmountRupees})
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyInstallmentToAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs hover:bg-slate-200"
                  >
                    Set All
                  </button>
                </div>
              )}

              {/* WAIVE / RESTORE ALL PENALTIES BUTTON */}
              {hasAnyOverdueRows && (
                <button
                  type="button"
                  onClick={handleToggleWaiveAllPenalties}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold text-xs shadow-2xs transition ${
                    allOverdueWaived
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title={allOverdueWaived ? 'Restore Overdue Penalties' : 'Waive all overdue penalties for selected members'}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {allOverdueWaived ? 'દંડ પાછો ઉમેરો (Restore Penalties)' : 'બધાનો દંડ માફ કરો (Waive All Penalties)'}
                </button>
              )}

              {/* EQUAL SPLIT ACTION BUTTON */}
              <button
                type="button"
                onClick={handleEqualSplit}
                disabled={allocatedRows.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs hover:bg-indigo-100 shadow-2xs disabled:opacity-40 transition"
              >
                <Split className="h-3.5 w-3.5" />
                Equal Split
              </button>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Member Details</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3 w-48">Installment Selection</th>
                  <th className="py-2.5 px-3 text-right w-36">Amount (₹)</th>
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
                      
                      {/* Installment Selection Dropdown for each member */}
                      <td className="py-2.5 px-3">
                        {row.dues.length === 0 ? (
                          <span className="text-slate-400 text-[11px] italic">No pending installments</span>
                        ) : (
                          <div className="space-y-1">
                            <select
                              value={row.selectedDueId}
                              onChange={(e) => handleRowDueChange(row.memberId, e.target.value)}
                              className={`w-full px-2 py-1 text-xs rounded border font-medium focus:ring-1 focus:ring-indigo-500 ${
                                row.dues.find(d => d._id === row.selectedDueId)?.isThreeMonthsOverdue
                                  ? 'border-rose-300 bg-rose-50/70 text-rose-900 font-bold'
                                  : 'border-indigo-200 bg-indigo-50/40 text-slate-800'
                              }`}
                            >
                              {row.dues.map((d) => {
                                const yr = d.financialYearId?.yearName || d.installmentId?.financialYearId?.yearName;
                                return (
                                  <option key={d._id} value={d._id}>
                                    {d.installmentId?.installmentTitle || 'Installment'} {yr ? `(${yr})` : ''} — ₹{d.outstandingRupees} {d.isThreeMonthsOverdue ? `(+₹${d.penaltyAmountRupees} Overdue Penalty)` : ''}
                                  </option>
                                );
                              })}
                            </select>

                            {/* Show Due Date & Overdue 3 Months status with Waive Penalty option */}
                            {(() => {
                              const selectedDue = row.dues.find((d) => d._id === row.selectedDueId);
                              if (!selectedDue) return null;
                              if (selectedDue.isThreeMonthsOverdue) {
                                return (
                                  <div className="space-y-1 mt-1">
                                    <div className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                                      <span>Due: {new Date(selectedDue.dueDate).toLocaleDateString()} (&gt;3 Mo Overdue +₹{selectedDue.penaltyAmountRupees})</span>
                                    </div>
                                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1">
                                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(row.waivePenalty)}
                                          onChange={() => handleToggleRowPenaltyWaive(row.memberId)}
                                          className="h-3.5 w-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                                        />
                                        <span className={`text-[11px] font-bold ${row.waivePenalty ? 'text-amber-800' : 'text-slate-600'}`}>
                                          દંડ ના લેવો (Waive)
                                        </span>
                                      </label>
                                      {row.waivePenalty ? (
                                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded">
                                          ₹0 (Maaf)
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded">
                                          +₹{selectedDue.penaltyAmountRupees}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              } else if (selectedDue.isDuePassed) {
                                return (
                                  <div className="text-[10px] text-amber-700 font-medium">
                                    Due Date passed: {new Date(selectedDue.dueDate).toLocaleDateString()} (Grace period)
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-[10px] text-slate-400">
                                    Due Date: {new Date(selectedDue.dueDate).toLocaleDateString()}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
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

          {/* Overdue Penalty Banner if applicable */}
          {totalPenaltiesIncluded > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <span className="font-bold">Overdue Penalties Included (&gt; 3 Months Past Due):</span>{' '}
                  ₹{totalPenaltiesIncluded.toFixed(2)} penalty is automatically applied for installments exceeding 3 months.
                  <span className="block text-[11px] text-rose-700 font-mono mt-0.5">
                    (Base Installments: ₹{totalBaseInstallmentAmount.toFixed(2)} + Penalties: ₹{totalPenaltiesIncluded.toFixed(2)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTotalAmountRupees(sumAllocated.toString())}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shrink-0 shadow-2xs transition"
              >
                Sync Cheque Total (₹{sumAllocated.toFixed(2)})
              </button>
            </div>
          )}

          {totalPenaltiesWaived > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <span className="font-bold">Penalties Waived (દંડ માફ કર્યો):</span>{' '}
                  ₹{totalPenaltiesWaived.toFixed(2)} overdue penalty waived by director decision. Members will only be charged base installment amounts.
                </div>
              </div>
              {!isExactMatch && (
                <button
                  type="button"
                  onClick={() => setTotalAmountRupees(sumAllocated.toString())}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shrink-0 shadow-2xs transition"
                >
                  Sync Cheque Total (₹{sumAllocated.toFixed(2)})
                </button>
              )}
            </div>
          )}

          {/* REAL-TIME ALLOCATION TOTALS BAR */}
          <div className="p-4 bg-slate-900 text-white rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans font-bold">Total Cheque</p>
              <p className="text-base font-bold text-white mt-0.5">₹{totalReceived.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans font-bold">Total Allocated</p>
              <p className="text-base font-bold text-indigo-400 mt-0.5">₹{sumAllocated.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans font-bold">Remaining Diff</p>
              <p className={`text-base font-bold mt-0.5 ${remainingUnallocated === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{remainingUnallocated.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans font-bold">Validation Status</p>
              <div className="mt-1 flex items-center justify-between">
                {allocatedRows.length === 0 ? (
                  <span className="text-slate-400 text-[11px] font-sans">Awaiting Members</span>
                ) : isExactMatch ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-sans text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Balanced 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold font-sans text-xs">
                    <AlertCircle className="h-3.5 w-3.5" /> Mismatch
                  </span>
                )}
                {!isExactMatch && allocatedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTotalAmountRupees(sumAllocated.toString())}
                    className="ml-2 px-2 py-0.5 rounded bg-indigo-600 text-white font-sans text-[10px] font-bold hover:bg-indigo-500"
                    title="Auto-match cheque amount to allocated sum"
                  >
                    Auto Match
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Remarks and Post Transaction Button */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Transaction Remarks / Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Received from Kantilal Shah for 5 family members annual contribution"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isExactMatch || submitting}
              className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 shadow-xs"
            >
              {submitting ? (
                <>
                  <CreditCard className="h-4 w-4 animate-spin" />
                  <span>Processing Multi-Allocation Transaction...</span>
                </>
              ) : isExactMatch ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Post Master Payment & Allocate ₹{totalReceived.toFixed(2)} to {allocatedRows.length} Members</span>
                </>
              ) : (
                <span>⚠️ Balance Must Equal Cheque Amount (Diff: ₹{remainingUnallocated.toFixed(2)})</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Bulk Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Group Payment Receipt"
        size="2xl"
      >
        <BulkPaymentReceipt
          receipt={receipt}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
