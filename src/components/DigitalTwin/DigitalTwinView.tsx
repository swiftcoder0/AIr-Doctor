import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  Bot,
  Send,
  X,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import {
  AircraftData,
  AircraftComponentData,
  FutureHours,
  ChatMessage,
} from '../../types/aircraft';
import { AircraftViewer } from '../AircraftViewer/AircraftViewer';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';
import { api } from '../../services/apiClient';

interface DigitalTwinViewProps {
  aircraftList: AircraftData[];
  selectedAircraftId: string;
  onSelectAircraft: (id: string) => void;
  searchQuery: string;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  aircraftList,
  selectedAircraftId,
  onSelectAircraft,
}) => {
  const [futureHours, setFutureHours] = useState<FutureHours>(0);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(true);
  const [selectedCompId, setSelectedCompId] = useState<string>('tejas-hydraulics');
  const [activeViewerTab, setActiveViewerTab] = useState<'3d' | 'components' | 'maintenance' | 'history'>('3d');

  // AI Chat state for right drawer
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'user',
      timestamp: '14:20',
      text: 'Tell me about spare HP-9042',
    },
    {
      id: 'msg-init-2',
      sender: 'assistant',
      timestamp: '14:20',
      text: 'HP-9042 is a Hydraulic Pump Kit used in Tejas aircraft.',
      cardData: {
        title: 'Hydraulic Pump Kit (HP-9042)',
        badge: 'Critical Shortage at Base Bravo',
        badgeType: 'danger',
        specs: [
          { label: 'Current Stock', value: '1 unit (Base Alpha)' },
          { label: 'Min Required', value: '2 units' },
          { label: 'Supplier Lead Time', value: '6–8 weeks' },
          { label: 'Compatible With', value: 'Tejas (Mk1)' },
        ],
        recommendations: [
          'Transfer 1 unit from Base Alpha to reduce downtime by 72 hours.',
        ],
      },
    },
  ]);

  // Current aircraft with simulated degradation
  const rawAircraft = useMemo(() => {
    return aircraftList.find((a) => a.id === selectedAircraftId) || aircraftList[0];
  }, [aircraftList, selectedAircraftId]);

  const currentAircraft = useMemo(() => {
    return mockAirDoctorService.projectAircraftHealth(rawAircraft, futureHours);
  }, [rawAircraft, futureHours]);

  // Selected component
  const selectedComponent = useMemo(() => {
    return (
      currentAircraft.components.find((c) => c.id === selectedCompId) ||
      currentAircraft.components[0]
    );
  }, [currentAircraft, selectedCompId]);

  const rul = useMemo(() => {
    if (selectedComponent.rulPrediction) {
      return selectedComponent.rulPrediction;
    }
    const rulP50 = Math.max(2, Math.round((selectedComponent.health / 100) * 180));
    const baseSpread = Math.max(3, Math.round(rulP50 * 0.15));
    return {
      model_source: 'deterministic_fallback_slot' as const,
      model_file_present: false,
      rul_p10: Math.max(0.5, Math.round((rulP50 - baseSpread) * 10) / 10),
      rul_p50: rulP50,
      rul_p90: Math.round((rulP50 + baseSpread) * 10) / 10,
      risk_range_pct: Math.min(99, Math.max(4, Math.round((100 - selectedComponent.health) * 0.95))),
      trust_penalty_applied: false,
      shap_drivers: [
        { name: 'Hydraulic Cavitation Pressure', contribution_pct: 48 },
        { name: 'Return Line Fluid Temperature', contribution_pct: 32 },
        { name: 'RMS High-Frequency Vibration', contribution_pct: 20 },
      ],
    };
  }, [selectedComponent]);

  const riskBand = useMemo(() => {
    if (rul.risk_range_pct >= 65) {
      return { label: 'CRITICAL', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
    if (rul.risk_range_pct >= 40) {
      return { label: 'HIGH RISK', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (rul.risk_range_pct >= 20) {
      return { label: 'ELEVATED', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
    return { label: 'NOMINAL', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }, [rul.risk_range_pct]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');

    const newMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: userText,
    };
    setChatMessages((prev) => [...prev, newMsg]);

    try {
      const response = await api.queryAiAssistant(userText);
      setChatMessages((prev) => [...prev, response]);
    } catch {
      const response = mockAirDoctorService.queryAiAssistant(userText);
      setChatMessages((prev) => [...prev, response]);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Aircraft Health — 3D Digital Twin &amp; AI Assistant
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Explore the aircraft, check component health and ask questions to the AI assistant.
        </p>
      </div>

      {/* Top Controls Row matching Reference Image */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Aircraft Dropdown Selectors matching Image 1 (2/4) */}
        <div className="flex items-center gap-2">
          {/* Aircraft Type Dropdown */}
          <div className="relative">
            <select
              value={selectedAircraftId}
              onChange={(e) => onSelectAircraft(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="tejas">Tejas</option>
              <option value="rafale">Rafale</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Tail ID Dropdown */}
          <div className="relative">
            <select
              value={currentAircraft.code}
              onChange={(e) => {
                if (e.target.value.includes('R-')) onSelectAircraft('rafale');
                else onSelectAircraft('tejas');
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="Tejas T-04">T-04</option>
              <option value="Rafale R-01">R-01</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Future Flight-Hours Slider Pills matching Image 1 (2/4) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { val: 0, label: 'Now' },
            { val: 10, label: '+10h' },
            { val: 25, label: '+25h' },
            { val: 50, label: '+50h' },
          ].map((pill) => (
            <button
              key={pill.val}
              onClick={() => setFutureHours(pill.val as FutureHours)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                futureHours === pill.val
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport + AI Assistant Grid matching Reference Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 3D Viewer & Bottom Key Parameters (8 cols if drawer open, 12 if closed) */}
        <div className={`${showAiDrawer ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          {/* Three.js Viewer Container (Houses original, untouched AircraftViewer) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <AircraftViewer
              aircraft={currentAircraft}
              selectedComponent={selectedComponent}
              onSelectComponent={(comp) => setSelectedCompId(comp.id)}
              activeTab={activeViewerTab}
              onTabChange={setActiveViewerTab}
            />
          </div>

          {/* Bottom Card: Selected Component + Key Parameters matching Image 1 (2/4) */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Component Health */}
            <div className="md:col-span-5 space-y-2">
              <div className="text-sm font-extrabold text-slate-900">
                {selectedComponent.name}
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Health</span>
                <span className="font-mono font-black text-slate-900">
                  {selectedComponent.health}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedComponent.health >= 80
                      ? 'bg-emerald-500'
                      : selectedComponent.health >= 55
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${selectedComponent.health}%` }}
                />
              </div>
            </div>

            {/* Right: Key Parameters matching Reference Image */}
            <div className="md:col-span-7 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 space-y-2">
              <div className="text-xs font-bold text-slate-900">Key Parameters</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Pressure</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedComponent.keyParameters?.pressure || '82 bar'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Temperature</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedComponent.keyParameters?.temperature || '78 °C'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Operating Hours</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedComponent.keyParameters?.operatingHours || '1,250 h'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Next Service</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedComponent.keyParameters?.nextService || '50 h'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RUL Predictive Range & Sensor Attribution Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Predictive RUL &amp; Sensor Attribution — {selectedComponent.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${riskBand.bg}`}
                >
                  Failure Risk: {rul.risk_range_pct}% ({riskBand.label})
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {rul.model_source === 'joblib' ? 'ML: LightGBM Active' : 'ML Slot: Deterministic Baseline'}
                </span>
              </div>
            </div>

            {/* Data Trust Penalty Warning */}
            {rul.trust_penalty_applied && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Data-Trust Uncertainty Penalty Applied:</strong> Unverified sensor telemetry detected in ingestion queue. Confidence bounds expanded by +12% and failure risk elevated by +8%.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left: Probabilistic RUL Flight-Hours Range (P10 / P50 / P90) */}
              <div className="md:col-span-5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Probabilistic Remaining Useful Life (RUL)
                </span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black font-mono text-slate-900">{rul.rul_p50}</span>
                    <span className="text-xs font-bold text-slate-500 ml-1">Flight Hours</span>
                    <span className="text-[10px] text-blue-600 font-bold block">P50 (Median Expected)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-700">{rul.rul_p10}h – {rul.rul_p90}h</span>
                    <span className="text-[10px] text-slate-400 block font-sans">P10 – P90 Range</span>
                  </div>
                </div>

                {/* Visual Range Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-slate-200 rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 bg-blue-500/30 rounded-full"
                      style={{
                        left: `${Math.max(5, Math.min(85, (rul.rul_p10 / 180) * 100))}%`,
                        width: `${Math.max(10, Math.min(80, ((rul.rul_p90 - rul.rul_p10) / 180) * 100))}%`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-2 bg-blue-600 rounded-full -ml-1"
                      style={{
                        left: `${Math.max(5, Math.min(95, (rul.rul_p50 / 180) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>P10: {rul.rul_p10}h</span>
                    <span className="font-bold text-blue-700">P50: {rul.rul_p50}h</span>
                    <span>P90: {rul.rul_p90}h</span>
                  </div>
                </div>
              </div>

              {/* Right: Top 3 Sensor Attribution Drivers (SHAP) */}
              <div className="md:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Top Sensor Attribution Drivers (SHAP Attribution)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Relative Influence</span>
                </div>

                <div className="space-y-2">
                  {rul.shap_drivers.map((driver, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate pr-2">{driver.name}</span>
                        <span className="font-mono text-slate-900 shrink-0">{driver.contribution_pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0
                              ? 'bg-rose-500'
                              : idx === 1
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${driver.contribution_pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AirDoctor Assistant Drawer matching Image 1 (2/4) */}
        {showAiDrawer && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col h-[650px] overflow-hidden">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">AirDoctor Assistant</h3>
                  <p className="text-[10px] text-slate-500">
                    Ask about spares, components or aircraft data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Hide Assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1.5">
                  {msg.sender === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-slate-900 text-white rounded-2xl px-3.5 py-2 max-w-[85%] text-xs font-medium">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-2 max-w-[90%]">
                        <div className="bg-slate-50 rounded-2xl px-3.5 py-2 text-slate-800 leading-relaxed border border-slate-100">
                          {msg.text}
                        </div>

                        {/* Card Data if present matching Image 1 (2/4) */}
                        {msg.cardData && (
                          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2 text-[11px]">
                            <div className="space-y-1 font-mono text-slate-700">
                              {msg.cardData.specs.map((spec, i) => (
                                <div key={i} className="flex justify-between">
                                  <span className="text-slate-400">{spec.label}:</span>
                                  <span className="font-bold text-slate-900">{spec.value}</span>
                                </div>
                              ))}
                            </div>

                            {msg.cardData.recommendations && (
                              <div className="pt-2 border-t border-slate-100 text-slate-700 font-sans">
                                <span className="font-bold block text-slate-900 mb-0.5">Recommendation:</span>
                                {msg.cardData.recommendations.map((rec, i) => (
                                  <p key={i} className="text-emerald-700 font-semibold">{rec}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about spares, maintenance, and fleet health"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
