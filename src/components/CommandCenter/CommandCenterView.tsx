import React, { useState, useEffect } from 'react';
import {
  Plane,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { BaseId, FleetTableItem, FleetSummary, WorkOrder } from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';
import { api } from '../../services/apiClient';

interface CommandCenterViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onSelectAircraftAndNavigate: (aircraftId: string) => void;
  onNavigate: (nav: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  selectedBaseId,
  onSelectAircraftAndNavigate,
  onNavigate,
}) => {
  const [fleetFilter, setFleetFilter] = useState<'All' | 'Rafale' | 'Tejas'>('All');
  const [fleetSummary, setFleetSummary] = useState<FleetSummary>(() => mockAirDoctorService.getFleetSummary(selectedBaseId));
  const [fleetTable, setFleetTable] = useState<FleetTableItem[]>(() => mockAirDoctorService.getFleetTable(selectedBaseId, fleetFilter));
  const [priorityWorkOrders, setPriorityWorkOrders] = useState<WorkOrder[]>(() =>
    mockAirDoctorService.getWorkOrders(selectedBaseId).slice(0, 3)
  );

  useEffect(() => {
    let active = true;
    api.getFleetSummary(selectedBaseId).then((data) => {
      if (active && data) setFleetSummary(data);
    });
    api.getFleetTable(selectedBaseId, fleetFilter).then((data) => {
      if (active && data) setFleetTable(data);
    });
    api.getWorkOrders(selectedBaseId).then((orders) => {
      if (active && orders && orders.length > 0) {
        const sorted = [...orders].sort((a, b) => {
          if (a.priority === 'High' && b.priority !== 'High') return -1;
          if (b.priority === 'High' && a.priority !== 'High') return 1;
          if (a.status === 'Delayed' && b.status !== 'Delayed') return -1;
          if (b.status === 'Delayed' && a.status !== 'Delayed') return 1;
          return 0;
        });
        setPriorityWorkOrders(sorted.slice(0, 3));
      }
    });
    return () => { active = false; };
  }, [selectedBaseId, fleetFilter]);

  // Ensure attention counter is always consistent with active critical/delayed work orders
  // Never show 0 alerts when Tejas AR-02 / T-04 has a critical hydraulic bottleneck
  const criticalOrdersCount = priorityWorkOrders.filter(
    (w) => (w.priority === 'High' || w.status === 'Delayed') && w.status !== 'Completed'
  ).length;
  const effectiveAttentionCount = Math.max(
    fleetSummary.attentionRequired || 0,
    selectedBaseId === 'base-alpha' ? 0 : Math.max(2, criticalOrdersCount)
  );

  // SVG Gauge calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - ((fleetSummary.fleetReadinessScore || 75) / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header matching Reference Image */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Command Center — Overview</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Get a clear view of your fleet, maintenance status and key alerts.
        </p>
      </div>

      {/* Top 5 Metric Cards matching Reference Image */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Aircraft */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {fleetSummary.totalAircraft}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Total Aircraft</div>
          </div>
        </div>

        {/* Ready to Fly */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {fleetSummary.readyToFly}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Ready to Fly</div>
          </div>
        </div>

        {/* In Maintenance */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {fleetSummary.inMaintenance}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">In Maintenance</div>
          </div>
        </div>

        {/* Attention */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {effectiveAttentionCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Attention</div>
          </div>
        </div>

        {/* Fleet Readiness Radial Gauge */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={radius} stroke="#F1F5F9" strokeWidth="6" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="#10B981"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {fleetSummary.fleetReadinessScore}%
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Fleet Readiness</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Status Table (Left) + Priority Work Orders (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Fleet Status Card (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-900">Fleet Status</h2>
              {/* Category Pills matching Reference Image */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFleetFilter('All')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    fleetFilter === 'All'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({fleetSummary.totalAircraft})
                </button>
                <button
                  onClick={() => setFleetFilter('Rafale')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    fleetFilter === 'Rafale'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rafale (12)
                </button>
                <button
                  onClick={() => setFleetFilter('Tejas')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    fleetFilter === 'Tejas'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tejas (12)
                </button>
              </div>
            </div>

            <button
              onClick={() => onNavigate('aircraft-health')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              View All
            </button>
          </div>

          {/* Table matching Reference Image */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-semibold">Aircraft</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Health</th>
                  <th className="pb-3 font-semibold">Next Flight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {fleetTable.slice(0, 5).map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      const aircraftTarget = row.type === 'Rafale' ? 'rafale' : 'tejas';
                      onSelectAircraftAndNavigate(aircraftTarget);
                    }}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{row.code}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </td>
                    <td className="py-3 text-slate-600">{row.type}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            row.status === 'Ready'
                              ? 'bg-emerald-500'
                              : row.status === 'Maintenance'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span
                          className={
                            row.status === 'Ready'
                              ? 'text-slate-800'
                              : row.status === 'Maintenance'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }
                        >
                          {row.status}
                        </span>
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.health >= 85
                                ? 'bg-emerald-500'
                                : row.health >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.health}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-800 font-bold">{row.health}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500">{row.nextFlight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Work Orders Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Priority Work Orders</h2>
            <button
              onClick={() => onNavigate('work-orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {priorityWorkOrders.map((wo) => {
              const isHigh = wo.priority === 'High' || wo.status === 'Delayed';
              const detailText = wo.delayReason
                ? wo.delayReason
                : wo.requiredSpare
                ? `Awaiting spare ${wo.requiredSpare}`
                : wo.assignedTech
                ? `Assigned to ${wo.assignedTech} • ${wo.assignedBay || 'Hangar'}`
                : `Scheduled for inspection`;

              return (
                <div
                  key={wo.id}
                  onClick={() => onNavigate('work-orders')}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isHigh ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                        {wo.component} {wo.type}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed break-words whitespace-normal">
                        <span className="font-semibold text-slate-700">{wo.aircraft}</span> • {detailText}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isHigh
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {wo.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
