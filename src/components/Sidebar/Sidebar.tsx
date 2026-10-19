import React from 'react';
import {
  LayoutDashboard,
  Plane,
  Database,
  Wrench,
  Sliders,
  BarChart2,
  ClipboardList,
  Building2,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  Cpu,
  Brain,
  Activity,
  FileText,
  CheckSquare,
  Lock,
  Boxes,
  Package,
  Truck,
  Warehouse,
  CalendarCheck,
  Home,
  UploadCloud,
  ClipboardCheck,
  Folder,
  Calendar,
  Clock,
  ShoppingCart,
} from 'lucide-react';
import { BaseId, UserRole } from '../../types/aircraft';
import { baseList } from '../../data/aircraftData';
import iafFighterImg from '../../assets/iaf_fighter_tarmac.jpg';

interface SidebarNavItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  currentRole?: UserRole;
  currentDepartmentId?: string;
  currentDepartmentName?: string;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavChange,
  selectedBaseId,
  onSelectBase,
  currentRole = 'Commander',
  currentDepartmentId = 'fleet-command',
  pendingApprovalsCount = 5,
}) => {
  const [showBaseDropdown, setShowBaseDropdown] = React.useState(false);

  // 1. Air Fleet Command Navigation (Commander)
  const fleetCommandNavItems: SidebarNavItem[] = [
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

  // 2. Aircraft Health & Diagnostics Navigation (NO Command Center!)
  const healthDiagnosticsNavItems: SidebarNavItem[] = [
    {
      id: 'aircraft-health',
      label: 'Aircraft Health',
      sublabel: '3D twin & telemetry',
      icon: Plane,
    },
    {
      id: 'component-analytics',
      label: 'Component Analytics',
      sublabel: 'Subsystem performance',
      icon: Cpu,
    },
    {
      id: 'ai-predictions',
      label: 'AI Predictions',
      sublabel: 'RUL & failure risk',
      icon: Brain,
    },
    {
      id: 'usage-simulator',
      label: 'Usage Simulator',
      sublabel: 'Flight-hours projection',
      icon: Activity,
    },
    {
      id: 'diagnostic-cases',
      label: 'Diagnostic Cases',
      sublabel: 'Flagged anomalies',
      icon: ClipboardList,
    },
    {
      id: 'reports-health',
      label: 'Health Reports',
      sublabel: 'Engineering analytics',
      icon: BarChart2,
    },
  ];

  // 3. Technical Records & Quality Assurance Navigation (Matches Reference UI exactly)
  const techRecordsNavItems: SidebarNavItem[] = [
    {
      id: 'tech-records',
      label: 'Records Overview',
      sublabel: 'Dashboard & stats',
      icon: LayoutDashboard,
    },
    {
      id: 'import-records',
      label: 'Import Records',
      sublabel: 'PDF / CSV ingestion',
      icon: UploadCloud,
    },
    {
      id: 'data-sources',
      label: 'Data Sources',
      sublabel: 'Connected digital systems',
      icon: Database,
    },
    {
      id: 'aircraft-records',
      label: 'Aircraft Records',
      sublabel: 'Fleet tail logbooks',
      icon: Plane,
    },
    {
      id: 'maintenance-history',
      label: 'Maintenance History',
      sublabel: 'Servicing archives',
      icon: Clock,
    },
    {
      id: 'inspection-records',
      label: 'Inspection Records',
      sublabel: 'QA certificates',
      icon: ClipboardCheck,
    },
    {
      id: 'component-changes',
      label: 'Component Changes',
      sublabel: 'Parts replacement logs',
      icon: Wrench,
    },
    {
      id: 'previous-records',
      label: 'Previous Records',
      sublabel: 'Historical documentation',
      icon: Folder,
    },
    {
      id: 'verify-queue',
      label: 'Verify-First Queue',
      sublabel: 'Flagged records audit',
      icon: ShieldCheck,
      badge: 2,
    },
    {
      id: 'audit-trail',
      label: 'Audit Trail',
      sublabel: 'Cryptographic ledger',
      icon: Calendar,
    },
    {
      id: 'reports-tech',
      label: 'Reports',
      sublabel: 'Quality & compliance',
      icon: BarChart2,
    },
  ];

  // 4. Logistics & Spares Navigation (Matches Reference UI exactly)
  const logisticsSparesNavItems: SidebarNavItem[] = [
    {
      id: 'logistics-spares',
      label: 'Logistics Overview',
      sublabel: 'Depot & supply matrix',
      icon: Boxes,
    },
    {
      id: 'spares-inventory',
      label: 'Spare Parts Inventory',
      sublabel: 'Real-time base stock',
      icon: Package,
    },
    {
      id: 'material-requests',
      label: 'Material Requests',
      sublabel: 'Squadron requisitions',
      icon: ClipboardList,
      badge: 12,
    },
    {
      id: 'transfers',
      label: 'Transfers',
      sublabel: 'Cross-base transit',
      icon: Truck,
      badge: 7,
    },
    {
      id: 'procurement',
      label: 'Procurement',
      sublabel: 'OEM & vendor orders',
      icon: ShoppingCart,
    },
    {
      id: 'stock-movement',
      label: 'Stock Movement History',
      sublabel: 'Receipts & audit logs',
      icon: Clock,
    },
    {
      id: 'suppliers-sources',
      label: 'Suppliers / Sources',
      sublabel: 'IMMOLS & e-MMS status',
      icon: Database,
    },
    {
      id: 'reports-logistics',
      label: 'Reports',
      sublabel: 'Supply chain analytics',
      icon: BarChart2,
    },
  ];

  // 5. Maintenance Agency Navigation (NO Command Center!)
  const maintenanceAgencyNavItems: SidebarNavItem[] = [
    {
      id: 'maintenance-agency',
      label: 'Maintenance Agency',
      sublabel: 'Hangar floor control',
      icon: Wrench,
    },
    {
      id: 'work-orders',
      label: 'Work Orders',
      sublabel: 'Active servicing queue',
      icon: ClipboardList,
    },
    {
      id: 'hangar-bays',
      label: 'Hangar Bays',
      sublabel: 'Bay occupancy & status',
      icon: Warehouse,
    },
    {
      id: 'rtf-schedule',
      label: 'Ready-to-Fly Schedule',
      sublabel: 'Sortie gate inspections',
      icon: CalendarCheck,
    },
    {
      id: 'reports-maintenance',
      label: 'Maintenance Reports',
      sublabel: 'Depot turnaround stats',
      icon: BarChart2,
    },
  ];

  // Select navigation set strictly based on authenticated department
  const getNavItems = (): SidebarNavItem[] => {
    switch (currentDepartmentId) {
      case 'health-diagnostics':
        return healthDiagnosticsNavItems;
      case 'tech-records':
        return techRecordsNavItems;
      case 'logistics-spares':
        return logisticsSparesNavItems;
      case 'maintenance-agency':
        return maintenanceAgencyNavItems;
      case 'fleet-command':
      default:
        // If commander role or default fleet-command
        if (currentRole === 'Commander' || currentDepartmentId === 'fleet-command') {
          return fleetCommandNavItems;
        }
        return fleetCommandNavItems;
    }
  };

  const navItems = getNavItems();

  const departmentSubtitleMap: Record<string, string> = {
    'fleet-command': 'FLEET COMMAND',
    'health-diagnostics': 'DIAGNOSTICS CELL',
    'tech-records': 'TECH RECORDS & QA',
    'logistics-spares': 'LOGISTICS DEPOT',
    'maintenance-agency': 'MAINTENANCE AGENCY',
  };

  const departmentSubtitle =
    departmentSubtitleMap[currentDepartmentId] ||
    (currentRole === 'Commander' ? 'FLEET COMMAND' : 'AEROSPACE SUITE');

  const currentBase = baseList.find((b) => b.id === selectedBaseId) || baseList[0];

  const isNavActive = (itemId: string): boolean => {
    if (activeNav === itemId) return true;
    if (itemId === 'tech-records' && (activeNav === 'tech-records' || activeNav === 'records-overview')) return true;
    if (itemId === 'import-records' && (activeNav === 'import-records' || activeNav === 'data-import')) return true;
    if (itemId === 'audit-trail' && (activeNav === 'audit-trail' || activeNav === 'audit-ledger')) return true;
    if (itemId === 'reports-tech' && (activeNav === 'reports-tech' || activeNav === 'reports')) return true;
    if (itemId === 'reports' && (activeNav === 'reports' || activeNav === 'reports-analytics')) return true;
    if (itemId === 'reports-health' && (activeNav === 'reports-health' || activeNav === 'reports')) return true;
    if (itemId === 'reports-logistics' && (activeNav === 'reports-logistics' || activeNav === 'reports')) return true;
    if (itemId === 'reports-maintenance' && (activeNav === 'reports-maintenance' || activeNav === 'reports')) return true;
    if (itemId === 'aircraft-health' && (activeNav === 'aircraft-health' || activeNav === 'digital-twin')) return true;
    if (itemId === 'resource-optimizer' && (activeNav === 'resource-optimizer' || activeNav === 'optimizer')) return true;
    if (itemId === 'work-orders' && (activeNav === 'work-orders' || activeNav === 'maintenance-scheduler')) return true;
    if (itemId === 'spares-inventory' && (activeNav === 'spares-inventory' || activeNav === 'maintenance-logistics' || activeNav === 'logistics')) return true;
    if (itemId === 'logistics-spares' && (activeNav === 'logistics-spares' || activeNav === 'logistics-overview')) return true;
    if (itemId === 'material-requests' && (activeNav === 'material-requests' || activeNav === 'requests')) return true;
    if (itemId === 'stock-movement' && (activeNav === 'stock-movement' || activeNav === 'movement-history')) return true;
    if (itemId === 'suppliers-sources' && (activeNav === 'suppliers-sources' || activeNav === 'sources')) return true;
    return false;
  };

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
        {/* Exact AirDoctor Logo */}
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
            <div className="text-[10px] font-mono text-slate-300 mt-0.5 uppercase tracking-wider font-semibold">
              {departmentSubtitle}
            </div>
          </div>
        </div>

        {/* Department-Specific Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-xs cursor-pointer ${
                  active
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-400/50 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 truncate text-left">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-blue-400' : 'text-slate-400'
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
          })}
        </nav>
      </div>

      {/* Bottom Area: Operating Base Selector + IAF Inscription directly over tarmac visual */}
      <div className="relative z-10 space-y-3 pt-3 border-t border-slate-700/50 px-1">
        {/* Selected Workspace badge for Technical Records & Quality matching reference image */}
        {currentDepartmentId === 'tech-records' && (
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Selected Workspace
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-600/25 border border-blue-500/40 rounded-xl text-xs font-bold text-blue-200 backdrop-blur-xs">
              <div className="flex items-center gap-2 truncate">
                <div className="w-4 h-4 rounded bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-2.5 h-2.5" />
                </div>
                <span className="truncate text-[11px] font-semibold">Technical Records &amp; Quality</span>
              </div>
              <span className="text-slate-400 text-xs">•••</span>
            </div>
          </div>
        )}

        {currentDepartmentId === 'logistics-spares' && (
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Selected Workspace
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-purple-600/25 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 backdrop-blur-xs">
              <div className="flex items-center gap-2 truncate">
                <div className="w-4 h-4 rounded bg-purple-500 text-white flex items-center justify-center shrink-0">
                  <Boxes className="w-2.5 h-2.5" />
                </div>
                <span className="truncate text-[11px] font-semibold">Logistics &amp; Spares Depot</span>
              </div>
              <span className="text-slate-400 text-xs">•••</span>
            </div>
          </div>
        )}

        {/* Base Selector */}
        <div>
          <label className="text-[9px] text-slate-300 block font-bold uppercase tracking-wider mb-1 drop-shadow-xs">
            Focus Airbase
          </label>
          <button
            onClick={() => setShowBaseDropdown(!showBaseDropdown)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900/95 border border-slate-700/70 rounded-xl text-xs font-bold text-slate-100 backdrop-blur-xs transition-colors shadow-xs cursor-pointer"
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
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700/60 transition-colors cursor-pointer ${
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
