import React from 'react';
import { Clock, Wrench, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AircraftData } from '../../types/aircraft';

interface HealthPanelProps {
  aircraft: AircraftData;
}

export const HealthPanel: React.FC<HealthPanelProps> = ({ aircraft }) => {
  const isReady = aircraft.status === 'READY';
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (aircraft.overallHealth / 100) * circumference;

  const ringColor = isReady ? '#22C55E' : '#F59E0B'; // green or amber

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
        Aircraft Health
      </h3>

      <div className="flex items-center gap-6">
        {/* Radial Circular Progress Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#F1F5F9"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={ringColor}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          {/* Gauge Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {aircraft.overallHealth}%
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 leading-tight">
              Overall Health
            </span>
          </div>
        </div>

        {/* Operational Metrics Key-Value List */}
        <div className="flex-1 space-y-2.5 text-xs">
          {/* Flight Hours */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Flight Hours</span>
            </div>
            <span className="font-bold text-slate-900 font-mono">
              {aircraft.flightHours}
            </span>
          </div>

          {/* Last Maintenance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Maintenance</span>
            </div>
            <span className="font-bold text-slate-900 font-mono">
              {aircraft.lastMaintenance}
            </span>
          </div>

          {/* Next Maintenance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Next Maintenance</span>
            </div>
            <span
              className={`font-bold font-mono ${
                isReady ? 'text-slate-900' : 'text-amber-600'
              }`}
            >
              {aircraft.nextMaintenance}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              {isReady ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>Status</span>
            </div>
            <span
              className={`font-bold ${
                isReady ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {aircraft.statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
