import React from 'react';
import { Printer, CheckCircle, Clock, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function BulkPaymentReceipt({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const allocations = receipt.allocations || [];
  const downloadAllocationReceipt = (allocation) => {
    const doc = new jsPDF();
    const installmentNames = allocation.installments?.length
      ? allocation.installments.map((installment) => installment.installmentTitle).join(', ')
      : 'No installment linked';
    const memberName = allocation.member?.fullName || allocation.fullName || 'Member';
    const memberId = allocation.member?.memberId || allocation.memberId || '-';

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Official Group Payment Allocation Receipt', 105, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.text('SHREE DASHASHREMALI 42 GNATI SURAKSHA SAMITI', 105, 27, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Receipt / Transaction ID: ${receipt.transactionId || '-'}`, 16, 43);
    doc.text(`Allocation ID: ${allocation.allocationId || '-'}`, 16, 51);
    doc.text(`Payment Date: ${receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString() : '-'}`, 16, 59);
    doc.text(`Payer: ${receipt.payerName || '-'}`, 16, 67);
    doc.text(`Payment Mode: ${receipt.paymentMode || '-'}`, 16, 75);
    doc.text(`Member: ${memberName} (${memberId})`, 16, 89);
    doc.text(`Village: ${allocation.member?.village || allocation.village || '-'}`, 16, 97);
    const installmentLines = doc.splitTextToSize(`Installment paid to: ${installmentNames}`, 178);
    doc.text(installmentLines, 16, 105);
    const amountY = 110 + installmentLines.length * 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const amountRupees = allocation.amountRupees ?? allocation.allocatedAmountRupees ?? (allocation.allocatedAmountPaise / 100);
    doc.text(`Allocated Amount: Rs. ${Number(amountRupees || 0).toFixed(2)}`, 16, amountY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Payment Status: ${receipt.paymentStatus || '-'}`, 16, amountY + 12);
    doc.text('Computer generated receipt.', 16, amountY + 30);
    doc.text('Authorized Signatory', 156, amountY + 45, { align: 'center' });
    doc.save(`${allocation.allocationId || receipt.transactionId || 'group-payment'}-receipt.pdf`);
  };

  const downloadMasterReceipt = () => {
    const doc = new jsPDF();
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Official Group / Bulk Payment Receipt', 105, y, { align: 'center' });
    y += 9;
    doc.setFontSize(11);
    doc.text('SHREE DASHASHREMALI 42 GNATI SURAKSHA SAMITI', 105, y, { align: 'center' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const addLine = (label, value) => {
      const lines = doc.splitTextToSize(`${label}: ${value || '-'}`, 178);
      if (y + lines.length * 5 > 275) {
        doc.addPage();
        y = 18;
      }
      doc.text(lines, 16, y);
      y += lines.length * 6;
    };

    addLine('Master Bulk Transaction ID', receipt.transactionId);
    addLine('Payment Date', receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString() : '-');
    addLine('Payer Name', receipt.payerName);
    addLine('Payer Mobile', receipt.payerMobile);
    addLine('Payment Mode', receipt.paymentMode);
    const totalAmountRupees = receipt.totalAmountRupees ?? (Number(receipt.totalAmountPaise || 0) / 100);
    addLine('Total Received Amount', `Rs. ${Number(totalAmountRupees).toFixed(2)}`);
    if (receipt.chequeDetails?.chequeNumber) {
      addLine(
        'Cheque Particulars',
        `#${receipt.chequeDetails.chequeNumber} — ${receipt.chequeDetails.bankName || '-'}`
      );
    }
    addLine('Payment Status', receipt.paymentStatus);
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Member-wise Payment Distribution', 16, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    allocations.forEach((allocation, index) => {
      const memberName = allocation.member?.fullName || allocation.fullName || 'Member';
      const memberId = allocation.member?.memberId || allocation.memberId || '-';
      const installmentNames = allocation.installments?.length
        ? allocation.installments.map((installment) => installment.installmentTitle).join(', ')
        : 'No installment linked';
      const amountRupees = allocation.amountRupees ?? allocation.allocatedAmountRupees ?? (allocation.allocatedAmountPaise / 100);
      addLine(
        `${index + 1}. ${memberName} (${memberId})`,
        `Rs. ${Number(amountRupees || 0).toFixed(2)} — ${installmentNames}`
      );
    });

    y += 8;
    if (y > 275) {
      doc.addPage();
      y = 18;
    }
    doc.text('Computer generated receipt.', 16, y);
    doc.text('Authorized Signatory', 194, y + 12, { align: 'right' });

    const fileName = `${receipt.transactionId || 'group-payment'}-receipt.pdf`.replace(/[^\w.-]/g, '_');
    doc.save(fileName);
  };

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
                  <th className="py-2.5 px-3">Installment paid to</th>
                  <th className="py-2.5 px-3 text-right">Allocated Amount</th>
                  <th className="py-2.5 px-3 text-center no-print">Receipt</th>
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
                    <td className="py-2 px-3 text-slate-600">
                      {alloc.installments?.length
                        ? alloc.installments.map((installment) => installment.installmentTitle).join(', ')
                        : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-700">
                      {alloc.formattedAmount || `₹${alloc.allocatedAmountRupees || alloc.amountRupees}`}
                    </td>
                    <td className="py-2 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => downloadAllocationReceipt(alloc)}
                        className="inline-flex items-center gap-1 rounded-md border border-indigo-200 px-2 py-1 font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-xs">
                <tr>
                  <td colSpan="6" className="py-2.5 px-3 text-right text-slate-700">
                    Grand Total Distributed:
                  </td>
                  <td className="py-2.5 px-3 text-right text-indigo-900 font-black text-sm">
                    {receipt.formattedTotalAmount || `₹${receipt.totalAmountRupees}`}
                  </td>
                  <td className="no-print" />
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
          onClick={downloadMasterReceipt}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700 shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download Master PDF
        </button>
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
