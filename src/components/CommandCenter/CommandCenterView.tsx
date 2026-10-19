import React, { useState, useEffect } from 'react';
import {
  Plane,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Download,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Building,
  Check,
} from 'lucide-react';
import {
  CommanderAirbase,
  CommandApprovalItem,
  CommanderFleetMetrics,
  BaseId,
} from '../../types/aircraft';
import { api } from '../../services/apiClient';
import { IndiaAirbaseMap } from './IndiaAirbaseMap';
import { CommandApprovalsModal } from './CommandApprovalsModal';

interface CommandCenterViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onSelectAircraftAndNavigate: (aircraftId: string) => void;
  onNavigate: (nav: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  onSelectAircraftAndNavigate,
  onNavigate,
}) => {
  const [metrics, setMetrics] = useState<CommanderFleetMetrics | null>(null);
  const [airbases, setAirbases] = useState<CommanderAirbase[]>([]);
  const [approvals, setApprovals] = useState<CommandApprovalItem[]>([]);
  const [selectedBase, setSelectedBase] = useState<CommanderAirbase | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<CommandApprovalItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [tableCommandFilter, setTableCommandFilter] = useState<string>('All Commands');
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load data from FastAPI or Mock Service
  const loadData = () => {
    api.getCommanderFleetMetrics().then((data) => {
      if (data) setMetrics(data);
    });
    api.getCommanderAirbases().then((data) => {
      if (data && data.length > 0) {
        setAirbases(data);
        if (!selectedBase) {
          // Default to Ambala AFS as seen in mockup
          const ambala = data.find((b) => b.id === 'ambala') || data[0];
          setSelectedBase(ambala);
        }
      }
    });
    api.getCommanderApprovals().then((data) => {
      if (data) setApprovals(data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAirbaseSelect = (base: CommanderAirbase) => {
    setSelectedBase(base);
  };

  const handleOpenApprovalModal = (approval: CommandApprovalItem) => {
    setSelectedApproval(approval);
    setIsModalOpen(true);
  };

  const handleDecisionComplete = (res: any) => {
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 5000);
    // Reload live approvals & metrics
    loadData();
  };

  const filteredTableBases = airbases.filter((b) => {
    if (tableCommandFilter === 'All Commands') return true;
    return b.command === tableCommandFilter;
  });

  const getStatusBadgeClass = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in_progress':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'normal':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const exportSummaryCsv = () => {
    let csv = 'Airbase,Command,Total Jets,Serviceable,Maintenance,Grounded,Readiness %\n';
    airbases.forEach((b) => {
      csv += `"${b.name}","${b.command}",${b.totalAircraft},${b.serviceable},${b.underMaintenance},${b.grounded},${b.readinessPct}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IAF_Fleet_Status_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Trend data points based on period
  const currentTrendPoints =
    trendPeriod === '7d'
      ? metrics?.trend7d || []
      : trendPeriod === '30d'
      ? metrics?.trend30d || []
      : metrics?.trend90d || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-800">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-8 z-50 p-4 bg-slate-900 border border-emerald-500/50 rounded-2xl text-xs text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header matching Reference Image */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              OPERATIONS HQ
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet overview, airbase status & operational approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timestamp Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">19 Oct 2026 12:40 IST</span>
          </div>

          {/* Export Report Action */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards matching Reference Image */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Aircraft */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {metrics?.totalAircraft || 142}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">Total Aircraft</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
              {metrics?.totalAircraftChange || '↑ 2%'} vs last month
            </div>
          </div>
        </div>

        {/* Serviceable */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {metrics?.serviceable || 98}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">Serviceable</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {metrics?.serviceablePct || 69}% fleet readiness
            </div>
          </div>
        </div>

        {/* Under Maintenance */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {metrics?.underMaintenance || 32}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">Under Maintenance</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {metrics?.underMaintenancePct || 22}% undergoing work
            </div>
          </div>
        </div>

        {/* Grounded / Attention */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {metrics?.grounded || 12}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">Grounded / Attention</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {metrics?.groundedPct || 8}% critical issues
            </div>
          </div>
        </div>

        {/* Awaiting Approval */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {metrics?.awaitingApproval || approvals.filter((a) => a.status === 'PENDING').length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">Awaiting Approval</div>
            <button
              onClick={() => onNavigate('command-approvals')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-0.5 flex items-center gap-0.5"
            >
              <span>View approvals</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: India Airbase Map (58%) + Selected Base Details (21%) + Pending Approvals (21%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive India Airbase Map */}
        <div className="lg:col-span-7">
          <IndiaAirbaseMap
            airbases={airbases}
            selectedBaseId={selectedBase?.id || 'ambala'}
            onSelectBase={handleAirbaseSelect}
          />
        </div>

        {/* Selected Base Details Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedBase?.command || 'Western'} Command
                </span>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {selectedBase?.name || 'Ambala AFS'}
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  Code: {selectedBase?.code || 'AFS-AMB'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(
                  selectedBase?.statusLevel || 'warning'
                )}`}
              >
                {selectedBase?.status || 'Spares Needed'}
              </span>
            </div>

            {/* Tactical Base Thumbnail / Badge */}
            <div className="my-3.5 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Station Commander</div>
                <div className="text-xs font-bold text-white mt-0.5">{selectedBase?.commanderName}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Last Inspection: {selectedBase?.lastInspection}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-emerald-400">
                  {selectedBase?.readinessPct}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono">READINESS</div>
              </div>
            </div>

            {/* Aircraft Breakdown by Type */}
            <div className="space-y-2 mt-3">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Assigned Squadrons & Jets
              </div>
              {selectedBase?.aircraftBreakdown.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{item.type}</span>
                    <span className="font-mono text-slate-600">
                      <strong>{item.serviceable}</strong>/{item.total} ready
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(item.serviceable / item.total) * 100}%` }}
                    />
                    <div
                      className="bg-orange-500 h-full"
                      style={{ width: `${(item.maintenance / item.total) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(item.grounded / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Active Blockers */}
            {selectedBase?.blockers && selectedBase.blockers.length > 0 && (
              <div className="mt-3.5 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Active Blockers
                </div>
                {selectedBase.blockers.map((blocker, i) => (
                  <div
                    key={i}
                    className="p-2 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-snug"
                  >
                    {blocker}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('base-operations')}
            className="w-full mt-4 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <span>View Base Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pending Command Approvals Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">Command Approvals</h3>
                <p className="text-[10px] text-slate-500">Operational sign-offs</p>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                {approvals.filter((a) => a.status === 'PENDING').length} PENDING
              </span>
            </div>

            {/* List of Approval Cards */}
            <div className="space-y-2.5 mt-3 overflow-y-auto max-h-[420px] pr-0.5">
              {approvals.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/80 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{app.id}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        app.priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : app.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {app.priority}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{app.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{app.baseName}</div>
                  <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] font-semibold text-slate-600 truncate mr-2">
                      {app.aircraft}
                    </span>
                    <button
                      onClick={() => handleOpenApprovalModal(app)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 shrink-0"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('command-approvals')}
            className="w-full mt-3 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <span>All Approvals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Row: Airbases Summary Table (50%) + Fleet Readiness Trend (30%) + Key Insights (20%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Panel 1: Airbases Summary Table */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Airbases Summary</h3>
              <p className="text-[10px] text-slate-500">Fleet distribution across commands</p>
            </div>
            {/* Command Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                'All Commands',
                'Western',
                'Northern',
                'Central',
                'Eastern',
                'Southern',
                'South Western',
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => setTableCommandFilter(cmd)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors shrink-0 ${
                    tableCommandFilter === cmd
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto mt-3 max-h-[300px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="py-2 px-3 rounded-l-lg">Airbase</th>
                  <th className="py-2 px-2">Command</th>
                  <th className="py-2 px-2 text-center">Total</th>
                  <th className="py-2 px-2 text-center">Serviceable</th>
                  <th className="py-2 px-2 text-center">Maint</th>
                  <th className="py-2 px-2 text-center">Readiness</th>
                  <th className="py-2 px-3 rounded-r-lg text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTableBases.map((base) => {
                  const isSelected = selectedBase?.id === base.id;
                  return (
                    <tr
                      key={base.id}
                      onClick={() => handleAirbaseSelect(base)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{base.name}</span>
                      </td>
                      <td className="py-2 px-2 text-slate-500 text-[11px]">{base.command}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold">{base.totalAircraft}</td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-700 font-bold">
                        {base.serviceable}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-orange-700">
                        {base.underMaintenance}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="font-mono font-bold text-slate-900">{base.readinessPct}%</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                            base.statusLevel
                          )}`}
                        >
                          {base.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Fleet Readiness Trend */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">Fleet Readiness Trend</h3>
                <p className="text-[10px] text-slate-500">Readiness vs 75% Target Line</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTrendPeriod(period)}
                    className={`px-2 py-0.5 rounded ${
                      trendPeriod === period ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    {period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Readiness Line Chart */}
            <div className="mt-3 relative h-36 w-full">
              <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                {/* Background gridlines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="0" y1="110" x2="300" y2="110" stroke="#E2E8F0" strokeWidth="0.8" />

                {/* 75% Target Threshold (Dashed Amber/Emerald Line) */}
                <line
                  x1="0"
                  y1="45"
                  x2="300"
                  y2="45"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
                <text x="230" y="40" fill="#10B981" fontSize="9" fontWeight="700">
                  Target 75%
                </text>

                {/* Actual Readiness Trend Curve */}
                <path
                  d="M 10 75 Q 50 68, 100 70 T 190 60 T 290 55"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {currentTrendPoints.map((pt, idx) => {
                  const x = 15 + idx * (270 / Math.max(1, currentTrendPoints.length - 1));
                  const y = 110 - (pt.readiness / 100) * 80;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x={x} y="125" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="600">
                        {pt.day.slice(0, 5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Readiness by Aircraft Type Progress Bars */}
            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Readiness by Aircraft Type
              </div>
              {metrics?.readinessByType.map((item) => (
                <div key={item.type} className="text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{item.type}</span>
                    <span className="font-mono font-bold text-slate-900">{item.readiness}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.readiness >= 75 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${item.readiness}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Key Insights */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 leading-tight">Key Insights</h3>
              <p className="text-[10px] text-slate-500">Autonomous operational analytics</p>
            </div>

            <div className="space-y-3 mt-3">
              {metrics?.keyInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    insight.tone === 'warning'
                      ? 'bg-amber-50/70 border-amber-200/80'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">{insight.title}</span>
                    <span
                      className={`text-xs font-black ${
                        insight.tone === 'warning' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {insight.metric}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{insight.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('strategic-insights')}
            className="w-full mt-4 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Deep Strategic Insights</span>
          </button>
        </div>
      </div>

      {/* Review & Decision Modal */}
      <CommandApprovalsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        approval={selectedApproval}
        onDecisionComplete={handleDecisionComplete}
      />

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" /> Export Fleet Command Report
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate an official Indian Air Force operational readiness report containing all 26 airbases,
              assigned aircraft, serviceable rates, and active depot bottlenecks.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={exportSummaryCsv}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download Airbases Summary CSV
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Operational Briefing
              </button>
            </div>
            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowExportModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
