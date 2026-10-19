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
      name: currentDepartment?.role === 'Commander' ? currentDepartment.officer.split('(')[0].trim() : 'Wing Cmdr. Aditya',
      title: 'Fleet Commander',
      badge: 'COMMANDER',
      color: 'bg-blue-600 text-white',
    },
    Planner: {
      name: currentDepartment?.role === 'Planner' ? currentDepartment.officer.split('(')[0].trim() : 'Sqn Ldr. Vikram',
      title: 'Chief Engineering Officer',
      badge: 'PLANNER',
      color: 'bg-emerald-600 text-white',
    },
    Viewer: {
      name: currentDepartment?.role === 'Viewer' ? currentDepartment.officer.split('(')[0].trim() : 'MWO R. Sharma',
      title: 'Hangar Controller',
      badge: 'VIEWER',
      color: 'bg-slate-600 text-white',
    },
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-4 text-slate-800">
      {/* 1. Clean Search Bar with Ctrl K hint */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search base, aircraft, work order, or component..."
            className="w-full pl-10 pr-20 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded font-semibold">
                Ctrl K
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right Controls: Simple Green/Red Live Indicator + Bell + User Persona */}
      <div className="flex items-center gap-3">
        {/* Simple Green/Red Backend Status Icon */}
        <button
          onClick={() => api.checkBackendLiveness()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition-colors cursor-pointer"
          title={
            connStatus === 'connected'
              ? `Live Render Backend Connected (${API_BASE_URL}). Click to re-probe.`
              : 'Backend inactive / demo simulation mode. Click to retry connection.'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connStatus === 'connected'
                ? 'bg-emerald-500 shadow-[0_0_6px_#10B981] animate-pulse'
                : 'bg-red-500 shadow-[0_0_6px_#EF4444]'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-700">
            {connStatus === 'connected' ? 'Live Data' : 'Demo Mode'}
          </span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-3 z-50 text-xs text-slate-800">
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

        {/* User Profile Avatar Pill matching Reference Screenshot */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer transition-colors"
            title="User Profile & Department Options"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              A
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {roleLabels[currentRole].name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                {roleLabels[currentRole].title}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs text-slate-800 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Active Persona
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
                  className="w-full py-1.5 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1.5 cursor-pointer rounded-lg hover:bg-blue-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Security Shield &amp; MFA Status</span>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onLogout();
                    }}
                    className="w-full py-1.5 text-center text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center justify-center gap-1.5 cursor-pointer rounded-lg hover:bg-red-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Switch Department / Lock</span>
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
