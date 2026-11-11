import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Download, FileText, Search } from 'lucide-react';
import api from '../api/axiosClient';
import Modal from '../components/common/Modal';
import BulkPaymentReceipt from '../components/receipts/BulkPaymentReceipt';

const PAGE_SIZE = 25;

export default function GroupPaymentReceipts() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/payments', {
        params: { isBulk: true, search: search.trim(), page, limit: PAGE_SIZE }
      });
      setTransactions(response.data.transactions || []);
      setTotalPages(Math.max(1, response.data.totalPages || 1));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load group payment receipt history.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openReceipt = async (transaction) => {
    setReceiptLoading(true);
    setError('');
    try {
      const response = await api.get(`/payments/${transaction._id}`);
      setSelectedReceipt({
        ...response.data.transaction,
        allocations: response.data.allocations || []
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this group payment receipt.');
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
          <FileText className="h-6 w-6 text-indigo-600" />
          Official Group Payment Receipts
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Browse bulk payment history, view official receipts, and download a separate PDF receipt for each member allocation.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setLoading(true);
              setError('');
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search transaction, payer, cheque or reference..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="px-3 py-3">Transaction ID</th>
                <th className="px-3 py-3">Payer</th>
                <th className="px-3 py-3">Payment Date</th>
                <th className="px-3 py-3">Mode</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Total Amount</th>
                <th className="px-3 py-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-3 py-10 text-center text-slate-500">Loading group payment history...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="7" className="px-3 py-10 text-center text-slate-500">No group payment receipts found.</td></tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono font-bold text-indigo-700">{transaction.transactionId}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{transaction.payerName}</p>
                    <p className="text-[10px] text-slate-500">{transaction.payerMobile || '-'}</p>
                  </td>
                  <td className="px-3 py-3">{new Date(transaction.paymentDate).toLocaleDateString()}</td>
                  <td className="px-3 py-3">{transaction.paymentMode?.replace('_', ' ')}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      transaction.paymentStatus === 'CLEARED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {transaction.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-900">{transaction.formattedTotalAmount}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      disabled={receiptLoading}
                      onClick={() => openReceipt(transaction)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      View / Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError('');
                setPage((current) => Math.max(1, current - 1));
              }}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError('');
                setPage((current) => Math.min(totalPages, current + 1));
              }}
              disabled={page === totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Official Group Payment Receipt"
        size="2xl"
      >
        <BulkPaymentReceipt receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      </Modal>
    </div>
  );
}
