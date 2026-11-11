import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { fetchAllMembers } from '../utils/memberApi';
import { CreditCard, Search, CheckCircle2, AlertCircle, Printer, RefreshCw, CheckSquare, Square, ShieldOff } from 'lucide-react';
import Modal from '../components/common/Modal';
import IfscInput from '../components/common/IfscInput';
import SinglePaymentReceipt from '../components/receipts/SinglePaymentReceipt';
import Badge from '../components/common/Badge';

export default function SinglePayment() {
  const [members, setMembers] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDues, setMemberDues] = useState([]);
  const [duesLoading, setDuesLoading] = useState(false);

  // Installment Selection state & Penalty Waiver state
  const [selectedDueIds, setSelectedDueIds] = useState([]);
  const [waivedDueIds, setWaivedDueIds] = useState([]);

  // Payment Form State
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [amountRupees, setAmountRupees] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerMobile, setPayerMobile] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [chequeDetails, setChequeDetails] = useState({
    chequeNumber: '',
    bankName: '',
    ifscCode: '',
    bankAccountNumber: '',
    chequeDate: new Date().toISOString().split('T')[0]
  });
  const [remarks, setRemarks] = useState('');

  // Receipt Modal
  const [receipt, setReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllMembers().then(setMembers);
  }, []);

  const handleSelectMember = async (member) => {
    setSelectedMember(member);
    setPayerName(member.fullName);
    setPayerMobile(member.mobileNumber || '');
    setSelectedDueIds([]);
    setWaivedDueIds([]);
    setAmountRupees('');
    setDuesLoading(true);
    try {
      const res = await api.get(`/installments/member/${member._id}/dues?openOnly=true`);
      const allDues = res.data.dues || [];
      // Only show OPEN / UNPAID installments for payment collection
      const payableDues = allDues.filter((d) => d.status !== 'PAID' && d.outstandingRupees > 0 && d.isOpen !== false);
      setMemberDues(payableDues);
    } catch (err) {
      console.error(err);
    } finally {
      setDuesLoading(false);
    }
  };

  // Toggle single installment selection
  const handleToggleDue = (dueId) => {
    let updated;
    if (selectedDueIds.includes(dueId)) {
      updated = selectedDueIds.filter((id) => id !== dueId);
    } else {
      updated = [...selectedDueIds, dueId];
    }
    setSelectedDueIds(updated);

    // Sum amount of all selected installments (considering waived penalties)
    const selected = memberDues.filter((d) => updated.includes(d._id));
    const total = selected.reduce((acc, d) => {
      const baseAmt = d.outstandingRupees || 0;
      const isWaived = waivedDueIds.includes(d._id);
      const penaltyAmt = (d.isThreeMonthsOverdue && !isWaived) ? (d.penaltyAmountRupees || 0) : 0;
      return acc + baseAmt + penaltyAmt;
    }, 0);
    setAmountRupees(total > 0 ? total : '');
  };

  // Toggle waiver for an individual due
  const handleToggleWaiveDue = (dueId) => {
    let updated;
    if (waivedDueIds.includes(dueId)) {
      updated = waivedDueIds.filter((id) => id !== dueId);
    } else {
      updated = [...waivedDueIds, dueId];
    }
    setWaivedDueIds(updated);

    const selected = memberDues.filter((d) => selectedDueIds.includes(d._id));
    const total = selected.reduce((acc, d) => {
      const baseAmt = d.outstandingRupees || 0;
      const isWaived = updated.includes(d._id);
      const penaltyAmt = (d.isThreeMonthsOverdue && !isWaived) ? (d.penaltyAmountRupees || 0) : 0;
      return acc + baseAmt + penaltyAmt;
    }, 0);
    setAmountRupees(total > 0 ? total : '');
  };

  // Toggle waive all penalties
  const handleToggleWaiveAll = () => {
    const overdueDueIds = memberDues.filter((d) => d.isThreeMonthsOverdue).map((d) => d._id);
    const allCurrentlyWaived = overdueDueIds.length > 0 && overdueDueIds.every((id) => waivedDueIds.includes(id));

    const updated = allCurrentlyWaived ? [] : overdueDueIds;
    setWaivedDueIds(updated);

    const selected = memberDues.filter((d) => selectedDueIds.includes(d._id));
    const total = selected.reduce((acc, d) => {
      const baseAmt = d.outstandingRupees || 0;
      const isWaived = updated.includes(d._id);
      const penaltyAmt = (d.isThreeMonthsOverdue && !isWaived) ? (d.penaltyAmountRupees || 0) : 0;
      return acc + baseAmt + penaltyAmt;
    }, 0);
    setAmountRupees(total > 0 ? total : '');
  };

  // Select all pending installments
  const handleSelectAllDues = () => {
    const pendingDues = memberDues.filter((d) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(d.status));
    const allIds = pendingDues.map((d) => d._id);
    setSelectedDueIds(allIds);
    const total = pendingDues.reduce((acc, d) => {
      const baseAmt = d.outstandingRupees || 0;
      const isWaived = waivedDueIds.includes(d._id);
      const penaltyAmt = (d.isThreeMonthsOverdue && !isWaived) ? (d.penaltyAmountRupees || 0) : 0;
      return acc + baseAmt + penaltyAmt;
    }, 0);
    setAmountRupees(total > 0 ? total : '');
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedDueIds([]);
    setAmountRupees('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setErrorMsg('Please select a member first.');
      return;
    }
    if (selectedDueIds.length === 0) {
      setErrorMsg('Please select at least one installment to proceed with payment.');
      return;
    }
    if (!amountRupees || Number(amountRupees) <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }
    if (paymentMode === 'CHEQUE' && !chequeDetails.bankAccountNumber.trim()) {
      setErrorMsg('Bank Account Number is required for cheque payments.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
        memberId: selectedMember._id,
        payerName,
        payerMobile,
        paymentDate,
        paymentMode,
        amountRupees: Number(amountRupees),
        selectedDueIds,
        waivedDueIds,
        waivePenalty: waivedDueIds.length > 0 && selectedDueIds.every(id => waivedDueIds.includes(id)),
        referenceNumber,
        remarks: remarks ? remarks.trim() : '',
        chequeDetails: paymentMode === 'CHEQUE' ? chequeDetails : undefined
      };

      const res = await api.post('/payments/single', payload);
      setReceipt(res.data.receipt);
      setIsReceiptModalOpen(true);

      // Refresh member dues
      handleSelectMember(selectedMember);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error collecting payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchMember.trim().toLowerCase();
    if (q.length < 3) return false;
    return m.fullName.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q);
  });

  const selectedDuesList = memberDues.filter((d) => selectedDueIds.includes(d._id));
  const pendingDuesCount = memberDues.filter((d) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(d.status)).length;
  const baseSelectedTotal = selectedDuesList.reduce((acc, d) => acc + (d.outstandingRupees || 0), 0);
  const penaltySelectedTotal = selectedDuesList.reduce((acc, d) => {
    const isWaived = waivedDueIds.includes(d._id);
    return acc + (d.isThreeMonthsOverdue && !isWaived ? (d.penaltyAmountRupees || 0) : 0);
  }, 0);
  const waivedSelectedCount = selectedDuesList.filter((d) => d.isThreeMonthsOverdue && waivedDueIds.includes(d._id)).length;
  const hasPenaltySelected = penaltySelectedTotal > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-600" />
          Single Member Payment Collection
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select Member & Choose Installment(s) to automatically populate payment amount and issue official receipt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Select Member + Installment Selection */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>1. Select Member</span>
            {selectedMember && (
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Active Member
              </span>
            )}
          </h3>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {searchMember.trim().length < 3 ? (
              <p className="p-4 text-center text-xs text-slate-400">Type at least 3 characters to search members.</p>
            ) : filteredMembers.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">No members match your search.</p>
            ) : null}
            {filteredMembers.map((m) => (
              <div
                key={m._id}
                onClick={() => handleSelectMember(m)}
                className={`p-2.5 cursor-pointer text-xs transition flex items-center justify-between ${
                  selectedMember?._id === m._id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="font-bold text-slate-900">{m.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{m.memberId} • {m.villageId?.name || '-'}</p>
                </div>
                <Badge status={m.status} />
              </div>
            ))}
          </div>

          {/* Member's Installments Selection Section */}
          {selectedMember && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-600"></span>
                    2. Select Installment(s) to Pay
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Payment amount calculates from selected installment(s).
                  </p>
                </div>
              </div>

              {duesLoading ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Loading installments...</span>
                </div>
              ) : memberDues.length === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                  ✓ No unpaid installments recorded for this member.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select All / Clear action bar */}
                  {pendingDuesCount > 0 && (
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                      <span>{pendingDuesCount} pending installment(s)</span>
                      <div className="flex items-center gap-2">
                        {memberDues.some(d => d.isThreeMonthsOverdue) && (
                          <>
                            <button
                              type="button"
                              onClick={handleToggleWaiveAll}
                              className={`font-bold hover:underline ${
                                memberDues.filter(d => d.isThreeMonthsOverdue).every(d => waivedDueIds.includes(d._id))
                                  ? 'text-emerald-700'
                                  : 'text-rose-600'
                              }`}
                            >
                              {memberDues.filter(d => d.isThreeMonthsOverdue).every(d => waivedDueIds.includes(d._id))
                                ? '✓ All Penalties Waived'
                                : 'Waive All Penalties (દંડ ના લેવો)'}
                            </button>
                            <span>•</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={handleSelectAllDues}
                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Select All
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="font-bold text-slate-500 hover:text-slate-700 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Installment cards */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {memberDues.map((d) => {
                      const isSelected = selectedDueIds.includes(d._id);
                      const isDuePassed = d.isDuePassed;
                      const isThreeMonths = d.isThreeMonthsOverdue;
                      const isWaived = waivedDueIds.includes(d._id);
                      const badgeStatus = isWaived ? 'PAID' : (isThreeMonths ? 'OVERDUE' : (isDuePassed ? 'DUE' : 'OPEN'));

                      return (
                        <div
                          key={d._id}
                          onClick={() => handleToggleDue(d._id)}
                          className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                              : isThreeMonths
                              ? (isWaived ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300' : 'bg-rose-50/50 border-rose-300 hover:border-rose-400')
                              : isDuePassed
                              ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDue(d._id)}
                              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <p className={`font-bold truncate flex items-center gap-1.5 flex-wrap ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                <span>{d.installmentId?.installmentTitle || 'Installment'}</span>
                                {(d.financialYearId?.yearName || d.installmentId?.financialYearId?.yearName) && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {d.financialYearId?.yearName || d.installmentId?.financialYearId?.yearName}
                                  </span>
                                )}
                              </p>
                              {isThreeMonths ? (
                                <div className="space-y-1">
                                  <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1.5 flex-wrap">
                                    <span>⚠️ Due Date: {new Date(d.dueDate).toLocaleDateString()}</span>
                                    <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                                      &gt; 3 Mo Overdue
                                    </span>
                                  </p>

                                  {/* Director Penalty Waiver Option */}
                                  <div className="flex items-center gap-2 pt-0.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                    <label className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer select-none transition ${
                                      isWaived
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                    }`}>
                                      <input
                                        type="checkbox"
                                        checked={isWaived}
                                        onChange={() => handleToggleWaiveDue(d._id)}
                                        className="h-3.5 w-3.5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                      />
                                      <span>{isWaived ? '✓ દંડ માફ છે (Penalty Waived)' : 'દંડ ના લેવો (Waive Penalty)'}</span>
                                    </label>

                                    {!isWaived ? (
                                      <span className="text-[10px] text-rose-600 font-bold">
                                        +₹{d.penaltyAmountRupees?.toFixed(2)} Penalty
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-emerald-700 font-bold">
                                        Penalty: ₹0.00
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : isDuePassed ? (
                                <p className="text-[11px] text-amber-700 font-semibold">
                                  <span>⚠️ Due Date Passed: {new Date(d.dueDate).toLocaleDateString()}</span>
                                  <span className="text-[10px] text-slate-400 block font-normal">Within 3 months (Grace period - No penalty yet)</span>
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-500">
                                  Due Date: {new Date(d.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-0.5">
                            <p className="font-bold text-slate-900 font-mono text-sm">
                              ₹{(isThreeMonths && !isWaived ? d.totalWithPenaltyRupees : d.outstandingRupees)?.toFixed(2)}
                            </p>
                            {isThreeMonths && (
                              <p className={`text-[10px] font-mono font-medium ${isWaived ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {isWaived ? '(Penalty: ₹0 Waived)' : `(₹${d.outstandingRupees} + ₹${d.penaltyAmountRupees})`}
                              </p>
                            )}
                            <div>
                              <Badge status={badgeStatus} text={isWaived ? 'PENALTY WAIVED' : (isThreeMonths ? '3+ MO OVERDUE' : undefined)} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Payment Particulars & Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Payment Collection Particulars
          </h3>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selected Installments Overview Banner */}
          {selectedMember && (
            <div className={`p-4 rounded-xl border text-xs ${
              selectedDueIds.length > 0
                ? 'bg-indigo-50/70 border-indigo-200'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {selectedDueIds.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      Selected Installment(s) for Payment:
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-black text-indigo-700 text-sm">
                        Total: ₹{Number(amountRupees || 0).toFixed(2)}
                      </span>
                      {hasPenaltySelected && (
                        <p className="text-[10px] text-rose-600 font-mono font-bold">
                          (Base: ₹{baseSelectedTotal.toFixed(2)} + Overdue Penalty: ₹{penaltySelectedTotal.toFixed(2)})
                        </p>
                      )}
                      {waivedSelectedCount > 0 && !hasPenaltySelected && (
                        <p className="text-[10px] text-emerald-700 font-mono font-bold">
                          (Penalty Waived by Director: ₹0.00)
                        </p>
                      )}
                    </div>
                  </div>

                  {hasPenaltySelected && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <strong>Penalty Applicable (&gt; 3 Months Overdue):</strong> A late payment penalty of ₹{penaltySelectedTotal.toFixed(2)} has been automatically calculated and included in the collection total. You can waive it anytime using the "દંડ ના લેવો" checkbox.
                      </div>
                    </div>
                  )}

                  {waivedSelectedCount > 0 && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      <div>
                        <strong>Penalty Waived by Director:</strong> Late payment penalty waived for {waivedSelectedCount} installment(s). Only base amount will be collected.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {selectedDuesList.map((d) => {
                      const isWaived = waivedDueIds.includes(d._id);
                      return (
                        <span
                          key={d._id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border text-[11px] shadow-2xs ${
                            d.isThreeMonthsOverdue
                              ? (isWaived ? 'border-emerald-300 text-emerald-900 bg-emerald-50/30' : 'border-rose-300 text-rose-900')
                              : 'border-indigo-200 text-indigo-900'
                          }`}
                        >
                          <strong>
                            {d.installmentId?.installmentTitle}
                            {(d.financialYearId?.yearName || d.installmentId?.financialYearId?.yearName) && (
                              <span className="ml-1 text-indigo-600 font-bold">
                                ({d.financialYearId?.yearName || d.installmentId?.financialYearId?.yearName})
                              </span>
                            )}
                          </strong>
                          <Badge
                            status={isWaived ? 'PAID' : (d.isThreeMonthsOverdue ? 'OVERDUE' : (d.isDuePassed ? 'DUE' : 'OPEN'))}
                            text={isWaived ? 'PENALTY WAIVED' : (d.isThreeMonthsOverdue ? '3+ MO OVERDUE' : undefined)}
                          />
                          <span className="text-slate-300">|</span>
                          <span className="font-mono font-bold">
                            ₹{(d.isThreeMonthsOverdue && !isWaived ? d.totalWithPenaltyRupees : d.outstandingRupees)?.toFixed(2)}
                          </span>
                          {d.isThreeMonthsOverdue && (
                            <span className={`text-[10px] font-semibold ${isWaived ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {isWaived ? '(Penalty: ₹0 Waived)' : `(incl. ₹${d.penaltyAmountRupees} penalty)`}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>No Installment Selected:</strong> Please check the installment(s) you wish to collect payment for from the left panel. The payment amount will populate automatically.
                  </span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Mode <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-2 text-center rounded-lg font-bold border transition text-xs ${
                        paymentMode === mode
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount to Collect (₹) <span className="text-rose-500">*</span>
                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                    (Auto-calculated from selected installment)
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="Select installment first..."
                  className={`w-full px-3 py-2 text-base font-black rounded-lg border font-mono transition ${
                    selectedDueIds.length > 0
                      ? 'bg-white text-indigo-700 border-indigo-300 ring-2 ring-indigo-100'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payer Name</label>
                <input
                  type="text"
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payer Mobile</label>
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
            </div>

            {/* Cheque Specific Fields */}
            {paymentMode === 'CHEQUE' ? (
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cheque Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={chequeDetails.chequeNumber}
                    onChange={(e) => setChequeDetails({ ...chequeDetails, chequeNumber: e.target.value })}
                    placeholder="e.g. 123456"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <IfscInput
                    value={chequeDetails.ifscCode}
                    onChange={(field, value) => setChequeDetails((current) => ({ ...current, [field]: value }))}
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
                    placeholder="e.g. SBI, Mahuva"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bank Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={chequeDetails.bankAccountNumber}
                    onChange={(e) => setChequeDetails({ ...chequeDetails, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cheque Date</label>
                  <input
                    type="date"
                    value={chequeDetails.chequeDate}
                    onChange={(e) => setChequeDetails({ ...chequeDetails, chequeDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Ref / UTR / Remarks</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UPI Ref / Bank UTR number"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes for society records..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={selectedDueIds.length === 0 || !amountRupees || Number(amountRupees) <= 0 || submitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : selectedDueIds.length === 0 ? (
                <span>⚠️ Please Select Installment(s) to Collect Payment</span>
              ) : (
                <span>
                  Collect ₹{Number(amountRupees || 0).toFixed(2)} & Issue Receipt ({selectedDueIds.length} Installment{selectedDueIds.length > 1 ? 's' : ''})
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Payment Receipt"
        size="lg"
      >
        <SinglePaymentReceipt
          receipt={receipt}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
