import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { AircraftData } from '../../types/aircraft';

interface FleetOverviewProps {
  aircraftList: AircraftData[];
  selectedAircraftId: string;
  onSelectAircraft: (id: string) => void;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({
  aircraftList,
  selectedAircraftId,
  onSelectAircraft,
}) => {
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Fleet Overview
        </h2>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition-colors">
          <span>View All Aircraft</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Two Aircraft Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aircraftList.map((aircraft) => {
          const isSelected = selectedAircraftId === aircraft.id;
          const isReady = aircraft.status === 'READY';

          return (
            <div
              key={aircraft.id}
              onClick={() => onSelectAircraft(aircraft.id)}
              className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden select-none ${
                isSelected
                  ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10'
                  : 'border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Airplane Illustration / Silhouette */}
                <div className="w-24 h-18 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shrink-0 relative overflow-hidden">
                  {aircraft.id === 'rafale' ? (
                    // Sleek Rafale silhouette with canard and delta wing
                    <svg viewBox="0 0 100 65" className="w-full h-full text-slate-700 drop-shadow-sm">
                      <defs>
                        <linearGradient id="rafaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#475569" />
                          <stop offset="100%" stopColor="#1E293B" />
                        </linearGradient>
                      </defs>
                      <ellipse cx="50" cy="55" rx="36" ry="5" fill="#94A3B8" opacity="0.3" filter="blur(2px)" />
                      <path
                        d="M12 36 L28 32 L34 30 L45 30 L60 22 L72 32 L88 34 L78 37 L58 37 L48 44 L32 40 L16 38 Z"
                        fill="url(#rafaleGrad)"
                      />
                      <path d="M38 31 L68 18 L76 33 L62 36 Z" fill="#64748B" />
                      <path d="M26 31 L32 25 L36 30 Z" fill="#94A3B8" />
                      <path d="M64 24 L72 10 L78 13 L72 32 Z" fill="#334155" />
                      <ellipse cx="28" cy="30" rx="6" ry="2.2" fill="#38BDF8" opacity="0.8" />
                    </svg>
                  ) : (
                    // Sleek Tejas silhouette with compound delta wing
                    <svg viewBox="0 0 100 65" className="w-full h-full text-slate-700 drop-shadow-sm">
                      <defs>
                        <linearGradient id="tejasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#64748B" />
                          <stop offset="100%" stopColor="#334155" />
                        </linearGradient>
                      </defs>
                      <ellipse cx="50" cy="55" rx="34" ry="5" fill="#94A3B8" opacity="0.3" filter="blur(2px)" />
                      <path
                        d="M14 35 L32 32 L46 22 L70 28 L82 34 L72 37 L52 38 L42 42 L26 38 Z"
                        fill="url(#tejasGrad)"
                      />
                      <path d="M36 32 L66 20 L74 34 L54 36 Z" fill="#475569" />
                      <path d="M62 26 L68 12 L74 15 L70 34 Z" fill="#1E293B" />
                      <ellipse cx="26" cy="32" rx="5" ry="2" fill="#38BDF8" opacity="0.8" />
                    </svg>
                  )}
                </div>

                {/* Aircraft Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-base text-slate-900 tracking-tight">
                      {aircraft.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isReady
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                      }`}
                    >
                      {aircraft.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mb-2">
                    {aircraft.code}
                  </div>

                  {/* Health Bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {aircraft.overallHealth}%
                    </span>
                    <span className="text-xs text-slate-400">Overall Health</span>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isReady ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${aircraft.overallHealth}%` }}
                    />
                  </div>
                </div>

                {/* Right detail: Next Maintenance or Issue */}
                <div className="text-right pl-3 border-l border-slate-100 shrink-0 min-w-[130px] flex items-center justify-between">
                  <div className="text-left">
                    {isReady ? (
                      <>
                        <div className="text-[11px] text-slate-400 font-medium leading-none">
                          Next Maintenance
                        </div>
                        <div className="text-base font-extrabold text-slate-900 leading-tight mt-1">
                          {aircraft.nextMaintenanceHours}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">
                          Flight Hours
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[11px] text-amber-600 font-medium leading-none">
                          Issue Detected
                        </div>
                        <div className="text-xs font-bold text-slate-900 leading-tight mt-1 truncate max-w-[110px]" title={aircraft.issueDetected}>
                          {aircraft.issueDetected || 'Hydraulic Pressure Trend'}
                        </div>
                      </>
                    )}
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 ml-2 transition-colors ${
                      isSelected ? 'text-blue-600' : 'text-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
