import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  if (!total || total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <p>
          Showing <span className="font-semibold text-slate-900">{(page - 1) * limit + 1}</span> to{' '}
          <span className="font-semibold text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
          <span className="font-semibold text-slate-900">{total}</span> entries
        </p>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-xs font-bold rounded border border-slate-300 px-2 py-0.5 bg-white text-indigo-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500">entries</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="relative inline-flex items-center rounded-l-md px-2.5 py-1.5 text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="relative inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="relative inline-flex items-center rounded-r-md px-2.5 py-1.5 text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
