import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { CreditCard, Search, CheckCircle2, AlertCircle, Printer, RefreshCw } from 'lucide-react';
import Modal from '../components/common/Modal';
import SinglePaymentReceipt from '../components/receipts/SinglePaymentReceipt';
import Badge from '../components/common/Badge';

export default function SinglePayment() {
  const [members, setMembers] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDues, setMemberDues] = useState([]);
  const [duesLoading, setDuesLoading] = useState(false);

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
    chequeDate: new Date().toISOString().split('T')[0]
  });
  const [remarks, setRemarks] = useState('');

  // Receipt Modal
  const [receipt, setReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/members?limit=100').then((res) => {
      setMembers(res.data.members || []);
    });
  }, []);

  const handleSelectMember = async (member) => {
    setSelectedMember(member);
    setPayerName(member.fullName);
    setPayerMobile(member.mobileNumber || '');
    setDuesLoading(true);
    try {
      const res = await api.get(`/installments/member/${member._id}/dues`);
      const dues = res.data.dues || [];
      setMemberDues(dues);

      // Default amount to outstanding balance of pending dues
      const pendingTotal = dues.reduce((acc, d) => acc + (d.outstandingRupees || 0), 0);
      if (pendingTotal > 0) {
        setAmountRupees(pendingTotal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDuesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setErrorMsg('Please select a member first.');
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
        referenceNumber,
        remarks,
        chequeDetails: paymentMode === 'CHEQUE' ? chequeDetails : undefined
      };

      const res = await api.post('/payments/single', payload);
      setReceipt(res.data.receipt);
      setIsReceiptModalOpen(true);

      // Refresh dues
      handleSelectMember(selectedMember);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error collecting payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchMember.toLowerCase();
    return m.fullName.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-600" />
          Single Member Payment Collection
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Receive individual payments (Cash, UPI, Bank Transfer, Cheque) and auto-allocate against dues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Select Member */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Select Member
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

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {filteredMembers.slice(0, 10).map((m) => (
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

          {/* Member's outstanding dues review */}
          {selectedMember && (
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Current Outstanding Dues:</h4>
              {duesLoading ? (
                <p className="text-slate-400">Loading dues...</p>
              ) : memberDues.length === 0 ? (
                <p className="text-emerald-600 font-semibold">No unpaid dues recorded for this member.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {memberDues.map((d) => (
                    <div key={d._id} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{d.installmentId?.installmentTitle}</p>
                        <p className="text-[10px] text-slate-400">Due: {new Date(d.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-rose-600 font-mono">₹{d.outstandingRupees}</p>
                        <Badge status={d.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Payment Entry Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Payment Collection Particulars
          </h3>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
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
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-base font-black text-indigo-700 rounded-lg border border-slate-300 font-mono"
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
            {paymentMode === 'CHEQUE' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  Cheque Details (Cheque will be marked RECEIVED and await clearance)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={chequeDetails.bankName}
                      onChange={(e) => setChequeDetails({ ...chequeDetails, bankName: e.target.value })}
                      placeholder="e.g. SBI, HDFC, Bank of Baroda"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cheque Date</label>
                    <input
                      type="date"
                      value={chequeDetails.chequeDate}
                      onChange={(e) => setChequeDetails({ ...chequeDetails, chequeDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI or Bank Transfer Reference */}
            {['UPI', 'BANK_TRANSFER'].includes(paymentMode) && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Transaction UTR / Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UPI-99887766 or NEFT UTR"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {paymentMode === 'CHEQUE'
                  ? 'Cheque payments require later clearance to credit the ledger.'
                  : 'Immediate payment: Ledger and dues will be credited upon submission.'}
              </span>

              <button
                type="submit"
                disabled={submitting || !selectedMember}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Posting Payment...' : 'Collect Payment & Generate Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Payment Receipt"
        subtitle="Receipt generated successfully."
        maxWidth="max-w-xl"
      >
        <SinglePaymentReceipt
          receipt={receipt}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
