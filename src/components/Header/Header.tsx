import React, { useState, useEffect } from 'react';
import { Search, Bell, X, ShieldCheck, ChevronDown, Lock, Building2 } from 'lucide-react';
import { BaseId, UserRole } from '../../types/aircraft';
import {
  ConnectionStatus,
  getConnectionStatus,
  subscribeConnectionStatus,
  api,
  API_BASE_URL,
} from '../../services/apiClient';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onNavigateToAssistant?: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSecurityModal: () => void;
  currentDepartment?: {
    id: string;
    name: string;
    officer: string;
    serviceId: string;
    role: UserRole;
  } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  currentRole,
  onRoleChange,
  onOpenSecurityModal,
  currentDepartment,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>(() => getConnectionStatus());

  useEffect(() => {
    api.checkBackendLiveness();
    return subscribeConnectionStatus(setConnStatus);
  }, []);

  const roleLabels: Record<UserRole, { name: string; title: string; badge: string; color: string }> = {
    Commander: {
      name: currentDepartment?.role === 'Commander' ? currentDepartment.officer : 'Wing Cmdr. Aditya',
      title: 'Commander — Fleet Command',
      badge: 'COMMANDER',
      color: 'bg-blue-600 text-white',
    },
    Planner: {
      name: currentDepartment?.role === 'Planner' ? currentDepartment.officer : 'Sqn Ldr. Vikram',
      title: 'Planner — Verify & Simulate',
      badge: 'PLANNER',
      color: 'bg-emerald-600 text-white',
    },
    Viewer: {
      name: currentDepartment?.role === 'Viewer' ? currentDepartment.officer : 'MWO R. Sharma',
      title: 'Viewer — Read-Only',
      badge: 'VIEWER',
      color: 'bg-slate-600 text-white',
    },
  };

  return (
    <header className="h-14 bg-[#0F172A] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_2px_4px_rgba(0,0,0,0.15)] gap-4 text-white">
      {/* Search Bar matching Reference Image */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search aircraft, airbase, component or spare..."
            className="w-full pl-10 pr-9 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Center Persistent Synthetic Data Banner */}
      <div className="hidden xl:flex items-center px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse" />
        SYNTHETIC / UNCLASSIFIED DATA — SIMULATED DEMO WORKFLOW
      </div>

      {/* Right Controls: Connection Status, Security Shield, Notifications & RBAC Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Backend Connection Indicator */}
        <div
          onClick={() => api.checkBackendLiveness()}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
            connStatus === 'connected'
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
              : connStatus === 'fallback'
              ? 'bg-amber-950/60 text-amber-400 border-amber-800/80'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
          title={
            connStatus === 'connected'
              ? `Live API Connected (${API_BASE_URL}). Click to re-probe.`
              : connStatus === 'fallback'
              ? 'Backend API unreachable. Operating in local demo simulation mode. Click to retry connection.'
              : 'Probing backend connection...'
          }
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              connStatus === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : connStatus === 'fallback'
                ? 'bg-amber-400'
                : 'bg-slate-500 animate-ping'
            }`}
          />
          <span className="font-mono text-[11px] font-bold hidden sm:inline">
            {connStatus === 'connected'
              ? 'API: Live (Render)'
              : connStatus === 'fallback'
              ? 'API: Demo Fallback'
              : 'API: Connecting...'}
          </span>
        </div>

        {/* Security Shield & MFA Pill */}
        <button
          onClick={onOpenSecurityModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 transition-all text-xs font-bold group"
          title="Cybersecurity Matrix & TOTP MFA"
        >
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></span>
          </div>
          <span className="hidden sm:inline">Security Shield &amp; MFA</span>
          <span className="text-[10px] bg-blue-600 text-white font-mono px-1.5 py-0.2 rounded font-bold ml-0.5">
            MFA
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors relative"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 px-3 z-50 text-xs text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-bold text-slate-900">Fleet Alerts</span>
                <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  2 Pending Decisions
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900">
                  <div className="font-bold">Rafale RB-008: APU Starter Generator</div>
                  <p className="text-[11px] text-red-800 mt-0.5">
                    Critical procurement awaiting Commander sign-off (Ambala AFS).
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="font-bold">Tejas LA-5018: Return to Service</div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Depot overhaul clearance ready for authorization (Sulur AFS).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Department Silo Profile Badge */}
        {currentDepartment && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <div className="text-left">
              <span className="font-bold text-slate-200 truncate block max-w-[170px]" title={currentDepartment.name}>
                {currentDepartment.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentDepartment.serviceId} • {currentDepartment.officer.split('(')[0].trim()}
              </span>
            </div>
          </div>
        )}

        {/* Switch Department / Lock Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-800/60 bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Lock session & Switch Department Role"
          >
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Switch / Lock</span>
            <span className="sm:hidden">Lock</span>
          </button>
        )}

        {/* RBAC Role Switcher & User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 pl-2 pr-2 py-1 border border-slate-700/80 hover:border-slate-600 rounded-xl bg-slate-900 hover:bg-slate-800 cursor-pointer transition-all"
            title="Switch User Role & Access Clearance"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-2xs ${
                roleLabels[currentRole].color
              }`}
            >
              {currentRole[0]}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {roleLabels[currentRole].name}
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight">
                {roleLabels[currentRole].title}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs text-slate-800 space-y-1">
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
                        {r === 'Viewer' && <Lock className="w-3 h-3 text-red-500" />}
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

              <div className="pt-2 border-t border-slate-100 px-2 pb-1 space-y-1">
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    onOpenSecurityModal();
                  }}
                  className="w-full py-1 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  View Cybersecurity &amp; MFA Status
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onLogout();
                    }}
                    className="w-full py-1 text-center text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center justify-center gap-1 cursor-pointer rounded-lg hover:bg-red-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Lock Session &amp; Switch Department
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
