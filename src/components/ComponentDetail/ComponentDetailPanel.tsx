import React from 'react';
import {
  X,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AircraftComponentData } from '../../types/aircraft';

interface ComponentDetailPanelProps {
  component: AircraftComponentData | null;
  aircraftName: string;
  aircraftCode: string;
  onClose: () => void;
}

export const ComponentDetailPanel: React.FC<ComponentDetailPanelProps> = ({
  component,
  aircraftName,
  aircraftCode,
  onClose,
}) => {
  if (!component) return null;

  const isAlert = component.status === 'Maintenance Required';
  const isMonitor = component.status === 'Monitor';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden select-none">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                {aircraftCode} • {aircraftName}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isAlert
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : isMonitor
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {component.status}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">
              {component.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Health Gauge & Risk Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Component Health
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-2xl font-black ${
                    isAlert ? 'text-rose-600' : isMonitor ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  {component.health}%
                </span>
                <span className="text-xs text-slate-400">/ 100% nominal</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAlert ? 'bg-rose-500' : isMonitor ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${component.health}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Maintenance Risk
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`text-sm font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    component.maintenanceRisk === 'HIGH'
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : component.maintenanceRisk === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  }`}
                >
                  {component.maintenanceRisk} RISK
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                {component.maintenanceRisk === 'HIGH'
                  ? 'Immediate inspection required'
                  : component.maintenanceRisk === 'MEDIUM'
                  ? 'Monitor telemetry trends'
                  : 'Operating nominally'}
              </div>
            </div>
          </div>

          {/* AirDoctor AI Insight */}
          <div className="bg-blue-50/60 rounded-xl border border-blue-200/70 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AirDoctor Predictive Insight</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {component.insight}
            </p>
          </div>

          {/* Telemetry Parameters */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 space-y-2 text-xs">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Telemetry &amp; Operational Metrics</span>
            </div>

            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Current Reading
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  {component.currentValue}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Normal Range
                </span>
                <span className="font-semibold text-slate-700 font-mono text-sm">
                  {component.normalRange}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 inline text-slate-400" />
                  Operating Hours
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {component.operatingHours}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 inline text-slate-400" />
                  Last Inspection
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {component.lastInspection}
                </span>
              </div>
            </div>
          </div>

          {/* Simulated Demo Data Disclaimer */}
          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[10px] text-slate-500 text-center font-mono uppercase tracking-wider">
            ● SIMULATED DEMO DATA — For demonstration and evaluation purposes only ●
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
