import React, { useState, useMemo } from 'react';
import {
  Plane,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Wrench,
  Bot,
  X,
  Send,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  FileText,
  ShieldAlert,
  Sliders,
  Check,
  Flame,
  Droplet,
  Zap,
} from 'lucide-react';
import {
  AircraftData,
  AircraftComponentData,
  FutureHours,
  ChatMessage,
} from '../../types/aircraft';
import { AircraftViewer } from '../AircraftViewer/AircraftViewer';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';

interface DigitalTwinViewProps {
  aircraftList: AircraftData[];
  selectedAircraftId: string;
  onSelectAircraft: (id: string) => void;
  searchQuery: string;
  activeNav?: string;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  aircraftList,
  selectedAircraftId,
  onSelectAircraft,
  activeNav,
}) => {
  // Navigation / Selection State
  const [selectedCompId, setSelectedCompId] = useState<string>('engine');
  const [activeTab, setActiveTab] = useState<'Overview' | 'Sensor Data' | 'AI Prediction' | 'Maintenance History'>('Overview');
  const [trendPeriod, setTrendPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '2Y'>('1Y');
  const [riskPeriod, setRiskPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '2Y'>('1Y');
  const [sensorPeriod, setSensorPeriod] = useState<'1H' | '1D' | '1W' | '1M'>('1D');
  const [selectedSensor, setSelectedSensor] = useState<string>('EGT (Exhaust Gas Temp)');
  const [activeScenario, setActiveScenario] = useState<'Conservative' | 'Standard' | 'High Usage' | 'Custom'>('Conservative');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'aircraft' | 'system'>('aircraft');

  // Modals & Drawers
  const [isCaseModalOpen, setIsCaseModalOpen] = useState<boolean>(false);

  // Synchronize tabs with department sub-navigation
  React.useEffect(() => {
    if (activeNav === 'component-analytics') {
      setActiveTab('Sensor Data');
    } else if (activeNav === 'ai-predictions') {
      setActiveTab('AI Prediction');
    } else if (activeNav === 'diagnostic-cases') {
      setIsCaseModalOpen(true);
    } else if (activeNav === 'usage-simulator') {
      setActiveTab('Overview');
      setTimeout(() => {
        const el = document.getElementById('usage-simulator-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (activeNav === 'aircraft-health' || activeNav === 'digital-twin') {
      setActiveTab('Overview');
    }
  }, [activeNav]);
  const [caseCreatedToast, setCaseCreatedToast] = useState<string | null>(null);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      timestamp: '12:40',
      text: 'AirDoctor Diagnostics Engine online. I am monitoring Snecma M88 telemetry. EGT is currently +8% above standard baseline.',
    },
  ]);

  // Current aircraft
  const currentAircraftIndex = aircraftList.findIndex((a) => a.id === selectedAircraftId);
  const currentAircraft = useMemo(() => {
    return aircraftList[currentAircraftIndex >= 0 ? currentAircraftIndex : 0] || aircraftList[0];
  }, [aircraftList, currentAircraftIndex]);

  // Selected component with fallback
  const selectedComponent = useMemo(() => {
    const found = currentAircraft.components.find((c) => c.id === selectedCompId);
    if (found) return found;
    // Fallback to first component (e.g. engine)
    return currentAircraft.components[0];
  }, [currentAircraft, selectedCompId]);

  // Handle Prev / Next Aircraft cycling
  const handlePrevAircraft = () => {
    const nextIdx = (currentAircraftIndex - 1 + aircraftList.length) % aircraftList.length;
    onSelectAircraft(aircraftList[nextIdx].id);
  };

  const handleNextAircraft = () => {
    const nextIdx = (currentAircraftIndex + 1) % aircraftList.length;
    onSelectAircraft(aircraftList[nextIdx].id);
  };

  // Submit diagnostic case
  const handleCreateCase = () => {
    setIsCaseModalOpen(false);
    setCaseCreatedToast(`Diagnostic Case #DC-2026-${Math.floor(1000 + Math.random() * 9000)} generated for ${selectedComponent.name} (${currentAircraft.code})`);
    setTimeout(() => setCaseCreatedToast(null), 5000);
  };

  // Send AI Chat Query
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: chatInput,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const reply: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Analysis for ${selectedComponent.name}: Peak temperature reached 712 °C during sortie climb. Recommended mitigation is borescope inspection of HP turbine nozzle guide vanes within 25 flight hours.`,
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 600);
  };

  // Component Selector Card metadata
  const selectorComponents = useMemo(() => {
    return [
      { id: 'engine', name: 'Engine M88', category: 'propulsion', alert: true, icon: Flame },
      { id: 'avionics', name: 'Avionics', category: 'avionics', alert: false, icon: Activity },
      { id: 'hydraulics', name: 'Hydraulic', category: 'hydraulics', alert: false, icon: Wrench },
      { id: 'fuel-system', name: 'Fuel System', category: 'fuel', alert: false, icon: Droplet },
      { id: 'landing-gear', name: 'Landing Gear', category: 'landing', alert: false, icon: Plane },
      { id: 'electrical', name: 'Electrical', category: 'electrical', alert: false, icon: Zap },
    ];
  }, []);

  return (
    <div className="space-y-5 text-slate-800 pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {caseCreatedToast && (
        <div className="fixed top-16 right-8 z-50 p-4 bg-slate-900 border border-blue-500/50 rounded-2xl text-xs text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-semibold">{caseCreatedToast}</span>
        </div>
      )}

      {/* 1. Page Header matching Reference Image */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Aircraft Health & Diagnostics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive digital twin, real-time health data, AI predictions and maintenance insights
          </p>
        </div>

        {/* Top Right Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Aircraft Selector Pill with Prev/Next arrows */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Plane className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aircraft</span>
            <button
              onClick={handlePrevAircraft}
              className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Previous Aircraft"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <select
              value={currentAircraft.id}
              onChange={(e) => onSelectAircraft(e.target.value)}
              className="font-black text-xs text-slate-900 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="rafale">Rafale R-01</option>
              <option value="tejas">Tejas T-04</option>
            </select>
            <button
              onClick={handleNextAircraft}
              className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Next Aircraft"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs text-xs font-bold text-slate-700">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">View</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value="aircraft">External</option>
              <option value="system">System Subsystems</option>
            </select>
          </div>

          {/* Operational Status Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational</span>
          </span>

          {/* Last Data Sync */}
          <div className="hidden sm:flex flex-col text-right pl-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Last data sync</span>
            <span className="text-[11px] font-mono font-semibold text-slate-700">19 Oct 2026, 12:40</span>
          </div>
        </div>
      </div>

      {/* 2. Top Section: 3D Digital Twin (Left) + Component Health & Diagnostics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Col 7 / 60%): 3D Aircraft Digital Twin & Subsystem Cards */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* 3D Canvas */}
          <AircraftViewer
            aircraft={currentAircraft}
            selectedComponent={selectedComponent}
            onSelectComponent={(comp) => setSelectedCompId(comp.id)}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels(!showLabels)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Horizontal Component Selector Cards matching reference screenshot */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {selectorComponents.map((item) => {
              const compData = currentAircraft.components.find((c) => c.id.includes(item.id) || c.category === item.category);
              const isSelected = selectedComponent.id.includes(item.id) || selectedComponent.category === item.category;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (compData) setSelectedCompId(compData.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer relative group ${
                    isSelected
                      ? item.alert
                        ? 'border-2 border-red-500 bg-red-50/20 shadow-md ring-2 ring-red-500/20'
                        : 'border-2 border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Alert Dot */}
                  {item.alert && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                  )}

                  {/* Icon illustration container */}
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-1.5 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 text-slate-700" />
                  </div>

                  {/* Name */}
                  <div className="text-[11px] font-black text-slate-800 leading-tight">
                    {item.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (Col 5 / 40%): Component Health & Diagnostics Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Component Header & Status Pill */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {selectedComponent.name.includes('M88') ? selectedComponent.name : `${selectedComponent.name} (Subsystem)`}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  <span>{currentAircraft.code}</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span>{selectedComponent.category?.toUpperCase() || 'PROPULSION'}</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="font-mono">M88-2</span>
                </div>
              </div>

              {selectedComponent.health < 75 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Critical</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Operational</span>
                </span>
              )}
            </div>

            {/* Sub-Tabs: Overview, Sensor Data, AI Prediction, Maintenance History */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {(['Overview', 'Sensor Data', 'AI Prediction', 'Maintenance History'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 4 Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Health Score */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-center flex flex-col items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Health Score</span>
                {/* Radial circular indicator */}
                <div className="relative w-12 h-12 flex items-center justify-center my-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-amber-500"
                      strokeDasharray={`${selectedComponent.health}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-black text-xs text-slate-900">{selectedComponent.health}%</span>
                </div>
                <span className="text-[10px] font-semibold text-red-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> 8% vs last mo
                </span>
              </div>

              {/* Failure Risk */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-center flex flex-col items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Failure Risk</span>
                <div className="relative w-12 h-12 flex items-center justify-center my-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-red-500"
                      strokeDasharray="32, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-black text-xs text-slate-900">32%</span>
                </div>
                <span className="text-[10px] font-semibold text-red-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> 12% vs last mo
                </span>
              </div>

              {/* Estimated RUL */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-center flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Estimated RUL</span>
                <div className="my-2">
                  <div className="flex items-center justify-center gap-1 text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-black">280 – 420 h</span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Moderate confidence</span>
              </div>

              {/* Status */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center flex flex-col justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Status</span>
                <div className="my-1.5 flex flex-col items-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mb-0.5" />
                  <span className="text-xs font-black text-amber-900">Degraded</span>
                </div>
                <span className="text-[9px] text-amber-700 font-bold">Requires inspection</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setIsCaseModalOpen(true)}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Diagnostic Case</span>
              </button>
              <button
                onClick={() => setIsCaseModalOpen(true)}
                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Key Indicators Table */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Key Indicators</span>
                <span className="text-[10px] text-slate-400 font-mono">Normal Range</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Indicator 1 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">🌡</span>
                    <span className="font-semibold text-slate-800">EGT (Exhaust Gas Temp)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">712 °C</span>
                    <span className="text-[11px] font-bold text-red-600">↑ 8%</span>
                    <span className="w-10 h-1.5 bg-red-500 rounded-full" />
                    <span className="text-[10px] font-mono text-slate-500 w-16 text-right">500 – 650</span>
                  </div>
                </div>

                {/* Indicator 2 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">〰</span>
                    <span className="font-semibold text-slate-800">Vibration (RMS)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">2.1 mm/s</span>
                    <span className="text-[11px] font-bold text-red-600">↑ 15%</span>
                    <span className="w-10 h-1.5 bg-red-500 rounded-full" />
                    <span className="text-[10px] font-mono text-slate-500 w-16 text-right">0.5 – 1.5</span>
                  </div>
                </div>

                {/* Indicator 3 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">🛢</span>
                    <span className="font-semibold text-slate-800">Oil Pressure</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">3.2 bar</span>
                    <span className="text-[11px] font-bold text-emerald-600">↓ 4%</span>
                    <span className="w-10 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-mono text-slate-500 w-16 text-right">2.8 – 4.0</span>
                  </div>
                </div>

                {/* Indicator 4 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">⛽</span>
                    <span className="font-semibold text-slate-800">Fuel Flow</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">810 kg/h</span>
                    <span className="text-[11px] font-bold text-emerald-600">↓ 2%</span>
                    <span className="w-10 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-mono text-slate-500 w-16 text-right">760 – 900</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Component Health Trend + Failure Risk Prediction + Remaining Useful Life (RUL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Component Health Trend (Engine) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-slate-900">Component Health Trend (Engine)</h3>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                {(['1M', '3M', '6M', '1Y', '2Y'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTrendPeriod(p)}
                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                      trendPeriod === p ? 'bg-blue-600 text-white font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Health Trend Chart with shaded zones */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 140">
                {/* Shaded Bands */}
                <rect x="0" y="0" width="320" height="40" fill="#ECFDF5" opacity="0.6" />
                <rect x="0" y="40" width="320" height="45" fill="#FEFCE8" opacity="0.7" />
                <rect x="0" y="85" width="320" height="55" fill="#FFF1F2" opacity="0.6" />

                {/* Boundary lines */}
                <line x1="0" y1="40" x2="320" y2="40" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                <line x1="0" y1="85" x2="320" y2="85" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />

                {/* Trend line */}
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points="10,12 40,18 70,26 100,34 130,42 160,50 190,56 220,62 250,68 280,72 310,76"
                />

                {/* Trend Points */}
                {[
                  [10, 12], [40, 18], [70, 26], [100, 34], [130, 42],
                  [160, 50], [190, 56], [220, 62], [250, 68], [280, 72], [310, 76]
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                ))}

                {/* X-axis labels */}
                <text x="10" y="135" fontSize="8" fill="#94A3B8">Nov</text>
                <text x="70" y="135" fontSize="8" fill="#94A3B8">Jan</text>
                <text x="130" y="135" fontSize="8" fill="#94A3B8">Mar</text>
                <text x="190" y="135" fontSize="8" fill="#94A3B8">May</text>
                <text x="250" y="135" fontSize="8" fill="#94A3B8">Jul</text>
                <text x="300" y="135" fontSize="8" fill="#94A3B8">Oct</text>
              </svg>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Health Score
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-100 border border-emerald-300" /> Normal Range
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 border-t border-amber-400 border-dashed" /> Caution
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 border-t border-rose-400 border-dashed" /> Critical
            </span>
          </div>
        </div>

        {/* Card 2: Failure Risk Prediction */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-slate-900">Failure Risk Prediction</h3>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                {(['1M', '3M', '6M', '1Y', '2Y'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setRiskPeriod(p)}
                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                      riskPeriod === p ? 'bg-blue-600 text-white font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Failure Risk Line Chart */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 380 140">
                {/* Grid lines */}
                <line x1="30" y1="20" x2="370" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="30" y1="50" x2="370" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="30" y1="80" x2="370" y2="80" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="30" y1="110" x2="370" y2="110" stroke="#E2E8F0" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="8" y="23" fontSize="8" fill="#94A3B8">80%</text>
                <text x="8" y="53" fontSize="8" fill="#94A3B8">60%</text>
                <text x="8" y="83" fontSize="8" fill="#94A3B8">40%</text>
                <text x="8" y="113" fontSize="8" fill="#94A3B8">0%</text>

                {/* Uncertainty Range polygon */}
                <polygon
                  points="210,95 250,86 290,75 330,62 370,50 370,88 330,95 290,100 250,103 210,95"
                  fill="#FEE2E2"
                  opacity="0.75"
                />

                {/* Historical Risk line (Blue) */}
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points="35,108 70,106 105,104 140,102 175,99 210,95"
                />

                {/* Predicted Risk line (Red) */}
                <polyline
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="4 2"
                  points="210,95 250,90 290,83 330,74 370,62"
                />

                {/* Points */}
                {[
                  [35, 108], [70, 106], [105, 104], [140, 102], [175, 99], [210, 95]
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                ))}
                {[
                  [250, 90], [290, 83], [330, 74], [370, 62]
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
                ))}

                {/* X-axis flight hours */}
                <text x="35" y="126" fontSize="8" fill="#94A3B8">0</text>
                <text x="105" y="126" fontSize="8" fill="#94A3B8">400</text>
                <text x="175" y="126" fontSize="8" fill="#94A3B8">800</text>
                <text x="250" y="126" fontSize="8" fill="#94A3B8">1,000</text>
                <text x="330" y="126" fontSize="8" fill="#94A3B8">1,400 h</text>
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 font-bold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Historical Risk
            </span>
            <span className="flex items-center gap-1 font-bold text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-600" /> Predicted Risk
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 rounded-xs bg-red-100 border border-red-300" /> Uncertainty Range
            </span>
          </div>
        </div>

        {/* Card 3: Remaining Useful Life (RUL) with Confidence Meter */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1">
                <h3 className="text-xs font-black text-slate-900">Remaining Useful Life (RUL)</h3>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              {/* Circular confidence meter */}
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="78, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-[9px] font-black text-slate-900">78%</div>
              </div>
            </div>

            {/* Big RUL number */}
            <div className="mt-1">
              <div className="text-xl font-black text-slate-900">280 – 420 hours</div>
            </div>

            {/* Horizontal Color Gauge Bar */}
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 relative">
                <div
                  className="absolute -top-1 w-2.5 h-4 bg-slate-900 border-2 border-white rounded-sm shadow-md"
                  style={{ left: '35%' }}
                  title="Current RUL position: 350h"
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-1">
                <span>0</span>
                <span>500</span>
                <span>750</span>
                <span>1,000 h</span>
              </div>
            </div>

            {/* Top Contributing Factors */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight block">
                Top Contributing Factors
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] truncate">High EGT trend</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-red-500 rounded-full" />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-red-600">+35%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] truncate">Increased vibration</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[60%] h-full bg-red-500 rounded-full" />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-red-600">+22%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] truncate">Recent usage pattern</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[45%] h-full bg-red-500 rounded-full" />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-red-600">+18%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] truncate">Oil pressure variation</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[30%] h-full bg-emerald-500 rounded-full" />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-600">-12%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Section: Sensor Data (Engine) + Usage Scenario Simulator + Recent Alerts & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sensor Data (Engine) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-slate-900">Sensor Data (Engine)</h3>
                <select
                  value={selectedSensor}
                  onChange={(e) => setSelectedSensor(e.target.value)}
                  className="bg-slate-100 text-[10px] font-bold text-slate-700 rounded-lg px-2 py-0.5 border border-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="EGT (Exhaust Gas Temp)">EGT (Exhaust Gas Temp)</option>
                  <option value="Vibration (RMS)">Vibration (RMS)</option>
                  <option value="Oil Pressure">Oil Pressure</option>
                  <option value="Fuel Flow">Fuel Flow</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                {(['1H', '1D', '1W', '1M'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSensorPeriod(p)}
                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                      sensorPeriod === p ? 'bg-blue-600 text-white font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Waveform Chart with Peak Anomaly Highlight */}
            <div className="h-40 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 130">
                <defs>
                  <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid */}
                <line x1="25" y1="20" x2="310" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="25" y1="55" x2="310" y2="55" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="25" y1="90" x2="310" y2="90" stroke="#F1F5F9" strokeWidth="1" />

                {/* Y labels */}
                <text x="5" y="23" fontSize="8" fill="#94A3B8">800</text>
                <text x="5" y="58" fontSize="8" fill="#94A3B8">600</text>
                <text x="5" y="93" fontSize="8" fill="#94A3B8">400</text>

                {/* Waveform area fill */}
                <path
                  d="M 30,75 Q 50,85 70,72 T 110,70 T 150,30 T 190,65 T 230,60 T 270,70 T 310,65 L 310,105 L 30,105 Z"
                  fill="url(#sensorGrad)"
                />

                {/* Waveform line */}
                <path
                  d="M 30,75 Q 50,85 70,72 T 110,70 T 150,30 T 190,65 T 230,60 T 270,70 T 310,65"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Anomaly Dot at peak (150, 30) */}
                <circle cx="150" cy="30" r="4.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" className="animate-ping opacity-75" />
                <circle cx="150" cy="30" r="3.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* X labels */}
                <text x="30" y="120" fontSize="8" fill="#94A3B8">00:00</text>
                <text x="85" y="120" fontSize="8" fill="#94A3B8">04:00</text>
                <text x="140" y="120" fontSize="8" fill="#94A3B8">08:00</text>
                <text x="195" y="120" fontSize="8" fill="#94A3B8">12:00</text>
                <text x="250" y="120" fontSize="8" fill="#94A3B8">16:00</text>
                <text x="295" y="120" fontSize="8" fill="#94A3B8">20:00</text>
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 font-bold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Sensor Reading
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-blue-100" /> Normal Range
            </span>
            <span className="flex items-center gap-1 font-bold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-600" /> Anomaly (712 °C)
            </span>
          </div>
        </div>

        {/* Usage Scenario Simulator */}
        <div id="usage-simulator-section" className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-black text-slate-900">Usage Scenario Simulator</h3>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                {(['Conservative', 'Standard', 'High Usage', 'Custom'] as const).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setActiveScenario(sc)}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activeScenario === sc
                        ? 'bg-white text-blue-700 font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-2.5">
              Simulate future condition based on different operational sortie profiles.
            </p>

            {/* Matrix comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <th className="py-1 px-2">Scenario</th>
                    <th className="py-1 px-2">Usage</th>
                    <th className="py-1 px-2">Predicted Health</th>
                    <th className="py-1 px-2">Failure Risk</th>
                    <th className="py-1 px-2">Estimated RUL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-bold text-slate-900">Current (Now)</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">0 h</td>
                    <td className="py-1.5 px-2 font-bold text-amber-600">68%</td>
                    <td className="py-1.5 px-2 font-bold text-red-600">32%</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">280 – 420 h</td>
                  </tr>
                  <tr className={activeScenario === 'Conservative' ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}>
                    <td className="py-1.5 px-2 font-bold text-slate-900">Conservative</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">+50 h</td>
                    <td className="py-1.5 px-2 font-bold text-amber-600">63%</td>
                    <td className="py-1.5 px-2 font-bold text-red-600">38%</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">230 – 360 h</td>
                  </tr>
                  <tr className={activeScenario === 'Standard' ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}>
                    <td className="py-1.5 px-2 font-bold text-slate-900">Standard</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">+100 h</td>
                    <td className="py-1.5 px-2 font-bold text-amber-600">58%</td>
                    <td className="py-1.5 px-2 font-bold text-red-600">46%</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">180 – 300 h</td>
                  </tr>
                  <tr className={activeScenario === 'High Usage' ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}>
                    <td className="py-1.5 px-2 font-bold text-slate-900">High Usage</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">+200 h</td>
                    <td className="py-1.5 px-2 font-bold text-red-600">48%</td>
                    <td className="py-1.5 px-2 font-bold text-red-600">62%</td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">120 – 220 h</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
            SIMULATED PROFILE • NON-CERTIFIED ADVISORY ESTIMATE
          </div>
        </div>

        {/* Recent Alerts & Events */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900">Recent Alerts & Events</h3>
              <button
                onClick={() => setIsCaseModalOpen(true)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Alert 1 */}
              <div
                onClick={() => setSelectedCompId('engine')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50/40 border border-slate-200/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-bold text-slate-900 text-xs">High EGT detected</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">2h ago</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 pl-3.5">
                  EGT above normal range for 5 min during climb.
                </p>
              </div>

              {/* Alert 2 */}
              <div
                onClick={() => setSelectedCompId('engine')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50/40 border border-slate-200/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-slate-900 text-xs">Vibration increase</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">6h ago</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 pl-3.5">
                  RMS vibration 40% higher than baseline.
                </p>
              </div>

              {/* Alert 3 */}
              <div
                onClick={() => setSelectedCompId('engine')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-bold text-slate-900 text-xs">Oil pressure fluctuation</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1d ago</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 pl-3.5">
                  Intermittent drop in return oil line.
                </p>
              </div>

              {/* Alert 4 */}
              <div
                onClick={() => setSelectedCompId('engine')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="font-bold text-slate-900 text-xs">Usage milestone</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">3d ago</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 pl-3.5">
                  500 flight hours completed since overhaul.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Contextual AI Assistant Pill on Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowAiDrawer(!showAiDrawer)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl font-bold text-xs transition-all hover:scale-105 cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>AirDoctor Diagnostics AI</span>
        </button>
      </div>

      {/* Contextual AI Assistant Slide-over Drawer */}
      {showAiDrawer && (
        <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col justify-between">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <div>
                <h4 className="font-black text-xs">Engineering Diagnostic AI</h4>
                <p className="text-[10px] text-slate-400">Target: {currentAircraft.code} • {selectedComponent.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAiDrawer(false)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white ml-6 rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 mr-6 rounded-tl-xs border border-slate-200/80'
                }`}
              >
                <div className="text-[9px] opacity-70 mb-0.5 font-mono">{msg.timestamp}</div>
                <div>{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask telemetry diagnostic question..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSendChat}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create Diagnostic Case */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create Diagnostic Case</h3>
                  <p className="text-xs text-slate-500">Initiate technical inspection work order</p>
                </div>
              </div>
              <button
                onClick={() => setIsCaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Aircraft & Target Component</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {currentAircraft.code} ({currentAircraft.name}) — {selectedComponent.name}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                  Critical EGT
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Recommended Inspection Scope</label>
                <textarea
                  defaultValue={`Urgent borescope examination of High Pressure Turbine stage 1 blades. Verify thermal barrier coating integrity following elevated 712 °C EGT excursion.`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Target Hangar Bay</label>
                  <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                    <option>Bay Alpha 01 (Engine Overhaul Cell)</option>
                    <option>Bay Alpha 02 (Quick-Turn Line)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Lead Specialist</label>
                  <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                    <option>MWO R. Sharma (Turbofan Propulsion)</option>
                    <option>JWO V. Rao (Avionics & Radar)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCaseModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit to Hangar Floor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
