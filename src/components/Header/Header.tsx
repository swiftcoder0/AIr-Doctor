import React, { useState } from 'react';
import { Search, Bell, X, AlertCircle, ChevronDown } from 'lucide-react';
import { BaseId } from '../../types/aircraft';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onNavigateToAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNavigateToAssistant,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Search Bar matching Reference Image */}
      <div className="flex-1 max-w-xl">
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
      <div className="hidden lg:flex items-center px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[10px] font-mono font-bold text-slate-600 tracking-wider">
        SYNTHETIC / UNCLASSIFIED DATA — SIMULATED DEMO WORKFLOW
      </div>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center gap-4">
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

        {/* User Profile matching Reference Image: Green circle 'A' + Air Commander */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-emerald-100">
            A
          </div>
          <span className="text-xs font-bold text-slate-800 hidden sm:inline">
            Air Commander
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
        </div>
      </div>
    </header>
  );
};
