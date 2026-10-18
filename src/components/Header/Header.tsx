import React, { useState } from 'react';
import { Search, Bell, X, ShieldCheck, ChevronDown, User, Lock } from 'lucide-react';
import { BaseId, UserRole } from '../../types/aircraft';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onNavigateToAssistant?: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSecurityModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  currentRole,
  onRoleChange,
  onOpenSecurityModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roleLabels: Record<UserRole, { name: string; title: string; badge: string; color: string }> = {
    Commander: {
      name: 'Wing Cmdr. Aditya',
      title: 'Commander — Full Access',
      badge: 'COMMANDER',
      color: 'bg-emerald-700 text-white',
    },
    Planner: {
      name: 'Sqn Ldr. Verma',
      title: 'Planner — Verify & Simulate',
      badge: 'PLANNER',
      color: 'bg-blue-700 text-white',
    },
    Viewer: {
      name: 'Flt Lt. Rao',
      title: 'Viewer — Read-Only',
      badge: 'VIEWER',
      color: 'bg-slate-700 text-white',
    },
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-4">
      {/* Search Bar matching Reference Image */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search aircraft, component or spare..."
            className="w-full pl-10 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Center Persistent Synthetic Data Banner (Section 7) */}
      <div className="hidden xl:flex items-center px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[10px] font-mono font-bold text-slate-600 tracking-wider">
        SYNTHETIC / UNCLASSIFIED DATA — SIMULATED DEMO WORKFLOW
      </div>

      {/* Right Controls: Security Shield, Notifications & RBAC Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Security Shield & MFA Pill (Task 2) */}
        <button
          onClick={onOpenSecurityModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 transition-all text-xs font-bold shadow-2xs group"
          title="Cybersecurity Matrix & TOTP MFA"
        >
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          </div>
          <span className="hidden sm:inline">Security Shield &amp; MFA</span>
          <span className="text-[10px] bg-emerald-600 text-white font-mono px-1.5 py-0.2 rounded font-bold ml-0.5">
            MFA
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-3 px-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-semibold text-slate-900">Fleet Alerts</span>
                <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                  2 Attention
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                  <div className="font-bold">Tejas T-04: Hydraulic Pump Overhaul</div>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Awaiting spare HP-9042. Lead time 6-8 weeks from vendor.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="font-bold">Rafale R-02: Engine Inspection</div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Due in 12 hours. Bay 2 scheduled.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RBAC Role Switcher & User Profile Dropdown (Task 2) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition-all"
            title="Switch User Role & Access Clearance"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs ${
                roleLabels[currentRole].color
              }`}
            >
              {currentRole[0]}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {roleLabels[currentRole].name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                {roleLabels[currentRole].title}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Operational Persona
              </div>

              {(['Commander', 'Planner', 'Viewer'] as UserRole[]).map((r) => {
                const info = roleLabels[r];
                const active = currentRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      onRoleChange(r);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between transition-all ${
                      active
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {r === 'Viewer' && <Lock className="w-3 h-3 text-rose-500" />}
                        {info.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {info.title}
                      </div>
                    </div>
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100 px-2 pb-1">
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    onOpenSecurityModal();
                  }}
                  className="w-full py-1 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  View Cybersecurity &amp; MFA Status
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

