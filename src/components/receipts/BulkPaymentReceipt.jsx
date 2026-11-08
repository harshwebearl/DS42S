import React from 'react';
import { Printer, CheckCircle, Clock } from 'lucide-react';

export default function BulkPaymentReceipt({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const allocations = receipt.allocations || [];

  return (
    <div className="space-y-6">
      {/* Printable Master Receipt */}
      <div id="printable-bulk-receipt" className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="text-center pb-4 border-b-2 border-indigo-900">
          <p className="text-xs uppercase font-bold tracking-widest text-indigo-700">Official Group / Bulk Payment Receipt</p>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            SHREE DASHASHREMALI 42 GNATI SURAKSHA SAMITI
          </h2>
          <p className="text-xs text-slate-500">Central Office: Mahuva / Bhavnagar, Gujarat</p>
        </div>

        {/* Master Transaction Information */}
        <div className="grid grid-cols-2 gap-4 my-4 py-2 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-500">Master Bulk Transaction ID:</span>
            <p className="font-bold text-slate-900 text-sm">{receipt.transactionId}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Transaction Date:</span>
            <p className="font-bold text-slate-900">{new Date(receipt.paymentDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Payer Particulars */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-3 mb-4">
          <div>
            <span className="text-slate-500">Payer Name:</span>
            <p className="font-bold text-slate-900">{receipt.payerName}</p>
          </div>
          <div>
            <span className="text-slate-500">Payer Mobile:</span>
            <p className="font-semibold text-slate-800">{receipt.payerMobile || '-'}</p>
          </div>
          <div>
            <span className="text-slate-500">Payment Mode:</span>
            <p className="font-bold text-slate-900 uppercase">{receipt.paymentMode}</p>
          </div>
          <div>
            <span className="text-slate-500">Total Received Cheque Amount:</span>
            <p className="font-black text-indigo-700 text-sm">{receipt.formattedTotalAmount || `₹${receipt.totalAmountRupees}`}</p>
          </div>
          {receipt.chequeDetails?.chequeNumber && (
            <div className="col-span-2 pt-1 border-t border-slate-200">
              <span className="text-slate-500">Cheque Particulars:</span>
              <p className="font-medium text-slate-900">
                Cheque #{receipt.chequeDetails.chequeNumber} — {receipt.chequeDetails.bankName} (Dated: {receipt.chequeDetails.chequeDate ? new Date(receipt.chequeDetails.chequeDate).toLocaleDateString() : '-'})
              </p>
            </div>
          )}
        </div>

        {/* Member Allocations Table */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Member-Wise Payment Distribution ({allocations.length} Members)
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Allocation ID</th>
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3 text-right">Allocated Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((alloc, idx) => (
                  <tr key={alloc.allocationId || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-700">{alloc.allocationId}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{alloc.member?.memberId || alloc.memberId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{alloc.member?.fullName || alloc.fullName}</td>
                    <td className="py-2 px-3 text-slate-600">{alloc.member?.village || alloc.village || '-'}</td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-700">
                      {alloc.formattedAmount || `₹${alloc.allocatedAmountRupees || alloc.amountRupees}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-xs">
                <tr>
                  <td colSpan="5" className="py-2.5 px-3 text-right text-slate-700">
                    Grand Total Distributed:
                  </td>
                  <td className="py-2.5 px-3 text-right text-indigo-900 font-black text-sm">
                    {receipt.formattedTotalAmount || `₹${receipt.totalAmountRupees}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Clearance Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-600 font-medium">Payment Clearance Status:</span>
          <span className={`font-bold inline-flex items-center gap-1.5 ${
            receipt.paymentStatus === 'CLEARED' ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {receipt.paymentStatus === 'CLEARED' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                CLEARED — All Member Accounts Credited
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                {receipt.paymentStatus} — Subject to Realization of Cheque
              </>
            )}
          </span>
        </div>

        {/* Signature Box */}
        <div className="mt-8 pt-6 flex justify-between items-end text-xs">
          <div>
            <p className="text-[10px] text-slate-400">Master Bulk Payment Distribution Voucher.</p>
            <p className="text-[10px] text-slate-400">Maintained under Shree Dashashremali Gnati Suraksha Samiti rules.</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-slate-400 w-44 mb-1" />
            <p className="font-bold text-slate-800">Director / Authorized Signatory</p>
            <p className="text-[10px] text-slate-500">Shree Dashashremali Suraksha Samiti</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 shadow-sm"
        >
          <Printer className="h-4 w-4" />
          Print Master Receipt
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
