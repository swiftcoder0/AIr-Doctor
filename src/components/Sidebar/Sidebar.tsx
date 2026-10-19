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
  Building2,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { BaseId, UserRole } from '../../types/aircraft';
import { baseList } from '../../data/aircraftData';
import iafFighterImg from '../../assets/iaf_fighter_tarmac.jpg';

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  currentRole?: UserRole;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavChange,
  selectedBaseId,
  onSelectBase,
  currentRole = 'Commander',
  pendingApprovalsCount = 5,
}) => {
  const [showBaseDropdown, setShowBaseDropdown] = React.useState(false);

  // Commander navigation matching the requirements
  const commanderNavItems = [
    {
      id: 'command-center',
      label: 'Command Center',
      sublabel: 'Fleet overview',
      icon: LayoutDashboard,
    },
    {
      id: 'base-operations',
      label: 'Base Operations',
      sublabel: 'All airbases & status',
      icon: Building2,
    },
    {
      id: 'fleet-overview',
      label: 'Fleet Overview',
      sublabel: 'Aircraft readiness',
      icon: Plane,
    },
    {
      id: 'command-approvals',
      label: 'Command Approvals',
      sublabel: 'Pending decisions',
      icon: ShieldCheck,
      badge: pendingApprovalsCount,
    },
    {
      id: 'strategic-insights',
      label: 'Strategic Insights',
      sublabel: 'Trends & analytics',
      icon: TrendingUp,
    },
    {
      id: 'reports',
      label: 'Reports',
      sublabel: 'Fleet & operational reports',
      icon: BarChart2,
    },
  ];

  // Standard navigation for other roles (Planner / Viewer)
  const standardNavItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'aircraft-health', label: 'Aircraft Health', icon: Plane },
    { id: 'data-import', label: 'Data Import', icon: Database },
    { id: 'maintenance-logistics', label: 'Maintenance', icon: Wrench },
    { id: 'resource-optimizer', label: 'Resource Optimizer', icon: Sliders },
    { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
    { id: 'reports-analytics', label: 'Reports', icon: BarChart2 },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
  ];

  const isCommander = currentRole === 'Commander';
  const currentBase = baseList.find((b) => b.id === selectedBaseId) || baseList[0];

  return (
    <aside className="w-64 h-screen flex flex-col justify-between py-4 px-3 select-none text-white z-20 shrink-0 overflow-hidden relative border-r border-slate-800/80 bg-[#0F172A]">
      {/* 
        Transparent Navy Blue Background with Aircraft on Tarmac matching reference image.
        Uses bundled asset to ensure zero 404s or server errors on any deployment.
      */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.90) 35%, rgba(10, 18, 42, 0.45) 65%, rgba(8, 14, 32, 0.88) 100%), url('${iafFighterImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Top Section: Brand & Nav Links */}
      <div className="relative z-10 space-y-4">
        {/* Exact AirDoctor Logo matching existing specification */}
        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-blue-600/25 text-blue-400 border border-blue-500/40 flex items-center justify-center shadow-inner backdrop-blur-xs">
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
          <div>
            <div className="text-base font-black tracking-tight text-white leading-none drop-shadow-xs">
              AirDoctor
            </div>
            <div className="text-[10px] font-mono text-slate-300 mt-0.5">
              {isCommander ? 'FLEET COMMAND' : 'AEROSPACE SUITE'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {isCommander ? (
            // Commander Navigation Items
            commanderNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeNav === item.id ||
                (item.id === 'reports' && (activeNav === 'reports' || activeNav === 'reports-analytics'));
              return (
                <button
                  key={item.id}
                  onClick={() => onNavChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-xs ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-400/50 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate text-left">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <div className="truncate font-bold leading-none text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-normal truncate">
                        {item.sublabel}
                      </div>
                    </div>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white shadow-xs shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            // Standard Navigation for Other Departments
            standardNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-xs ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-400/50 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Bottom Area: Operating Base Selector + IAF Inscription directly over tarmac visual */}
      <div className="relative z-10 space-y-3 pt-3 border-t border-slate-700/50 px-1">
        {/* Base Selector */}
        <div>
          <label className="text-[9px] text-slate-300 block font-bold uppercase tracking-wider mb-1 drop-shadow-xs">
            Focus Airbase
          </label>
          <button
            onClick={() => setShowBaseDropdown(!showBaseDropdown)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900/95 border border-slate-700/70 rounded-xl text-xs font-bold text-slate-100 backdrop-blur-xs transition-colors shadow-xs"
          >
            <span className="truncate">{currentBase.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {showBaseDropdown && (
            <div className="absolute bottom-28 left-2 right-2 bg-[#1E293B]/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                Select Operating Airbase
              </div>
              {baseList.map((base) => (
                <button
                  key={base.id}
                  onClick={() => {
                    onSelectBase(base.id);
                    setShowBaseDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700/60 transition-colors ${
                    selectedBaseId === base.id ? 'bg-blue-950/70 text-blue-400 font-bold' : 'text-slate-300'
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

        {/* IAF Emblem & Inscription sitting over tarmac background */}
        <div className="pt-2 border-t border-slate-700/40 text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-black tracking-widest text-white uppercase drop-shadow-sm">
            <span className="w-1.5 h-3 bg-gradient-to-b from-orange-500 via-white to-green-600 rounded-full inline-block mr-1"></span>
            <span>INDIAN AIR FORCE</span>
          </div>
          <div className="text-[8px] font-bold tracking-wider text-slate-300 uppercase drop-shadow-xs">
            INTEGRITY • PRECISION • READINESS
          </div>
        </div>
      </div>
    </aside>
  );
};
