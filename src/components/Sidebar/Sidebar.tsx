import React from 'react';
import {
  LayoutDashboard,
  Plane,
  Database,
  Wrench,
  Sliders,
  BarChart2,
  Bot,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';
import { BaseId } from '../../types/aircraft';
import { baseList } from '../../data/aircraftData';

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavChange,
  selectedBaseId,
  onSelectBase,
}) => {
  const [showBaseDropdown, setShowBaseDropdown] = React.useState(false);

  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'aircraft-health', label: 'Aircraft Health', icon: Plane },
    { id: 'data-import', label: 'Data Import', icon: Database },
    { id: 'maintenance-logistics', label: 'Maintenance', icon: Wrench },
    { id: 'resource-optimizer', label: 'Resource Optimizer', icon: Sliders },
    { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
    { id: 'reports-analytics', label: 'Reports', icon: BarChart2 },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
  ];

  const currentBase = baseList.find((b) => b.id === selectedBaseId) || baseList[0];

  return (
    <aside className="w-60 bg-[#0F172A] border-r border-slate-800/80 flex flex-col justify-between py-5 px-3 shrink-0 select-none text-white z-20">
      <div className="space-y-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">
            AirDoctor
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#142A20] text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Base Selector matching Reference Image */}
      <div className="relative pt-4 border-t border-slate-800/80 px-1">
        <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1.5">
          Base
        </label>
        <button
          onClick={() => setShowBaseDropdown(!showBaseDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800/80 transition-colors"
        >
          <span className="truncate">{currentBase.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </button>

        {showBaseDropdown && (
          <div className="absolute bottom-16 left-1 right-1 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              Select Operating Base
            </div>
            {baseList.map((base) => (
              <button
                key={base.id}
                onClick={() => {
                  onSelectBase(base.id);
                  setShowBaseDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700/60 transition-colors ${
                  selectedBaseId === base.id ? 'bg-emerald-950/60 text-emerald-400 font-bold' : 'text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{base.name}</div>
                  <div className="text-[10px] text-slate-400">{base.squadron}</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">
                  {base.aircraftCount} Jets
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
