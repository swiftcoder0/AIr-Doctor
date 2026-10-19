import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Building,
  Check,
  Search,
  ChevronDown,
  Building2,
  FileSpreadsheet,
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
import iafFighterImg from '../../assets/iaf_fighter_tarmac.jpg';

interface CommandCenterViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onSelectAircraftAndNavigate: (aircraftId: string) => void;
  onNavigate: (nav: string) => void;
}

// Curated high-resolution airbase and aerospace images with fallback to bundled tarmac asset
const AIRBASE_IMAGES: Record<string, string> = {
  ambala: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
  pune: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
  sulur: 'https://images.unsplash.com/photo-1517976487588-75c13b290947?auto=format&fit=crop&w=800&q=80',
  gwalior: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=800&q=80',
  hasimara: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=800&q=80',
  leh: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
  bareilly: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e466?auto=format&fit=crop&w=800&q=80',
  jodhpur: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?auto=format&fit=crop&w=800&q=80',
  hindon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  srinagar: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80',
  tezpur: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  chabua: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
};

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
  const [airbaseSearchQuery, setAirbaseSearchQuery] = useState<string>('');
  const [airbaseCommandFilter, setAirbaseCommandFilter] = useState<string>('All Commands');
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const airbaseScrollRef = useRef<HTMLDivElement | null>(null);

  // Load live data from FastAPI or Mock Service
  const loadData = () => {
    api.getCommanderFleetMetrics().then((data) => {
      if (data) setMetrics(data);
    });
    api.getCommanderAirbases().then((data) => {
      if (data && data.length > 0) {
        setAirbases(data);
        if (!selectedBase) {
          // Default to Ambala AFS matching reference screenshot
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
    loadData();
  };

  // Filter for the All Airbases card row
  const filteredAllAirbases = useMemo(() => {
    return airbases.filter((base) => {
      const matchesCommand =
        airbaseCommandFilter === 'All Commands' || base.command === airbaseCommandFilter;
      const matchesSearch =
        airbaseSearchQuery === '' ||
        base.name.toLowerCase().includes(airbaseSearchQuery.toLowerCase()) ||
        base.code.toLowerCase().includes(airbaseSearchQuery.toLowerCase()) ||
        base.command.toLowerCase().includes(airbaseSearchQuery.toLowerCase());
      return matchesCommand && matchesSearch;
    });
  }, [airbases, airbaseCommandFilter, airbaseSearchQuery]);

  const scrollAirbases = (direction: 'left' | 'right') => {
    if (airbaseScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      airbaseScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getStatusBadge = (statusLevel: string, statusText: string) => {
    switch (statusLevel) {
      case 'critical':
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            {statusText}
          </span>
        );
      case 'warning':
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {statusText}
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            {statusText}
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {statusText}
          </span>
        );
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

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  // Format full title e.g. "Ambala Air Force Station"
  const getFullBaseTitle = (baseName?: string) => {
    if (!baseName) return 'Ambala Air Force Station';
    if (baseName.includes('AFS')) {
      return baseName.replace('AFS', 'Air Force Station');
    }
    return `${baseName} Station`;
  };

  return (
    <div className="space-y-6 text-slate-800 pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-8 z-50 p-4 bg-slate-900 border border-emerald-500/50 rounded-2xl text-xs text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Command Center</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
              OPERATIONS HQ
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet overview, airbase status & operational approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">19 Oct 2026 12:40 IST</span>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards matching Reference Image */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Aircraft */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {pendingApprovals.length || 5}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">Awaiting Approval</div>
            <button
              onClick={() => onNavigate('command-approvals')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-0.5 flex items-center gap-0.5 cursor-pointer"
            >
              <span>View approvals</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Section: Light India Map (Left) + Selected Airbase Detail Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Clean Light India Airbase Map */}
        <div className="lg:col-span-8">
          <IndiaAirbaseMap
            airbases={airbases}
            selectedBaseId={selectedBase?.id || 'ambala'}
            onSelectBase={handleAirbaseSelect}
          />
        </div>

        {/* Right Column: Selected Airbase Detail Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Airbase Banner / Thumbnail */}
            <div className="w-full h-36 rounded-xl overflow-hidden relative shadow-xs bg-slate-900 border border-slate-200/70">
              <img
                src={selectedBase ? (AIRBASE_IMAGES[selectedBase.id] || iafFighterImg) : iafFighterImg}
                alt={selectedBase?.name || 'Airbase'}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = iafFighterImg;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2.5 text-white text-[11px] font-mono font-bold drop-shadow-md">
                {selectedBase?.squadrons?.[0] || 'Strategic Operational Base'}
              </div>
            </div>

            {/* Base Header & Status Pill */}
            <div className="flex items-start justify-between gap-2 pt-1">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {getFullBaseTitle(selectedBase?.name)}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  <span>{selectedBase?.command || 'Western'} Command</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="font-mono text-slate-600">Code: {selectedBase?.code || 'AFS-AMB'}</span>
                </div>
              </div>
              <div className="shrink-0">
                {selectedBase &&
                  getStatusBadge(selectedBase.statusLevel, selectedBase.status)}
              </div>
            </div>

            {/* 4 Stat Badges in a Row */}
            <div className="grid grid-cols-4 gap-2 pt-1 pb-1">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <div className="flex items-center justify-center text-blue-600 mb-0.5">
                  <Plane className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm font-black text-slate-900">
                  {selectedBase?.totalAircraft || 12}
                </div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                  Total Jets
                </div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-center">
                <div className="flex items-center justify-center text-emerald-600 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm font-black text-emerald-900">
                  {selectedBase?.serviceable || 8}
                </div>
                <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">
                  Ready
                </div>
              </div>

              <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-200/60 text-center">
                <div className="flex items-center justify-center text-amber-600 mb-0.5">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm font-black text-amber-900">
                  {selectedBase?.underMaintenance || 3}
                </div>
                <div className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
                  Maint.
                </div>
              </div>

              <div className="p-2 rounded-xl bg-red-50/50 border border-red-200/60 text-center">
                <div className="flex items-center justify-center text-red-600 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm font-black text-red-900">
                  {selectedBase?.grounded || 1}
                </div>
                <div className="text-[9px] font-bold text-red-700 uppercase tracking-tight">
                  Attention
                </div>
              </div>
            </div>

            {/* Fleet by Type Section with Horizontal Status Bars */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wider">
                <span>Fleet by Type</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  Ready / Maint / Gnd
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedBase?.aircraftBreakdown?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-20 font-bold text-slate-800 truncate" title={item.type}>
                      {item.type}
                    </span>
                    <span className="w-5 font-bold text-slate-700 text-right">{item.total}</span>

                    {/* Multi-segment horizontal status bar */}
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                      {item.serviceable > 0 && (
                        <div
                          className="bg-emerald-500 h-full rounded-l-full"
                          style={{ width: `${(item.serviceable / item.total) * 100}%` }}
                          title={`${item.serviceable} Serviceable`}
                        />
                      )}
                      {item.maintenance > 0 && (
                        <div
                          className="bg-amber-400 h-full"
                          style={{ width: `${(item.maintenance / item.total) * 100}%` }}
                          title={`${item.maintenance} Under Maintenance`}
                        />
                      )}
                      {item.grounded > 0 && (
                        <div
                          className="bg-red-500 h-full rounded-r-full"
                          style={{ width: `${(item.grounded / item.total) * 100}%` }}
                          title={`${item.grounded} Grounded / Attention`}
                        />
                      )}
                    </div>

                    {/* Status counts on right */}
                    <div className="flex items-center gap-2 font-mono text-[11px] w-14 justify-end">
                      <span className="text-emerald-700 font-bold">{item.serviceable}</span>
                      <span className="text-amber-700 font-bold">{item.maintenance}</span>
                      <span className="text-red-700 font-bold">{item.grounded}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Primary View Full Base Details Button */}
          <button
            onClick={() => onNavigate('base-operations')}
            className="w-full mt-4 py-2.5 px-4 bg-[#0B2545] hover:bg-[#07192F] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>View Full Base Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. "All Airbases" Section Below the Map */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                All Airbases <span className="text-blue-600 font-bold">({filteredAllAirbases.length})</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Click on any airbase to view details</p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={airbaseSearchQuery}
                onChange={(e) => setAirbaseSearchQuery(e.target.value)}
                placeholder="Search airbase..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Command Dropdown */}
            <div className="relative">
              <select
                value={airbaseCommandFilter}
                onChange={(e) => setAirbaseCommandFilter(e.target.value)}
                className="py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="All Commands">All Commands</option>
                <option value="Western">Western</option>
                <option value="Northern">Northern</option>
                <option value="Central">Central</option>
                <option value="Eastern">Eastern</option>
                <option value="Southern">Southern</option>
                <option value="South Western">South Western</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Horizontal Scroll Navigation Buttons */}
            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={() => scrollAirbases('left')}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollAirbases('right')}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Horizontal Cards Row */}
        <div
          ref={airbaseScrollRef}
          className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth no-scrollbar"
        >
          {filteredAllAirbases.map((base) => {
            const isSelected = selectedBase?.id === base.id;
            const baseImg = AIRBASE_IMAGES[base.id] || iafFighterImg;

            return (
              <div
                key={base.id}
                onClick={() => handleAirbaseSelect(base)}
                className={`w-64 shrink-0 rounded-2xl p-3 border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-2 border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Airbase Thumbnail */}
                <div className="w-full h-24 rounded-xl overflow-hidden relative mb-2.5 bg-slate-900">
                  <img
                    src={baseImg}
                    alt={base.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = iafFighterImg;
                    }}
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-colors ${
                        isSelected ? 'text-blue-600' : 'text-slate-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Base Name & Command */}
                <div className="space-y-0.5">
                  <div className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                    {base.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">{base.command} Command</div>
                </div>

                {/* Aircraft Count & Status Pill */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800">
                    {base.totalAircraft} Aircraft
                  </div>
                  <div>{getStatusBadge(base.statusLevel, base.status)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Command Approvals Section Placed Below All Airbases */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black text-slate-900">Command Approvals</h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                {pendingApprovals.length} PENDING
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Operational sign-offs, spare procurement & sortie clearances requiring commander authorization
            </p>
          </div>

          <button
            onClick={() => onNavigate('command-approvals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>All Approvals</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Responsive Grid of Approvals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvals.slice(0, 6).map((app) => (
            <div
              key={app.id}
              className="p-4 bg-slate-50/80 hover:bg-blue-50/30 rounded-2xl border border-slate-200/80 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold text-slate-500">{app.id}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
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

                <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {app.title}
                </h4>

                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">{app.baseName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-600">{app.aircraft}</span>
                </div>

                <div className="mt-2 text-[10px] text-slate-600 line-clamp-2 bg-white/70 p-2 rounded-xl border border-slate-200/60">
                  {app.justification}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {app.amountOrScope}
                </span>
                <button
                  onClick={() => handleOpenApprovalModal(app)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Strategic Insights & Fleet Readiness Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trend Graph */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Fleet Readiness Trend</h3>
              <p className="text-[11px] text-slate-500">Serviceable fleet vs target threshold</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['7d', '30d', '90d'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    trendPeriod === period
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-44 w-full pt-4 flex items-end gap-2">
            {(trendPeriod === '7d'
              ? metrics?.trend7d || [
                  { day: 'Mon', readiness: 71, target: 75 },
                  { day: 'Tue', readiness: 70, target: 75 },
                  { day: 'Wed', readiness: 72, target: 75 },
                  { day: 'Thu', readiness: 73, target: 75 },
                  { day: 'Fri', readiness: 74, target: 75 },
                  { day: 'Sat', readiness: 74, target: 75 },
                  { day: 'Sun', readiness: 75, target: 75 },
                ]
              : trendPeriod === '30d'
              ? metrics?.trend30d || []
              : metrics?.trend90d || []
            ).map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] font-bold font-mono text-slate-600">
                  {point.readiness}%
                </div>
                <div className="w-full bg-slate-100 rounded-t-lg relative h-28 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all"
                    style={{ height: `${(point.readiness / 100) * 100}%` }}
                  />
                  <div
                    className="absolute w-full border-t-2 border-dashed border-emerald-500"
                    style={{ bottom: `${(point.target / 100) * 100}%` }}
                    title={`Target: ${point.target}%`}
                  />
                </div>
                <div className="text-[9px] font-semibold text-slate-500 truncate w-full text-center">
                  {point.day}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span>Current Readiness</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500" />
              <span>Target Standard (75%)</span>
            </span>
          </div>
        </div>

        {/* Strategic Insights Cards */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Strategic Insights</h3>
              <p className="text-[11px] text-slate-500">Autonomous operational recommendations</p>
            </div>
            <button
              onClick={() => onNavigate('strategic-insights')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl text-xs">
              <div className="font-bold text-emerald-900 flex items-center justify-between">
                <span>Western Command Readiness</span>
                <span className="font-mono text-[10px] font-bold text-emerald-700">+4% Recovered</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">
                Recent cross-base hydraulic module transfers to Ambala & Halwara boosted operational sortie capacity.
              </p>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs">
              <div className="font-bold text-amber-900 flex items-center justify-between">
                <span>Depot Supply Bottleneck</span>
                <span className="font-mono text-[10px] font-bold text-amber-700">3 Bases Waiting</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Lead time on APU starter generators remains critical. Approval for expedited OEM shipment recommended.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Command Approval Detail & Ledger Sign-off */}
      <CommandApprovalsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        approval={selectedApproval}
        onDecisionComplete={handleDecisionComplete}
      />

      {/* Modal: Export Report Confirmation */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Export Air Fleet Status</h3>
                <p className="text-xs text-slate-500">Export 26 airbases operational status</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate and download the cryptographic unclassified operational fleet ledger in standard CSV format, containing readiness metrics, squadron distribution and maintenance queues.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={exportSummaryCsv}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
