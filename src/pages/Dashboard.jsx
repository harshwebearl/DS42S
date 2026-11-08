import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  Users,
  CreditCard,
  Layers,
  HeartCrack,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Plus
} from 'lucide-react';
import Badge from '../components/common/Badge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Director Dashboard...</p>
        </div>
      </div>
    );
  }

  const { memberStats, installmentStats, paymentStats, claimStats, recentTransactions, pendingChequeQueue } = stats || {};

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <span className="text-9xl font-black">42G</span>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
              Samiti Financial Management System
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Director Executive Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Shree Dashashremali 42 Gnati Suraksha Samiti — Real-Time Operations & Audit
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/single-payment')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Single Pay
            </button>
            <button
              onClick={() => navigate('/bulk-payment')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
            >
              <Users className="h-3.5 w-3.5" />
              Bulk Cheque Pay
            </button>
            <button
              onClick={fetchStats}
              title="Refresh Stats"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Members */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Members</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{memberStats?.total || 0}</p>
          <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
              {memberStats?.active || 0} Active
            </span>
            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
              {memberStats?.deceased || 0} Deceased
            </span>
          </div>
        </div>

        {/* Card 2: Installment Demand & Collection */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collection</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{installmentStats?.formattedCollected || '₹0.00'}</p>
          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
            <span>Demand: <strong className="text-slate-800">{installmentStats?.formattedDemand}</strong></span>
            <span>Pending: <strong className="text-rose-600">{installmentStats?.formattedOutstanding}</strong></span>
          </div>
        </div>

        {/* Card 3: Pending Cheques Queue */}
        <div 
          onClick={() => navigate('/cheque-clearance')}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Cheques</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">
            {paymentStats?.pendingChequesCount || 0}
            <span className="text-xs text-slate-400 font-normal ml-2">cheques</span>
          </p>
          <p className="text-xs text-slate-500 mt-3 flex items-center justify-between font-semibold">
            <span>Amount: {paymentStats?.formattedPendingCheques}</span>
            <span className="text-indigo-600 group-hover:underline flex items-center text-[11px]">Clear <ArrowRight className="h-3 w-3 ml-0.5" /></span>
          </p>
        </div>

        {/* Card 4: Death Claims */}
        <div 
          onClick={() => navigate('/death-claims')}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Death Claims</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
              <HeartCrack className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{claimStats?.totalClaims || 0}</p>
          <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold">
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
              {claimStats?.pendingClaims || 0} Review
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
              {claimStats?.approvedClaims || 0} Approved
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Payment Mode Breakdown & Village Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Modes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
            <span>Collections by Mode</span>
            <span className="text-xs text-slate-400 font-normal">Realized Receipts</span>
          </h3>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">Cash Payment</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{paymentStats?.byMode?.cash?.formatted || '₹0.00'}</p>
                <p className="text-[10px] text-slate-400">{paymentStats?.byMode?.cash?.count || 0} receipts</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-slate-700">UPI Payments</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{paymentStats?.byMode?.upi?.formatted || '₹0.00'}</p>
                <p className="text-[10px] text-slate-400">{paymentStats?.byMode?.upi?.count || 0} receipts</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-semibold text-slate-700">Bank Transfer (NEFT/RTGS)</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{paymentStats?.byMode?.bankTransfer?.formatted || '₹0.00'}</p>
                <p className="text-[10px] text-slate-400">{paymentStats?.byMode?.bankTransfer?.count || 0} receipts</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-slate-700">Cleared Cheques</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{paymentStats?.byMode?.cheque?.formatted || '₹0.00'}</p>
                <p className="text-[10px] text-slate-400">{paymentStats?.byMode?.cheque?.count || 0} cheques</p>
              </div>
            </div>
          </div>
        </div>

        {/* Village Member Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Top Gnati Villages Distribution</h3>
            <button
              onClick={() => navigate('/villages')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              View All Villages <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {(memberStats?.villageDistribution || []).map((v) => (
              <div key={v.villageName} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800">{v.villageName}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-900">
                  {v.count} members
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Pending Cheques Action Queue & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Cheque Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Cheque Action Queue</h3>
              <p className="text-xs text-slate-500">Cheques requiring deposit or clearance verification</p>
            </div>
            <button
              onClick={() => navigate('/cheque-clearance')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Manage Cheques
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {(!pendingChequeQueue || pendingChequeQueue.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No pending cheques in clearance queue.</p>
            ) : (
              pendingChequeQueue.map((c) => (
                <div key={c._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">#{c.chequeDetails?.chequeNumber} — {c.chequeDetails?.bankName}</p>
                    <p className="text-[11px] text-slate-500">Payer: {c.payerName} {c.isBulk && '(Group Cheque)'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-700">{c.formattedAmount}</p>
                    <Badge status={c.paymentStatus} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Financial Transactions</h3>
              <p className="text-xs text-slate-500">Latest single and bulk payments posted</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              All Reports
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {(!recentTransactions || recentTransactions.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No transactions recorded yet.</p>
            ) : (
              recentTransactions.map((t) => (
                <div key={t._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{t.transactionId} — {t.payerName}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(t.paymentDate).toLocaleDateString()} • {t.paymentMode} {t.isBulk ? '(Bulk Allocation)' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{t.formattedAmount}</p>
                    <Badge status={t.paymentStatus} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
