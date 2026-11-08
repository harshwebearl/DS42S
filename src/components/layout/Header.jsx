import React from 'react';
import { Menu, LogOut, Shield, CreditCard, Users2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const { director, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        {/* Left: Mobile hamburger & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              Directorate Portal
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Shree Dashashremali 42 Gnati Suraksha Samiti
            </p>
          </div>
        </div>

        {/* Right: Quick actions & Director Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/members')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <UserPlus className="h-3.5 w-3.5 text-slate-500" />
            Add Member
          </button>

          <button
            onClick={() => navigate('/single-payment')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
            Single Pay
          </button>

          <button
            onClick={() => navigate('/bulk-payment')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Users2 className="h-3.5 w-3.5 text-indigo-200" />
            Bulk Cheque Pay
          </button>

          {/* Currently logged-in Director Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
              {director?.name ? director.name.charAt(0) : 'D'}
            </div>
            <div className="text-left leading-none max-w-[150px]">
              <p className="text-xs font-bold text-slate-800 truncate">{director?.name || 'Director'}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">{director?.email || 'director@ds24g.org'}</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title="Secure Logout"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
