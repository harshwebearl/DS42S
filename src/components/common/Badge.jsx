import React from 'react';

export default function Badge({ status, text }) {
  const s = String(status || '').toUpperCase();
  const label = text || s.replace(/_/g, ' ');

  let classes = 'bg-slate-100 text-slate-700 border-slate-200';

  // Green / Active / Cleared / Paid / Eligible
  if (['ACTIVE', 'CLEARED', 'PAID', 'ELIGIBLE', 'APPROVED', 'DISBURSED', 'CONFIRMED'].includes(s)) {
    classes = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  // Amber / Warning / Pending / Deposited / Partial / Review / Provisional
  else if (['PENDING', 'PARTIAL', 'RECEIVED', 'DEPOSITED', 'PENDING_REVIEW', 'PROVISIONAL', 'PREPARED', 'ISSUED', 'HANDED_OVER'].includes(s)) {
    classes = 'bg-amber-50 text-amber-700 border-amber-200';
  }
  // Red / Danger / Overdue / Bounced / Inactive / Deceased / Rejected / Reverted / Cancelled
  else if (['OVERDUE', 'BOUNCED', 'INACTIVE', 'DECEASED', 'REJECTED', 'INELIGIBLE_PENDING_DUES', 'REVERTED', 'CANCELLED', 'RETURNED'].includes(s)) {
    classes = 'bg-rose-50 text-rose-700 border-rose-200';
  }
  // Blue / Info / Waived
  else if (['WAIVED', 'CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(s)) {
    classes = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {label}
    </span>
  );
}
