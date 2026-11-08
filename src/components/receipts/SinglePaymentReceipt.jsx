import React from 'react';
import { Printer, CheckCircle, Clock } from 'lucide-react';

export default function SinglePaymentReceipt({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Area */}
      <div id="printable-receipt" className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="text-center pb-4 border-b-2 border-indigo-900">
          <p className="text-xs uppercase font-bold tracking-widest text-indigo-700">Official Payment Receipt</p>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            SHREE DASHASHREMALI 42 GNATI SURAKSHA SAMITI
          </h2>
          <p className="text-xs text-slate-500">Central Office: Mahuva / Bhavnagar, Gujarat</p>
        </div>

        {/* Receipt Meta */}
        <div className="grid grid-cols-2 gap-4 my-4 py-2 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-500">Receipt / Transaction ID:</span>
            <p className="font-bold text-slate-900 text-sm">{receipt.transactionId}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Payment Date:</span>
            <p className="font-bold text-slate-900">{new Date(receipt.paymentDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Member Details */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Member ID:</span>
            <span className="font-bold text-slate-900">{receipt.member?.memberId || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Member Name:</span>
            <span className="font-bold text-slate-900">{receipt.member?.fullName || receipt.payerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Village:</span>
            <span className="font-semibold text-slate-800">{receipt.member?.village || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payer Name:</span>
            <span className="font-semibold text-slate-800">{receipt.payerName}</span>
          </div>
        </div>

        {/* Payment Particulars */}
        <div className="space-y-3 py-3 border-b border-slate-200 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600">Payment Mode:</span>
            <span className="font-bold uppercase px-2 py-0.5 rounded-sm bg-slate-200 text-slate-800">{receipt.paymentMode}</span>
          </div>
          {receipt.chequeDetails?.chequeNumber && (
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Cheque No & Bank:</span>
              <span className="font-medium text-slate-900">
                #{receipt.chequeDetails.chequeNumber} ({receipt.chequeDetails.bankName})
              </span>
            </div>
          )}
          {receipt.referenceNumber && (
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Ref / UTR Number:</span>
              <span className="font-medium text-slate-900">{receipt.referenceNumber}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-sm">
            <span className="font-bold text-slate-800">Total Received Amount:</span>
            <span className="text-lg font-black text-indigo-700">{receipt.totalAmountINR}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Payment Status:</span>
            <span className={`font-bold inline-flex items-center gap-1 ${
              receipt.paymentStatus === 'CLEARED' ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {receipt.paymentStatus === 'CLEARED' ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  CONFIRMED & CLEARED
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  {receipt.paymentStatus} (Awaiting Clearance)
                </>
              )}
            </span>
          </div>
        </div>

        {/* Signature Box */}
        <div className="mt-8 pt-6 flex justify-between items-end text-xs">
          <div>
            <p className="text-[10px] text-slate-400">Computer generated receipt.</p>
            <p className="text-[10px] text-slate-400">Valid subject to realization of cheque.</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-slate-400 w-40 mb-1" />
            <p className="font-bold text-slate-800">Authorized Signatory</p>
            <p className="text-[10px] text-slate-500">For Shree Dashashremali Suraksha Samiti</p>
          </div>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="flex justify-end gap-3 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 shadow-sm"
        >
          <Printer className="h-4 w-4" />
          Print Receipt
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
