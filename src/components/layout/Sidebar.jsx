import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Users,
  UserCheck,
  Calendar,
  Layers,
  AlertTriangle,
  CreditCard,
  Users2,
  CheckCircle2,
  Pencil,
  BookOpen,
  HeartCrack,
  FileCheck2,
  BarChart3,
  Settings,
  ShieldAlert,
  UserCog
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Village Management', path: '/villages', icon: MapPin },
  { name: 'Member Management', path: '/members', icon: Users },
  { name: 'Nominee Management', path: '/nominees', icon: UserCheck },
  { name: 'Financial Year', path: '/financial-years', icon: Calendar },
  { name: 'Installment Master', path: '/installments', icon: Layers },
  { name: 'Penalty Management', path: '/penalties', icon: AlertTriangle },
  { name: 'Single Payment', path: '/single-payment', icon: CreditCard },
  { name: 'Bulk Payment', path: '/bulk-payment', icon: Users2, highlight: true },
  { name: 'Cheque Clearance', path: '/cheque-clearance', icon: CheckCircle2 },
  { name: 'Payment Management', path: '/payments', icon: Pencil },
  { name: 'Member Ledger', path: '/member-ledger', icon: BookOpen },
  { name: 'Death Claims', path: '/death-claims', icon: HeartCrack },
  { name: 'Claim Cheques', path: '/claim-cheques', icon: FileCheck2 },
  { name: 'Reports & Export', path: '/reports', icon: BarChart3 },
  { name: 'User Management', path: '/users', icon: UserCog },
  { name: 'Settings & Audit', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { director } = useAuth();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-md text-lg tracking-wider">
            42G
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white leading-tight">
              Shree Dashashremali
            </h1>
            <p className="text-[11px] font-medium text-amber-400">
              42 Gnati Suraksha Samiti
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Director CRM Console
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : item.highlight
                      ? 'text-amber-400 hover:bg-slate-800/80 hover:text-amber-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.name}</span>
                {item.highlight && (
                  <span className="ml-auto text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Group
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Director Profile Badge at Bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase shrink-0">
              {director?.name ? director.name.charAt(0) : 'D'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {director?.name || 'Authorized Director'}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {director?.email || 'director@ds24g.org'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
