import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { fetchAllMembers } from '../utils/memberApi';
import {
  BookOpen,
  Search,
  Printer,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2
} from 'lucide-react';
import Badge from '../components/common/Badge';

export default function MemberLedger() {
  const [members, setMembers] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllMembers().then(setMembers);
  }, []);

  const fetchLedger = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/ledger/member/${id}`);
      setLedgerData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMemberId) {
      fetchLedger(selectedMemberId);
    }
  }, [selectedMemberId]);

  const handlePrint = () => {
    window.print();
  };

  const filteredMembers = members.filter((m) => {
    const q = searchMember.trim().toLowerCase();
    if (q.length < 3) return false;
    return m.fullName.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Member Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete member financial statement: installment dues, payments, bulk allocations, penalties, waivers, and verified running balance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={!ledgerData}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print Ledger Statement
          </button>
        </div>
      </div>

      {/* Member Selector Bar (Hidden in Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 items-center justify-between no-print">
        <div className="w-full sm:w-96">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Select Member for Ledger Inspection
          </label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="search"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Type at least 3 characters to search members..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          {searchMember.trim().length >= 3 && (
            <div className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {filteredMembers.length === 0 ? (
                <p className="p-3 text-center text-xs text-slate-400">No members match your search.</p>
              ) : filteredMembers.map((member) => (
                <button
                  type="button"
                  key={member._id}
                  onClick={() => {
                    setSelectedMemberId(member._id);
                    setSearchMember('');
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 ${
                    selectedMemberId === member._id ? 'bg-indigo-50 font-bold' : ''
                  }`}
                >
                  {member.memberId} — {member.fullName} ({member.villageId?.name || 'Village'})
                </button>
              ))}
            </div>
          )}
          {ledgerData?.member && (
            <p className="mt-2 text-xs font-semibold text-indigo-700">
              Selected: {ledgerData.member.memberId} — {ledgerData.member.fullName}
            </p>
          )}
        </div>

        {ledgerData?.member && (
          <div className="flex items-center gap-4 text-xs bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-500">Member Status:</span>
              <div className="mt-0.5"><Badge status={ledgerData.member.status} /></div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500">Native Village:</span>
              <p className="font-bold text-slate-800">{ledgerData.member.village || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Printable Statement Area */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading member financial records...</div>
      ) : ledgerData && (
        <div id="printable-ledger" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs print:border-none print:shadow-none print:p-0">
          {/* Statement Header */}
          <div className="text-center pb-4 border-b-2 border-indigo-900">
            <p className="text-[11px] uppercase font-bold tracking-widest text-indigo-700">Official Member Account Statement</p>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              SHREE DASHASHREMALI 42 GNATI SURAKSHA SAMITI
            </h2>
            <p className="text-xs text-slate-500">Statement of Member Financial Ledger & Realized Dues</p>
          </div>

          {/* Member & Balance Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Member Account:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{ledgerData.member?.fullName}</p>
              <p className="font-mono text-slate-500">ID: {ledgerData.member?.memberId}</p>
            </div>

            <div>
              <span className="text-slate-500">Total Invoiced (Debits):</span>
              <p className="font-black text-slate-900 text-base mt-0.5">{ledgerData.summary?.formattedTotalDebit}</p>
              <p className="text-[10px] text-slate-400">Installments & Penalties</p>
            </div>

            <div>
              <span className="text-slate-500">Total Credited (Paid/Waived):</span>
              <p className="font-black text-emerald-700 text-base mt-0.5">{ledgerData.summary?.formattedTotalCredit}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Realized Collections</p>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
              <span className="text-indigo-800 font-bold">Outstanding Balance:</span>
              <p className="font-black text-indigo-900 text-lg mt-0.5">{ledgerData.summary?.formattedOutstandingBalance}</p>
              <p className="text-[10px] text-indigo-700">Calculated running balance</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Verified Transaction Ledger
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Entry Type</th>
                    <th className="py-2.5 px-3">Ref ID</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (+)</th>
                    <th className="py-2.5 px-3 text-right">Credit (-)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {ledgerData.entries?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-400">No ledger entries posted for this member yet.</td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((e) => (
                      <tr key={e._id} className="hover:bg-slate-50 font-medium">
                        <td className="py-2.5 px-3 font-sans text-slate-700">
                          {new Date(e.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-bold text-slate-800">{e.entryType.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{e.referenceId || '-'}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-800">{e.description}</td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-bold">
                          {e.formattedDebit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                          {e.formattedCredit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          {e.formattedBalance}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Realization Audit Trail */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Payment Transactions & Cheque Realization Trail
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Allocation ID</th>
                    <th className="py-2 px-3">Master Txn ID</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Mode</th>
                    <th className="py-2 px-3">Cheque Particulars</th>
                    <th className="py-2 px-3 text-right">Allocated (₹)</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerData.paymentHistory?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-4 text-center text-slate-400">No payment records found.</td>
                    </tr>
                  ) : (
                    ledgerData.paymentHistory.map((p) => (
                      <tr key={p.allocationId}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.allocationId}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{p.transactionId}</td>
                        <td className="py-2 px-3">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 px-3 uppercase font-semibold text-slate-700">{p.paymentMode}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">
                          {p.chequeNumber ? `#${p.chequeNumber} (${p.bankName})` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold font-mono text-indigo-700">{p.formattedAmount}</td>
                        <td className="py-2 px-3"><Badge status={p.paymentStatus} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="pt-8 flex justify-between items-end text-xs">
            <div>
              <p className="text-[10px] text-slate-400">Official Computerized Statement.</p>
              <p className="text-[10px] text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <div className="h-10 border-b border-slate-400 w-44 mb-1" />
              <p className="font-bold text-slate-800">Director / Auditor Signature</p>
              <p className="text-[10px] text-slate-500">Shree Dashashremali Suraksha Samiti</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
