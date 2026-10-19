import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plane,
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Download,
  Users,
  Warehouse,
  Package,
  ShieldCheck,
  Calendar,
  History,
  Truck,
  Layers,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  FileCheck,
  Info,
  Maximize2,
  Eye,
  X,
  ZoomIn,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import {
  MaintenanceWorkOrderItem,
  MaintenanceKpiSummary,
  TechnicianRosterItem,
  HangarBayStatusItem,
  UpdateStageRequest,
  InspectionSignOffRequest,
  ConfirmPartReceiptRequest,
} from '../../types/aircraft';
import { UpdateProgressModal } from './UpdateProgressModal';
import { InspectionSignOffModal } from './InspectionSignOffModal';
import { PartReceiptModal } from './PartReceiptModal';
import tejasHangarImg from '../../assets/tejas_hangar.jpg';
import iafFighterImg from '../../assets/iaf_fighter_tarmac.jpg';

interface MaintenanceControlCentreViewProps {
  activeNav: string;
  onNavigate: (routeId: string) => void;
  onLogDecision?: (entry: any) => void;
  currentRole?: string;
  selectedBaseId?: string;
}

export const MaintenanceControlCentreView: React.FC<MaintenanceControlCentreViewProps> = ({
  activeNav,
  onNavigate,
  onLogDecision,
  currentRole = 'Engineer',
  selectedBaseId = 'afs-ambala',
}) => {
  // State
  const [kpis, setKpis] = useState<MaintenanceKpiSummary | null>(null);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrderItem[]>([]);
  const [selectedWoId, setSelectedWoId] = useState<string>('WO-1042');
  const [tableFilter, setTableFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [technicians, setTechnicians] = useState<TechnicianRosterItem[]>([]);
  const [hangarBays, setHangarBays] = useState<HangarBayStatusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState<boolean>(false);
  const [isPartReceiptModalOpen, setIsPartReceiptModalOpen] = useState<boolean>(false);
  const [selectedPartForReceipt, setSelectedPartForReceipt] = useState<any>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [kpiData, woData, techData, bayData] = await Promise.all([
          apiClient.getMaintenanceKpis(),
          apiClient.getMaintenanceWorkOrders(),
          apiClient.getMaintenanceTechnicians(),
          apiClient.getMaintenanceBays(),
        ]);
        if (mounted) {
          setKpis(kpiData);
          setWorkOrders(woData);
          setTechnicians(techData);
          setHangarBays(bayData);
          if (woData.length > 0 && !woData.find((w: MaintenanceWorkOrderItem) => w.id === selectedWoId)) {
            setSelectedWoId(woData[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching maintenance data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Currently selected work order
  const selectedWorkOrder = useMemo(() => {
    return workOrders.find((w) => w.id === selectedWoId) || workOrders[0];
  }, [workOrders, selectedWoId]);

  // Robust aircraft image resolver with automatic fallbacks
  const getAircraftImage = (wo?: MaintenanceWorkOrderItem | null) => {
    if (!wo) return tejasHangarImg;
    const model = `${wo.aircraft} ${wo.aircraft_model || ''}`.toLowerCase();
    if (
      model.includes('rafale') ||
      model.includes('su-30') ||
      model.includes('mirage') ||
      model.includes('flanker')
    ) {
      return iafFighterImg;
    }
    return tejasHangarImg;
  };

  // Filtered work orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      // Table tab filter
      if (tableFilter === 'In Progress' && wo.status !== 'In Progress') return false;
      if (tableFilter === 'Awaiting Parts' && !wo.current_stage.toLowerCase().includes('awaiting')) return false;
      if (tableFilter === 'Inspection' && wo.status !== 'Inspection') return false;
      if (tableFilter === 'Completed' && wo.status !== 'Completed') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const combined = `${wo.id} ${wo.aircraft} ${wo.aircraft_model} ${wo.issue} ${wo.assigned_team} ${wo.current_stage}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [workOrders, tableFilter, searchQuery]);

  // Handlers
  const handleUpdateStage = async (
    targetStageIndex: number,
    stageName: string,
    notes: string,
    responsible: string
  ) => {
    if (!selectedWorkOrder) return;
    const updated = await apiClient.updateMaintenanceStage(
      selectedWorkOrder.id,
      {
        work_order_id: selectedWorkOrder.id,
        target_stage_index: targetStageIndex,
        stage_name: stageName,
        notes,
        responsible_person: responsible,
        actual_time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      },
      currentRole
    );

    setWorkOrders((prev) => prev.map((w: MaintenanceWorkOrderItem) => (w.id === updated.id ? updated : w)));
  };

  const handleConfirmPartReceipt = async (req: ConfirmPartReceiptRequest) => {
    if (!selectedWorkOrder) return;
    const updated = await apiClient.confirmMaintenancePartReceipt(selectedWorkOrder.id, req, currentRole);
    setWorkOrders((prev) => prev.map((w: MaintenanceWorkOrderItem) => (w.id === updated.id ? updated : w)));
  };

  const handleSignOff = async (req: InspectionSignOffRequest) => {
    if (!selectedWorkOrder) return;
    const updated = await apiClient.recordMaintenanceInspectionSignOff(selectedWorkOrder.id, req, currentRole);
    setWorkOrders((prev) => prev.map((w: MaintenanceWorkOrderItem) => (w.id === updated.id ? updated : w)));
  };

  // Helper styles
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'inspection':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'delayed':
      case 'awaiting parts':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 flex items-center justify-center shadow-md shadow-amber-900/10">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Maintenance Control Centre
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Hangar Floor Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage assigned repairs, track progress and complete maintenance workflows
            </p>
          </div>
        </div>

        {/* Global Action / Sub-navigation pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => onNavigate('maintenance-overview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeNav === 'maintenance-overview' || activeNav === 'maintenance-agency'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('assigned-work-orders')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeNav === 'assigned-work-orders' || activeNav === 'work-orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Work Orders
          </button>
          <button
            onClick={() => onNavigate('repair-workflow')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeNav === 'repair-workflow'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Workflow
          </button>
          <button
            onClick={() => onNavigate('technicians-bays')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeNav === 'technicians-bays' || activeNav === 'hangar-bays'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Techs &amp; Bays
          </button>
        </div>
      </div>

      {/* 2. Top 5 Metric / KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Assigned Work Orders */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
              {kpis?.assigned_delta || '+2'}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis?.assigned_work_orders || 12}</div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">Assigned Work Orders</div>
          <div className="text-[11px] text-slate-400">Under Maintenance</div>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis?.in_progress || 6}</div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">In Progress</div>
          <div className="text-[11px] text-slate-400">Active jobs</div>
        </div>

        {/* Card 3: Awaiting Parts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis?.awaiting_parts || 3}</div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">Awaiting Parts</div>
          <div className="text-[11px] text-slate-400">Blocked by spares</div>
        </div>

        {/* Card 4: Ready for Inspection */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis?.ready_for_inspection || 2}</div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">Ready for Inspection</div>
          <div className="text-[11px] text-slate-400">Maintenance complete</div>
        </div>

        {/* Card 5: Overdue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis?.overdue || 1}</div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">Overdue</div>
          <div className="text-[11px] text-slate-400">Exceeds estimated time</div>
        </div>
      </div>

      {/* 3. Main Dashboard Layout (Grid with Left Work Orders/Timeline & Right Detail Panel) */}
      {(activeNav === 'maintenance-overview' ||
        activeNav === 'maintenance-agency' ||
        activeNav === 'assigned-work-orders' ||
        activeNav === 'work-orders' ||
        activeNav === 'repair-workflow' ||
        activeNav === 'parts-materials' ||
        activeNav === 'inspection-signoff' ||
        activeNav === 'documents-reports' ||
        activeNav === 'activity-history') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Work Orders Table & Workflow Timeline */}
          <div className="lg:col-span-8 space-y-5">
            {/* Assigned Work Orders Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Assigned Work Orders</h2>
                  <span className="text-xs text-slate-400">({filteredWorkOrders.length})</span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  {['All', 'In Progress', 'Awaiting Parts', 'Inspection', 'Completed'].map((pill) => {
                    const count =
                      pill === 'All'
                        ? workOrders.length
                        : pill === 'In Progress'
                        ? workOrders.filter((w) => w.status === 'In Progress').length
                        : pill === 'Awaiting Parts'
                        ? workOrders.filter((w) => w.current_stage.includes('Awaiting')).length
                        : pill === 'Inspection'
                        ? workOrders.filter((w) => w.status === 'Inspection').length
                        : workOrders.filter((w) => w.status === 'Completed').length;

                    return (
                      <button
                        key={pill}
                        onClick={() => setTableFilter(pill)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          tableFilter === pill
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {pill} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">WO ID</th>
                      <th className="py-2.5 px-3">Aircraft</th>
                      <th className="py-2.5 px-3">Issue / Work Scope</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Current Stage</th>
                      <th className="py-2.5 px-3">ETA</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredWorkOrders.map((wo) => {
                      const isSelected = wo.id === selectedWoId;
                      return (
                        <tr
                          key={wo.id}
                          onClick={() => setSelectedWoId(wo.id)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {wo.id}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-800">
                            {wo.aircraft}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">
                            {wo.issue}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadgeClass(
                                wo.priority
                              )}`}
                            >
                              {wo.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                wo.current_stage.includes('Awaiting')
                                  ? 'bg-amber-100 text-amber-800'
                                  : wo.current_stage.includes('Testing')
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : wo.current_stage.includes('Inspection')
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {wo.current_stage}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-blue-600 font-bold">
                            {wo.eta}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                                wo.status
                              )}`}
                            >
                              {wo.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right text-slate-400 hover:text-slate-600">
                            <ChevronRight className="w-4 h-4 inline-block" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance Workflow Timeline Card */}
            {selectedWorkOrder && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Maintenance Workflow – {selectedWorkOrder.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      7-stage sequential progress timeline with recorded milestones and blocker gates
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Update Progress
                  </button>
                </div>

                {/* 7-Stage Horizontal Timeline */}
                <div className="relative py-2 overflow-x-auto">
                  <div className="flex items-start justify-between min-w-[700px] relative px-4">
                    {/* Connecting line behind circles */}
                    <div className="absolute top-[26px] left-10 right-10 h-0.5 bg-slate-200 z-0">
                      {/* Active green line progress */}
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${((selectedWorkOrder.stage_index - 1) / 6) * 100}%`,
                        }}
                      ></div>
                    </div>

                    {selectedWorkOrder.stages.map((stage) => {
                      const isCompleted = stage.status === 'completed';
                      const isActive = stage.status === 'active';
                      const isBlocked = stage.status === 'blocked';
                      const isUpcoming = stage.status === 'upcoming';

                      return (
                        <div
                          key={stage.step}
                          className="flex flex-col items-center text-center relative z-10 w-24 group"
                        >
                          {/* Plane icon indicator over circle */}
                          <div
                            className={`mb-1 transition-transform group-hover:-translate-y-0.5 ${
                              isCompleted || isActive
                                ? 'text-emerald-600'
                                : isBlocked
                                ? 'text-amber-500'
                                : 'text-slate-300'
                            }`}
                          >
                            <Plane className="w-3.5 h-3.5 transform -rotate-45" />
                          </div>

                          {/* Numbered Step Circle */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                              isCompleted
                                ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                                : isActive
                                ? 'bg-blue-600 text-white ring-4 ring-blue-50 animate-pulse'
                                : isBlocked
                                ? 'bg-amber-500 text-white ring-4 ring-amber-50'
                                : 'bg-white border-2 border-slate-300 text-slate-500'
                            }`}
                          >
                            {isCompleted ? '✓' : stage.step}
                          </div>

                          {/* Stage Name */}
                          <div className="mt-2 text-[11px] font-bold text-slate-900 leading-tight">
                            {stage.name}
                          </div>

                          {/* Time / Status description */}
                          <div className="mt-1 text-[10px] text-slate-500">
                            {stage.actual_time && (
                              <span className="text-emerald-700 font-semibold block">
                                {stage.actual_time}
                              </span>
                            )}
                            {stage.expected_time && (
                              <span
                                className={`block font-semibold ${
                                  isBlocked ? 'text-amber-700' : 'text-slate-500'
                                }`}
                              >
                                {stage.expected_time}
                              </span>
                            )}
                            {isUpcoming && !stage.expected_time && (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blocker alert if active */}
                {selectedWorkOrder.blocking_items.length > 0 && (
                  <div className="mt-5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900">Active Workflow Blocker: </span>
                        <span className="text-amber-800">
                          {selectedWorkOrder.blocking_items[0].name} ({selectedWorkOrder.delay_reason})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('logistics-spares')}
                      className="text-amber-900 font-bold underline hover:text-amber-700 flex items-center gap-1 shrink-0"
                    >
                      View in Logistics <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Selected Work Order Detail Panel */}
          {selectedWorkOrder && (
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                {/* Header with WO ID & Badges */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">{selectedWorkOrder.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadgeClass(
                          selectedWorkOrder.priority
                        )}`}
                      >
                        {selectedWorkOrder.priority} Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-0.5">
                      <Plane className="w-3.5 h-3.5 text-blue-600" />
                      <span>{selectedWorkOrder.aircraft}</span>
                      <span className="text-slate-400 font-normal">({selectedWorkOrder.aircraft_model})</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                      selectedWorkOrder.status
                    )}`}
                  >
                    {selectedWorkOrder.status}
                  </span>
                </div>

                {/* Aircraft Image Preview - Clickable to open full inspection lightbox */}
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  title="Click to expand hangar inspection view"
                  className="my-3 rounded-xl overflow-hidden border border-slate-200 relative aspect-video bg-slate-900 cursor-pointer group shadow-xs hover:border-blue-400 transition-all bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${getAircraftImage(selectedWorkOrder)}')`,
                  }}
                >
                  <img
                    src={getAircraftImage(selectedWorkOrder)}
                    onError={(e) => {
                      // Prevent ugly broken image icon; CSS background-image renders cleanly
                      e.currentTarget.style.display = 'none';
                    }}
                    alt={selectedWorkOrder.aircraft}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/10 group-hover:from-slate-950/90 transition-all pointer-events-none z-10" />

                  {/* Badges */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-mono pointer-events-none">
                    <span className="px-2 py-0.5 bg-slate-900/85 backdrop-blur-xs rounded font-bold border border-white/10">
                      {selectedWorkOrder.assigned_bay}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-900/85 text-blue-200 backdrop-blur-xs rounded font-bold border border-blue-400/20">
                      {selectedWorkOrder.aircraft}
                    </span>
                  </div>

                  {/* Enlarge pill on hover */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-xs rounded-lg text-white text-[10px] font-semibold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3" />
                    <span>View Image</span>
                  </div>
                </div>

                {/* 2-Column Meta Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Issue</span>
                    <span className="font-semibold text-slate-800 leading-tight">
                      {selectedWorkOrder.issue}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Team</span>
                    <span className="font-semibold text-slate-800 leading-tight">
                      {selectedWorkOrder.assigned_team}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Opened</span>
                    <span className="font-semibold text-slate-700">
                      {selectedWorkOrder.opened_date}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Duration</span>
                    <span className="font-semibold text-slate-700">
                      {selectedWorkOrder.estimated_duration}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Completion</span>
                    <span className="font-semibold text-blue-700 font-mono">
                      {selectedWorkOrder.expected_completion}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Linked Requests</span>
                    <span className="font-semibold text-slate-700">
                      {selectedWorkOrder.linked_requests || 'None'}
                    </span>
                  </div>
                </div>

                {/* Current Stage Card */}
                <div className="my-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
                      Current Stage
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-900">
                      Expected: 21 Oct 2026, 10:00
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-md bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-amber-950">
                        {selectedWorkOrder.current_stage}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5 leading-tight">
                        {selectedWorkOrder.delay_reason || 'Work proceeding on schedule.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blocking Items */}
                {selectedWorkOrder.blocking_items.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Blocking Items
                    </div>
                    {selectedWorkOrder.blocking_items.map((blk) => (
                      <div
                        key={blk.id}
                        className="flex items-center justify-between p-2 bg-red-50/60 border border-red-200/60 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-red-900 font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span>{blk.name}</span>
                        </div>
                        <button
                          onClick={() => onNavigate('logistics-spares')}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 cursor-pointer"
                        >
                          View in Logistics →
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Next Action */}
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Next Action
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {selectedWorkOrder.next_action}
                  </p>
                </div>

                {/* Action Buttons (Matches Reference Screenshot) */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsUpdateModalOpen(true)}
                      className="py-2.5 px-3 bg-[#3F200C] hover:bg-[#2c1607] text-amber-50 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-amber-900/30"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Update Progress
                    </button>
                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      View Full Details
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSignOffModalOpen(true)}
                      className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Inspection Sign-Off
                    </button>
                    <button
                      onClick={() => onNavigate('aircraft-health')}
                      title="Open in 3D Aircraft Health & Diagnostics"
                      className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      3D Twin →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Bottom Row: Required Parts, Related Documents & Activity Log */}
      {selectedWorkOrder && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Required Parts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900">
                Required Parts for {selectedWorkOrder.id}
              </h4>
              <button
                onClick={() => onNavigate('logistics-spares')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                Logistics Depot →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-2">Part Number</th>
                    <th className="pb-2">Part Name</th>
                    <th className="pb-2 text-center">Req</th>
                    <th className="pb-2 text-center">Recv</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedWorkOrder.required_parts.map((p) => (
                    <tr
                      key={p.part_number}
                      onClick={() => {
                        setSelectedPartForReceipt(p);
                        setIsPartReceiptModalOpen(true);
                      }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      title="Click to confirm part receipt"
                    >
                      <td className="py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.part_number}
                      </td>
                      <td className="py-2.5 text-slate-700 truncate max-w-[110px]">
                        {p.part_name}
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-800">
                        {p.required_qty}
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-800">
                        {p.received_qty}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 italic text-center">
              Click any part row to record hangar receipt &amp; unblock work.
            </div>
          </div>

          {/* Card 2: Related Documents */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900">Related Documents</h4>
              <button
                onClick={() => onNavigate('tech-records')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                Tech Records →
              </button>
            </div>

            <div className="space-y-2">
              {selectedWorkOrder.related_documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-slate-800 truncate">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {doc.file_type} • {doc.file_size}
                      </div>
                    </div>
                  </div>
                  <button
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                    title="Download document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Activity Log */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900">Activity Log</h4>
              <span className="text-[10px] text-slate-400">Decision Ledger Verified</span>
            </div>

            <div className="space-y-2.5">
              {selectedWorkOrder.activity_log.slice(0, 4).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    {act.icon_type === 'dispatch' ? (
                      <Truck className="w-3 h-3 text-amber-600" />
                    ) : act.icon_type === 'inspection' || act.icon_type === 'signoff' ? (
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 leading-tight">{act.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {act.timestamp} • {act.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Sub-Views: Technicians & Bays Tab View */}
      {(activeNav === 'technicians-bays' || activeNav === 'hangar-bays') && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Technicians Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Specialist Technicians Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Certified Airframe, Propulsion, Hydraulics and Avionics ground engineering specialists
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                {technicians.length} Technicians On Roster
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {technicians.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{t.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{t.badge_number}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'On Job'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs space-y-1">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Trade: </span>
                      <span className="font-semibold text-slate-700">{t.trade}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Shift: </span>
                      <span className="text-slate-600">{t.shift}</span>
                    </div>
                    {t.assigned_work_order && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned: </span>
                        <span className="font-bold text-blue-600">
                          {t.assigned_work_order} ({t.assigned_aircraft})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                    {t.qualifications.map((q, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-medium text-slate-600"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hangar Bays Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-indigo-600" />
                  Hangar Bays &amp; Environmental Status
                </h3>
                <p className="text-xs text-slate-500">
                  Bay allocation, heavy depot slots, and airframe compatibility rules
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                {hangarBays.filter((b) => b.status === 'Occupied').length} of {hangarBays.length} Bays Occupied
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {hangarBays.map((bay) => (
                <div
                  key={bay.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{bay.name}</div>
                      <div className="text-[11px] text-slate-500">{bay.bay_type}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bay.status === 'Occupied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {bay.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs space-y-1.5">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Occupied Aircraft: </span>
                      <span className="font-bold text-slate-800">
                        {bay.occupied_by || 'None (Empty Slot)'}
                      </span>
                    </div>
                    {bay.active_job && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Active Work: </span>
                        <span className="text-slate-700">{bay.active_job}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Free Slot ETA: </span>
                      <span className="font-mono text-blue-600 font-semibold">{bay.estimated_free_time}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Compatible Types:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {bay.compatible_aircraft.map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedWorkOrder && (
        <>
          <UpdateProgressModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            workOrder={selectedWorkOrder}
            onUpdate={handleUpdateStage}
            currentRole={currentRole}
          />

          <InspectionSignOffModal
            isOpen={isSignOffModalOpen}
            onClose={() => setIsSignOffModalOpen(false)}
            workOrder={selectedWorkOrder}
            onSubmitSignOff={handleSignOff}
            currentRole={currentRole}
          />

          <PartReceiptModal
            isOpen={isPartReceiptModalOpen}
            onClose={() => {
              setIsPartReceiptModalOpen(false);
              setSelectedPartForReceipt(null);
            }}
            workOrder={selectedWorkOrder}
            part={selectedPartForReceipt}
            onConfirmReceipt={handleConfirmPartReceipt}
            currentRole={currentRole}
          />

          {/* Aircraft Hangar Full Inspection Lightbox Modal */}
          {isLightboxOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {selectedWorkOrder.aircraft} ({selectedWorkOrder.aircraft_model})
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {selectedWorkOrder.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadgeClass(
                            selectedWorkOrder.priority
                          )}`}
                        >
                          {selectedWorkOrder.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Hangar Floor Visual Inspection • {selectedWorkOrder.assigned_bay} • Lead: {selectedWorkOrder.assigned_tech}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLightboxOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body: Large Image */}
                <div
                  className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[380px] bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('${getAircraftImage(selectedWorkOrder)}')`,
                  }}
                >
                  <img
                    src={getAircraftImage(selectedWorkOrder)}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    alt={selectedWorkOrder.aircraft}
                    className="max-h-[62vh] w-auto max-w-full object-contain relative z-0"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                    <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg text-xs font-mono text-slate-200 border border-white/10">
                      Work Scope: <span className="font-bold text-amber-300">{selectedWorkOrder.issue}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg text-xs font-mono text-slate-200 border border-white/10">
                      Stage: <span className="font-bold text-emerald-400">{selectedWorkOrder.current_stage}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-slate-300">
                    <span className="text-slate-400">Assigned Team:</span> <span className="text-white font-medium">{selectedWorkOrder.assigned_team}</span> • <span className="text-slate-400">Target ETA:</span> <span className="font-mono text-blue-400 font-bold">{selectedWorkOrder.eta}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setIsLightboxOpen(false);
                        onNavigate('aircraft-health');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plane className="w-4 h-4" />
                      Open 3D Diagnostics Twin
                    </button>
                    <button
                      onClick={() => setIsLightboxOpen(false)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
