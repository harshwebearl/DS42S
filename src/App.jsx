import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Villages from './pages/Villages';
import Members from './pages/Members';
import Nominees from './pages/Nominees';
import FinancialYears from './pages/FinancialYears';
import Installments from './pages/Installments';
import Penalties from './pages/Penalties';
import SinglePayment from './pages/SinglePayment';
import BulkPayment from './pages/BulkPayment';
import ChequeClearance from './pages/ChequeClearance';
import MemberLedger from './pages/MemberLedger';
import DeathClaims from './pages/DeathClaims';
import ClaimCheques from './pages/ClaimCheques';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="villages" element={<Villages />} />
            <Route path="members" element={<Members />} />
            <Route path="nominees" element={<Nominees />} />
            <Route path="financial-years" element={<FinancialYears />} />
            <Route path="installments" element={<Installments />} />
            <Route path="penalties" element={<Penalties />} />
            <Route path="single-payment" element={<SinglePayment />} />
            <Route path="bulk-payment" element={<BulkPayment />} />
            <Route path="cheque-clearance" element={<ChequeClearance />} />
            <Route path="member-ledger" element={<MemberLedger />} />
            <Route path="death-claims" element={<DeathClaims />} />
            <Route path="claim-cheques" element={<ClaimCheques />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
