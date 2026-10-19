import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Bell,
  Plane,
  AlertTriangle,
  ClipboardList,
  Truck,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  Building2,
  Wrench,
  Package,
  Layers,
  Database,
  ShieldAlert,
  Info,
  X,
  Check,
  TrendingUp,
  Calendar,
  Sparkles,
  Share2,
  FileSpreadsheet,
  Cpu,
} from 'lucide-react';
import {
  LogisticsInventoryItem,
  LogisticsKpiSummary,
  MaterialRequestItem,
  SparesTransferItem,
  ProcurementOrderItem,
  StockMovementItem,
  CreateMaterialRequest,
  CreateSparesTransferRequest,
} from '../../types/aircraft';
import { api } from '../../services/apiClient';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';
import { StockAvailabilityMap } from './StockAvailabilityMap';
import { LogisticsNoticeModal } from './LogisticsNoticeModal';

const NOTICE_STORAGE_KEY = 'airdoctor_logistics_notice_dismissed';

interface LogisticsDashboardViewProps {
  onNavigate?: (tab: string) => void;
  activeNav?: string;
  onLogDecision?: () => void;
}

export const LogisticsDashboardView: React.FC<LogisticsDashboardViewProps> = ({
  onNavigate,
  activeNav,
  onLogDecision,
}) => {
  // 1. Notice Modal State
  const [isNoticeOpen, setIsNoticeOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(NOTICE_STORAGE_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  const handleDismissNotice = () => {
    setIsNoticeOpen(false);
    try {
      sessionStorage.setItem(NOTICE_STORAGE_KEY, 'true');
    } catch {}
  };

  // 2. Active Tab State matching reference screenshot tabs:
  // Inventory, Requests, Transfers, Procurement, Movement History, Sources
  const [activeTab, setActiveTab] = useState<string>('Inventory');

  // Synchronize activeNav from sidebar
  useEffect(() => {
    if (activeNav === 'spares-inventory') {
      setActiveTab('Inventory');
    } else if (activeNav === 'material-requests') {
      setActiveTab('Requests');
    } else if (activeNav === 'transfers') {
      setActiveTab('Transfers');
    } else if (activeNav === 'procurement') {
      setActiveTab('Procurement');
    } else if (activeNav === 'stock-movement') {
      setActiveTab('Movement History');
    } else if (activeNav === 'suppliers-sources') {
      setActiveTab('Sources');
    } else if (activeNav === 'logistics-overview' || activeNav === 'logistics-spares') {
      setActiveTab('Inventory');
    }
  }, [activeNav]);

  // 3. KPI State
  const [kpis, setKpis] = useState<LogisticsKpiSummary>({
    total_inventory_items: 4230,
    low_stock_items: 28,
    pending_requests: 12,
    transfers_in_progress: 7,
    approved_orders: 19,
    is_demo_data: true,
  });

  // 4. Inventory List & Filter State
  const [inventory, setInventory] = useState<LogisticsInventoryItem[]>([]);
  const [selectedPart, setSelectedPart] = useState<LogisticsInventoryItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [aircraftFilter, setAircraftFilter] = useState<string>('All Aircraft');
  const [locationFilter, setLocationFilter] = useState<string>('All Locations');
  const [statusFilter, setStatusFilter] = useState<string>('Stock Status');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 5. Requests, Transfers, Procurement, Movements State
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestItem[]>([]);
  const [transfers, setTransfers] = useState<SparesTransferItem[]>([]);
  const [procurements, setProcurements] = useState<ProcurementOrderItem[]>([]);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);

  // 6. Action Toasts & Modals
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState<boolean>(false);
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState<boolean>(false);

  // Form states for modals
  const [reserveQty, setReserveQty] = useState<number>(1);
  const [linkedWo, setLinkedWo] = useState<string>('WO-1044');
  const [transferDest, setTransferDest] = useState<string>('AFS Hasimara');
  const [newReqPartNum, setNewReqPartNum] = useState<string>('ENG-774A');
  const [newReqAircraft, setNewReqAircraft] = useState<string>('Rafale B-124');
  const [newReqPriority, setNewReqPriority] = useState<string>('Urgent');

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Load all initial data
  const fetchData = async () => {
    try {
      const [kpisRes, invRes, reqRes, trfRes, poRes, movRes] = await Promise.all([
        api.getLogisticsKpis(),
        api.getLogisticsInventory({
          category: categoryFilter,
          aircraft: aircraftFilter,
          location: locationFilter,
          stock_status: statusFilter,
          search: searchQuery,
        }),
        api.getMaterialRequests(),
        api.getSparesTransfers(),
        api.getProcurementOrders(),
        api.getStockMovements(),
      ]);

      setKpis(kpisRes);
      setInventory(invRes);
      setMaterialRequests(reqRes);
      setTransfers(trfRes);
      setProcurements(poRes);
      setMovements(movRes);

      // Default select ENG-774A if available, otherwise first item
      if (!selectedPart && invRes.length > 0) {
        const defaultPart = invRes.find((i) => i.part_number === 'ENG-774A') || invRes[0];
        setSelectedPart(defaultPart);
      }
    } catch {
      // Fallback
      setKpis(mockAirDoctorService.getLogisticsKpis());
      const inv = mockAirDoctorService.getLogisticsInventory({
        category: categoryFilter,
        aircraft: aircraftFilter,
        location: locationFilter,
        stock_status: statusFilter,
        search: searchQuery,
      });
      setInventory(inv);
      setMaterialRequests(mockAirDoctorService.getMaterialRequests());
      setTransfers(mockAirDoctorService.getSparesTransfers());
      setProcurements(mockAirDoctorService.getProcurementOrders());
      setMovements(mockAirDoctorService.getStockMovements());
      if (!selectedPart && inv.length > 0) {
        const defaultPart = inv.find((i) => i.part_number === 'ENG-774A') || inv[0];
        setSelectedPart(defaultPart);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, aircraftFilter, locationFilter, statusFilter, searchQuery]);

  // Handle Reserve Part
  const handleReservePart = async () => {
    if (!selectedPart) return;
    try {
      const updated = await api.reserveLogisticsPart({
        inventory_id: selectedPart.id,
        part_number: selectedPart.part_number,
        quantity: reserveQty,
        linked_request_or_wo: linkedWo,
        notes: `Tactical flight-line reservation for ${selectedPart.applicable_aircraft}`,
      });
      setSelectedPart(updated);
      showToast(`Reserved ${reserveQty}x ${selectedPart.part_number} for ${linkedWo}. Decision logged to Ledger.`);
      setIsReserveModalOpen(false);
      fetchData();
      if (onLogDecision) onLogDecision();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reserve part.', 'error');
    }
  };

  // Handle Submit Transfer
  const handleCreateTransfer = async () => {
    if (!selectedPart) return;
    try {
      await api.createSparesTransfer({
        part_number: selectedPart.part_number,
        part_name: selectedPart.description,
        quantity: 1,
        source_location: selectedPart.location,
        destination_location: transferDest,
        transport_mode: 'IAF Air Transit (C-130J)',
        notes: `Expedited transit to support ${selectedPart.applicable_aircraft} readiness`,
      });
      showToast(`Transfer scheduled: ${selectedPart.part_number} from ${selectedPart.location} to ${transferDest}.`);
      setIsTransferModalOpen(false);
      fetchData();
      if (onLogDecision) onLogDecision();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create transfer.', 'error');
    }
  };

  // Handle Submit New Material Request
  const handleCreateNewRequest = async () => {
    try {
      await api.createMaterialRequest({
        aircraft: newReqAircraft,
        part_number: newReqPartNum,
        part_name: selectedPart?.part_number === newReqPartNum ? selectedPart.description : 'Aviation Assembly',
        quantity: 1,
        required_by: '25 Aug 2025',
        priority: newReqPriority,
        destination_base: selectedPart?.location || 'AFS Hasimara',
        linked_work_order_id: linkedWo,
      });
      showToast(`Requisition submitted for ${newReqAircraft} (${newReqPartNum}). Priority: ${newReqPriority}`);
      setIsNewRequestModalOpen(false);
      fetchData();
      if (onLogDecision) onLogDecision();
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit request.', 'error');
    }
  };

  // Select a Supply Option
  const handleSelectSupplyOption = (source: string) => {
    setTransferDest(selectedPart?.location || 'AFS Hasimara');
    setIsTransferModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto pb-12 select-none font-sans text-slate-800">
      {/* 1. Bilingual Notice Modal */}
      <LogisticsNoticeModal
        isOpen={isNoticeOpen}
        onClose={handleDismissNotice}
        onContinue={handleDismissNotice}
      />

      {/* Action Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-18 right-8 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Header & Breadcrumb matching reference image */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <span className="hover:text-slate-700 cursor-pointer">Logistics &amp; Spares</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Depot Emblem */}
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                Logistics &amp; Spares
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Right Part. Right Place. Less Downtime.
              </p>
            </div>
          </div>
        </div>

        {/* Right Search, Aircraft Status, and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search part number, name, NSN..."
              className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 w-64 shadow-2xs"
            />
          </div>

          {/* New Request Button */}
          <button
            type="button"
            onClick={() => setIsNewRequestModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Request</span>
          </button>

          {/* Info Modal Re-open Button */}
          <button
            type="button"
            onClick={() => setIsNoticeOpen(true)}
            title="About Existing Systems & Integration"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <Info className="w-4 h-4 text-blue-600" />
            <span className="hidden lg:inline text-[11px]">Systems Notice</span>
          </button>

          {/* Aircraft Status Card top-right matching reference image */}
          <div className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-1.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-7 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              <Plane className="w-5 h-5 text-slate-600 -rotate-45" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-tight">
                Rafale B-124
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top 4 KPI Cards matching reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inventory Items */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Total Inventory Items</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.total_inventory_items.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px]">
                &uarr; 3%
              </span>
              <span className="text-slate-400 font-medium">vs last month</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Low Stock Items */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Low Stock Items</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.low_stock_items}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
              <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px]">
                &uarr; 8%
              </span>
              <span className="text-slate-400 font-medium">need attention</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending Requests */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Pending Requests</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.pending_requests}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
              <span className="inline-flex items-center px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[10px]">
                &darr; 4 urgent
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Transfers in Progress */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Transfers in Progress</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.transfers_in_progress}
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              ETA updates active
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Bar matching reference screenshot */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto text-xs">
        {['Inventory', 'Requests', 'Transfers', 'Procurement', 'Movement History', 'Sources'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 5. TAB 1: Inventory Main View (Table on Left + Part Details on Right) */}
      {activeTab === 'Inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Table Section: Spare Parts Inventory (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Spare Parts Inventory</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search, filter and view real-time stock across bases, depots and suppliers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewRequestModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Part</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1 text-xs">
              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option>All Categories</option>
                <option>Engine</option>
                <option>Radar</option>
                <option>Landing Gear</option>
                <option>Hydraulics</option>
                <option>Avionics</option>
                <option>Mechanical</option>
              </select>

              {/* Aircraft Dropdown */}
              <select
                value={aircraftFilter}
                onChange={(e) => setAircraftFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option>All Aircraft</option>
                <option>Rafale</option>
                <option>Tejas</option>
                <option>Su-30MKI</option>
                <option>MiG-21</option>
                <option>C-130J</option>
              </select>

              {/* Location Dropdown */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option>All Locations</option>
                <option>AFS Ambala</option>
                <option>BRD Sulur</option>
                <option>AFS Hasimara</option>
                <option>AFS Pune</option>
                <option>ASP Chandigarh</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option>Stock Status</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Critically Low</option>
                <option>Out of Stock</option>
              </select>

              {/* Search Inside Table */}
              <div className="col-span-2 sm:col-span-4 md:col-span-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter parts..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3 w-8">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </th>
                    <th className="py-2.5 px-3">Part Number</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Applicable Aircraft</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-center">Usable Qty</th>
                    <th className="py-2.5 px-3 text-center">Reserved</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No spare parts match your filters.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const isSelected = selectedPart?.id === item.id || selectedPart?.part_number === item.part_number;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedPart(item)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/60 font-semibold border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setSelectedPart(item)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {item.part_number}
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {item.description}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold">
                              <Plane className="w-3 h-3 text-slate-500" />
                              <span>{item.applicable_aircraft}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {item.location}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900">
                            {item.usable_qty}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">
                            {item.reserved_qty}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'In Stock'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'Low Stock'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : item.status === 'Critically Low'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.status === 'In Stock'
                                    ? 'bg-emerald-500'
                                    : item.status === 'Low Stock'
                                    ? 'bg-amber-500'
                                    : item.status === 'Critically Low'
                                    ? 'bg-orange-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span>{item.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPart(item);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Section: Part Details Panel (4 cols) matching reference image */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
            {selectedPart ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Part Details
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedPart.usable_qty > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedPart.usable_qty > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{selectedPart.usable_qty > 0 ? 'Available' : 'Out of Stock'}</span>
                  </span>
                </div>

                {/* Part Identifiers */}
                <div>
                  <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
                    {selectedPart.part_number}
                  </div>
                  <div className="text-xs font-bold text-slate-600 mt-0.5">
                    {selectedPart.description}
                  </div>
                </div>

                {/* Schematic / Hardware Illustration */}
                <div className="w-full h-36 bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-3 relative border border-slate-800 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-400 mb-1">
                    <Cpu className="w-9 h-9" />
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-300">
                    AVIONIC ECU ENCLOSURE
                  </div>
                  <div className="text-[9px] text-slate-500">
                    MIL-STD-1553B / STANAG 3838 COMPLIANT
                  </div>
                </div>

                {/* Specifications Grid matching screenshot */}
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Applicable Aircraft</span>
                    <span className="font-bold text-slate-900">{selectedPart.applicable_aircraft}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Category</span>
                    <span className="font-bold text-slate-900">{selectedPart.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">NSN / OEM</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedPart.nsn_oem || '774A-IND'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Usable Quantity</span>
                    <span className="font-bold text-emerald-700">{selectedPart.usable_qty}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Reserved Quantity</span>
                    <span className="font-bold text-amber-700">{selectedPart.reserved_qty}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Location</span>
                    <span className="font-bold text-slate-900">{selectedPart.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Condition</span>
                    <span className="font-bold text-slate-900">{selectedPart.condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Last Inspection</span>
                    <span className="font-bold text-slate-900">{selectedPart.last_inspection || '12 Aug 2025'}</span>
                  </div>
                </div>

                {/* Compatibility tags */}
                {selectedPart.compatibility && selectedPart.compatibility.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[11px] block mb-1">Authorised Compatibility</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPart.compatibility.map((c, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsReserveModalOpen(true)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Reserve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferDest('AFS Hasimara');
                      setIsTransferModalOpen(true);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer text-center"
                  >
                    Request Transfer
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select a part to view specifications and action options.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. BOTTOM ROW: 3 Cards (Stock Availability Map, Recent Requests, Supply/Transfer Options) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* Bottom Card 1: Stock Availability Across Locations Map (4 cols) */}
        <div className="lg:col-span-4 min-h-[340px]">
          <StockAvailabilityMap
            selectedPart={selectedPart}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
            inventoryList={inventory}
          />
        </div>

        {/* Bottom Card 2: Recent Requests Table (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 tracking-tight">
                Recent Requests
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('Requests')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2 px-2.5">Req ID</th>
                    <th className="py-2 px-2.5">Aircraft</th>
                    <th className="py-2 px-2.5">Part</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5 text-right">Required By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialRequests.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-900">
                        {req.id}
                      </td>
                      <td className="py-2 px-2.5 text-slate-700 font-medium">
                        {req.aircraft}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-600">
                        {req.part_number}
                      </td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : req.status === 'Urgent'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-500 whitespace-nowrap text-[11px]">
                        {req.required_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Synchronized with Maintenance Work Orders</span>
            <span className="font-semibold text-slate-600">5 Recent Records</span>
          </div>
        </div>

        {/* Bottom Card 3: Supply / Transfer Options (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="mb-3">
              <h3 className="text-xs font-black text-slate-900 tracking-tight">
                Supply / Transfer Options
              </h3>
              <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                {selectedPart ? selectedPart.part_number : 'ENG-774A'}
              </div>
              <p className="text-[10px] text-slate-400">
                {selectedPart?.usable_qty === 0
                  ? 'No local stock available. Suggested options:'
                  : 'Alternative supply and transfer channels across IAF depots:'}
              </p>
            </div>

            {/* 3 Option Cards matching reference image */}
            <div className="space-y-2.5">
              {/* Option 1: Transfer from AFS Ambala */}
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Transfer from AFS Ambala
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Qty: 2 available • ETA: 14 hours
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectSupplyOption('AFS Ambala')}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Select
                </button>
              </div>

              {/* Option 2: From BRD Sulur (Repaired) */}
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      From BRD Sulur (Repaired)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Qty: 1 (serviceable) • ETA: 36 hours
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectSupplyOption('BRD Sulur')}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Select
                </button>
              </div>

              {/* Option 3: Procure from OEM (HAL) */}
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Procure from OEM (HAL)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Lead time: 10–15 days • Qty: On order
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectSupplyOption('OEM HAL')}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Select
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Estimates labelled for planning. Formal approvals require Commander sign-off.
          </div>
        </div>
      </div>

      {/* 7. TAB 2: Full Material Requests */}
      {activeTab === 'Requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Material Requisitions &amp; Demands
              </h2>
              <p className="text-xs text-slate-500">
                Squadron flightline demands and depot allocation requests.
              </p>
            </div>
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800"
            >
              + New Request
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50">
                  <th className="py-2.5 px-3">Req ID</th>
                  <th className="py-2.5 px-3">Aircraft</th>
                  <th className="py-2.5 px-3">Part Number</th>
                  <th className="py-2.5 px-3">Part Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Linked WO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.id}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{r.aircraft}</td>
                    <td className="py-3 px-3 font-mono">{r.part_number}</td>
                    <td className="py-3 px-3 text-slate-600">{r.part_name}</td>
                    <td className="py-3 px-3 text-center font-bold">{r.quantity}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">{r.destination_base}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{r.linked_work_order_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. TAB 3: Transfers */}
      {activeTab === 'Transfers' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Cross-Base Spares Transfers
              </h2>
              <p className="text-xs text-slate-500">
                Inter-airbase transit routes via IAF air transport and ground convoys.
              </p>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800"
            >
              + Initiate Transfer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50">
                  <th className="py-2.5 px-3">Transfer ID</th>
                  <th className="py-2.5 px-3">Part</th>
                  <th className="py-2.5 px-3">Source Location</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Mode of Transport</th>
                  <th className="py-2.5 px-3">ETA</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{t.id}</td>
                    <td className="py-3 px-3 font-mono">{t.part_number} ({t.part_name})</td>
                    <td className="py-3 px-3">{t.source_location}</td>
                    <td className="py-3 px-3">{t.destination_location}</td>
                    <td className="py-3 px-3 text-center font-bold">{t.quantity}</td>
                    <td className="py-3 px-3 text-slate-600">{t.transport_mode}</td>
                    <td className="py-3 px-3 font-bold text-purple-700">{t.eta}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. TAB 4: Procurement */}
      {activeTab === 'Procurement' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              OEM &amp; Vendor Procurement Orders
            </h2>
            <p className="text-xs text-slate-500">
              Long lead-time supplier requisitions (HAL, Safran, BEL, Thales).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50">
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Part</th>
                  <th className="py-2.5 px-3">Vendor / OEM</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Lead Time</th>
                  <th className="py-2.5 px-3">Contract Ref</th>
                  <th className="py-2.5 px-3">Est Cost</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {procurements.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.id}</td>
                    <td className="py-3 px-3 font-mono">{p.part_number} ({p.part_name})</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{p.supplier}</td>
                    <td className="py-3 px-3 text-center font-bold">{p.quantity}</td>
                    <td className="py-3 px-3 text-slate-600">{p.lead_time}</td>
                    <td className="py-3 px-3 font-mono text-[11px]">{p.contract_ref}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{p.est_total_cost}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. TAB 5: Movement History */}
      {activeTab === 'Movement History' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Stock Movement &amp; Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Cryptographically timestamped receipts, reservations, dispatches, and returns.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50">
                  <th className="py-2.5 px-3">Movement ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Part</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Origin &rarr; Destination</th>
                  <th className="py-2.5 px-3">Officer / Depot</th>
                  <th className="py-2.5 px-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.id}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{m.timestamp}</td>
                    <td className="py-3 px-3 font-mono">{m.part_number}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{m.quantity}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {m.origin} {m.destination && m.destination !== m.origin ? `→ ${m.destination}` : ''}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{m.responsible_user}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-blue-600">{m.linked_reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11. TAB 6: Suppliers / Sources & IMMOLS / e-MMS References */}
      {activeTab === 'Sources' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-5">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Existing Digital Systems &amp; External Suppliers
            </h2>
            <p className="text-xs text-slate-500">
              Documented public reference to official IAF inventory and maintenance systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IMMOLS Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900">
                    IMMOLS (Integrated Material Management Online System)
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Not configured
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Official automated inventory and material management system utilized by the Indian Air Force. AirDoctor maintains a reserved future interface connector for authorized data exchange.
                </p>
              </div>
              <a
                href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=1959466"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>MoD Official PIB Release</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* e-MMS Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900">
                    e-MMS (Electronic Maintenance Management System)
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Not configured
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Official electronic maintenance management system tracking work orders, technician shifts, and overhaul logs. AirDoctor connects via mock data fallback until an authorized connector is verified.
                </p>
              </div>
              <a
                href="https://www.cgda.nic.in/ifa/manuals/airforce.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>CGDA IFA Air Force Manual</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Compliance &amp; Air-Gap Safeguard</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              AirDoctor strictly operates in air-gapped demo mode using local database records. No external unauthorized API calls or telemetry leaks are permitted.
            </p>
          </div>
        </div>
      )}

      {/* 12. Reserve Part Modal */}
      {isReserveModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                Reserve Part for Work Order
              </h3>
              <button onClick={() => setIsReserveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Part Number</label>
                <div className="font-mono font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedPart.part_number} — {selectedPart.description}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Quantity to Reserve</label>
                <input
                  type="number"
                  min={1}
                  max={selectedPart.usable_qty || 1}
                  value={reserveQty}
                  onChange={(e) => setReserveQty(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Usable stock available at {selectedPart.location}: {selectedPart.usable_qty} units
                </span>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Linked Work Order / Demand</label>
                <input
                  type="text"
                  value={linkedWo}
                  onChange={(e) => setLinkedWo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReserveModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReservePart}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. Transfer Part Modal */}
      {isTransferModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                Request Cross-Base Transfer
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Part to Transfer</label>
                <div className="font-mono font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedPart.part_number} — {selectedPart.description}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Source Depot / Airbase</label>
                <div className="font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedPart.location}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Destination Base</label>
                <select
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option>AFS Hasimara</option>
                  <option>AFS Ambala</option>
                  <option>BRD Sulur</option>
                  <option>AFS Pune</option>
                  <option>ASP Chandigarh</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Transport Corridor</label>
                <div className="text-[11px] text-slate-600 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                  IAF Air Transit (C-130J Hercules / An-32) • Estimated ETA: 14–18 hours
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTransfer}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Submit Transfer Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. New Material Request Modal */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                New Squadron Requisition
              </h3>
              <button onClick={() => setIsNewRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Target Aircraft</label>
                <select
                  value={newReqAircraft}
                  onChange={(e) => setNewReqAircraft(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option>Rafale B-124</option>
                  <option>Rafale R-01</option>
                  <option>Tejas T-04</option>
                  <option>Su-30MKI SB-112</option>
                  <option>MiG-21 M-12</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Requested Part Number</label>
                <select
                  value={newReqPartNum}
                  onChange={(e) => setNewReqPartNum(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                >
                  <option value="ENG-774A">ENG-774A — Engine Control Unit</option>
                  <option value="RBE2-0012">RBE2-0012 — Radar LRU</option>
                  <option value="LG-3301">LG-3301 — Landing Gear Actuator</option>
                  <option value="HYD-2209">HYD-2209 — Hydraulic Pump</option>
                  <option value="AV-5510">AV-5510 — Avionics Module</option>
                  <option value="BRK-9087">BRK-9087 — Brake Disc</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Requisition Priority</label>
                <select
                  value={newReqPriority}
                  onChange={(e) => setNewReqPriority(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option>Urgent</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Routine</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewRequest}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Submit Requisition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
