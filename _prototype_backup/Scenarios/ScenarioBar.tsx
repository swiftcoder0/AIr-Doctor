import React, { useState } from 'react';
import { SlidersHorizontal, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { ScenarioId, ScenarioInfo } from '../../types/aircraft';

interface ScenarioBarProps {
  scenarios: ScenarioInfo[];
  activeScenarioId: ScenarioId;
  onActivateScenario: (id: ScenarioId) => void;
  isLoading?: boolean;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  scenarios,
  activeScenarioId,
  onActivateScenario,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Collapsed Bar / Summary View */}
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Simulated Scenario
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                Deterministic
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              {activeScenario.name}
            </div>
          </div>
        </div>

        {/* Quick info of impact */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 max-w-xl">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{activeScenario.simulated_impact_summary}</span>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 shadow-xs transition-colors"
          >
            <span>{isOpen ? 'Close Scenarios' : 'Switch Scenario (7)'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Scenario Grid */}
      {isOpen && (
        <div className="p-5 border-t border-slate-100 bg-slate-50/60 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-in fade-in duration-150">
          {scenarios.map((sc) => {
            const isActive = sc.id === activeScenarioId;

            return (
              <div
                key={sc.id}
                onClick={() => {
                  if (!isActive && !isLoading) {
                    onActivateScenario(sc.id);
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-xs text-slate-900 leading-tight">
                    {sc.name}
                  </div>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      Available
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 mt-1 leading-snug line-clamp-2">
                  {sc.description}
                </p>

                {/* Impact badges */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {sc.impacted_areas.map((area, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
