import React from 'react';
import {
  FileText,
  Boxes,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Database,
  CheckSquare,
  Lock,
  Sliders,
  Package,
  Truck,
  ClipboardList,
  Warehouse,
  CalendarCheck,
  Building2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface DepartmentSetupWorkspaceViewProps {
  departmentId: string;
  onNavigate: (tab: string) => void;
}

interface WorkspaceConfig {
  title: string;
  badge: string;
  badgeColor: string;
  officer: string;
  serviceId: string;
  role: string;
  description: string;
  statusText: string;
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }>;
  milestones: Array<{
    label: string;
    status: 'Ready' | 'Configured' | 'In Staging';
  }>;
}

const DEPARTMENT_CONFIGS: Record<string, WorkspaceConfig> = {
  'tech-records': {
    title: 'Technical Records & Quality Assurance Cell',
    badge: 'TECHNICAL RECORDS & QA',
    badgeColor: 'bg-indigo-600 text-white',
    officer: 'Flt Lt. Meera',
    serviceId: 'IAF-REC-03',
    role: 'Planner',
    description:
      'Responsible for paper-to-digital logbook digitization, Ministry of Defence Data Trust scoring (A-D verification), and immutable cryptographic audit logging.',
    statusText: 'Core Ingestion & Quality Audit Engines Active',
    quickActions: [
      {
        id: 'data-import',
        title: 'Data Import & CSV Ingestion',
        description: 'Upload and parse flight logbooks, maintenance sheets, and parts inventory CSVs with auto-cleaning.',
        icon: Database,
        accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      },
      {
        id: 'verify-queue',
        title: 'Verify-First Review Queue',
        description: 'Audit records with Grade C or D data trust flags before committing them to operational status.',
        icon: CheckSquare,
        accentColor: 'text-amber-600 bg-amber-50 border-amber-200',
      },
      {
        id: 'audit-ledger',
        title: 'Cryptographic Audit Ledger',
        description: 'Verify SHA-256 Merkle block integrity for all historical log entries and operational updates.',
        icon: Lock,
        accentColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      },
    ],
    milestones: [
      { label: 'Paper-to-Digital CSV Parser', status: 'Ready' },
      { label: 'SHA-256 Merkle Chain Verification', status: 'Ready' },
      { label: 'Automated Logbook OCR Pipeline', status: 'In Staging' },
      { label: 'Squadron QA Compliance Reports', status: 'Configured' },
    ],
  },
  'logistics-spares': {
    title: 'Logistics & Spares Depot',
    badge: 'LOGISTICS & SUPPLY CHAIN',
    badgeColor: 'bg-amber-600 text-white',
    officer: 'Sqn Ldr. Rajesh',
    serviceId: 'IAF-LOG-04',
    role: 'Planner',
    description:
      'Supervises multi-base inventory levels for critical components (e.g. HP-9042 Hydraulic Pump), external OEM supplier lead times, and +1 What-If recovery optimization.',
    statusText: 'Resource Optimizer & Multi-Base Stock Active',
    quickActions: [
      {
        id: 'resource-optimizer',
        title: 'Resource Recovery Optimizer',
        description: 'Run +1 What-If simulations to resolve parts bottlenecks and recover grounded aircraft days.',
        icon: Sliders,
        accentColor: 'text-amber-600 bg-amber-50 border-amber-200',
      },
      {
        id: 'spares-inventory',
        title: 'Depot Spares Inventory',
        description: 'Check stock levels across Base Alpha, Base Bravo, and Central Depot for Rafale and Tejas spare kits.',
        icon: Package,
        accentColor: 'text-blue-600 bg-blue-50 border-blue-200',
      },
      {
        id: 'transfers',
        title: 'Cross-Base Transit Board',
        description: 'Monitor active and queued transport sorties for expedited part reassignments.',
        icon: Truck,
        accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      },
    ],
    milestones: [
      { label: 'What-If Heuristic Decision Solver', status: 'Ready' },
      { label: 'HP-9042 Critical Spare Monitoring', status: 'Ready' },
      { label: 'Automated Supplier Reorder Trigger', status: 'In Staging' },
      { label: 'Cross-Base Transport Optimization', status: 'Configured' },
    ],
  },
  'maintenance-agency': {
    title: 'Maintenance Agency (Hangar Floor)',
    badge: 'HANGAR FLOOR & WORK ORDERS',
    badgeColor: 'bg-slate-700 text-white',
    officer: 'MWO R. Sharma',
    serviceId: 'IAF-MNT-05',
    role: 'Viewer',
    description:
      'Directs hangar bay occupancy (Heavy Depot, Line Bays), certified technician duty shifts, and strict 3-gate Ready-to-Fly pre-flight sortie inspections.',
    statusText: 'Work Order Management & Bay Allocation Active',
    quickActions: [
      {
        id: 'work-orders',
        title: 'Active Work Orders',
        description: 'Review live servicing tasks, overdue maintenance flags, and technician assignments.',
        icon: ClipboardList,
        accentColor: 'text-blue-600 bg-blue-50 border-blue-200',
      },
      {
        id: 'hangar-bays',
        title: 'Hangar Bay Allocations',
        description: 'Inspect Bay 1 (Heavy Depot), Bay 2, and Bay 3 bay occupancy, bay equipment, and turnaround times.',
        icon: Warehouse,
        accentColor: 'text-slate-700 bg-slate-100 border-slate-300',
      },
      {
        id: 'rtf-schedule',
        title: 'Ready-to-Fly Schedule Gates',
        description: 'Inspect technician sign-offs across Gate 1 (Mechanical), Gate 2 (Avionics), and Gate 3 (Command).',
        icon: CalendarCheck,
        accentColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      },
    ],
    milestones: [
      { label: 'Work Order Management Engine', status: 'Ready' },
      { label: 'Hangar Bay Capacity Matrix', status: 'Ready' },
      { label: 'Technician Skill Matrix Shift Allocator', status: 'In Staging' },
      { label: 'Automated 3-Gate Sortie Sign-off', status: 'Configured' },
    ],
  },
};

export const DepartmentSetupWorkspaceView: React.FC<DepartmentSetupWorkspaceViewProps> = ({
  departmentId,
  onNavigate,
}) => {
  const config = DEPARTMENT_CONFIGS[departmentId] || DEPARTMENT_CONFIGS['tech-records'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${config.badgeColor}`}>
                {config.badge}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {config.statusText}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {config.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {config.description}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:min-w-[240px] shrink-0 text-xs space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Assigned Personnel
            </div>
            <div className="font-bold text-slate-900">{config.officer}</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Service ID:</span>
              <span className="font-bold text-slate-700">{config.serviceId}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>RBAC Clearance:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                {config.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Launch Navigation Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Authorized Department Workspaces &amp; Tools</span>
          </h2>
          <span className="text-xs text-slate-500">
            Click any module below to launch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md p-5 rounded-2xl text-left transition-all duration-200 group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-3 ${action.accentColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                  <span>Open Tool</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Operational Directives & Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module Milestones */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Workspace Deployment Staging</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">MoD SIH Spec</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {config.milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs"
              >
                <span className="font-medium text-slate-700">{m.label}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'Ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : m.status === 'Configured'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Access Isolation Policy */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Department Silo Policy Notice</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                ENFORCED
              </span>
            </div>

            <div className="space-y-2 pt-2 text-xs text-slate-600 leading-relaxed">
              <p>
                In compliance with Ministry of Defence Air Force protocols, each operational silo operates within its own security boundary.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                <li>Access to Air Fleet Command operational map and approval gates is restricted to Fleet Commanders.</li>
                <li>Write modifications require Planner clearance ({config.serviceId}).</li>
                <li>All sessions are cryptographically logged to the SHA-256 Decision Ledger.</li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>AirDoctor Enterprise Military Suite • Ministry of Defence</span>
          </div>
        </div>
      </div>
    </div>
  );
};
