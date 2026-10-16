import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Package,
  Users,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  SparePart,
  Technician,
  MaintenanceBay,
  MaintenanceJob,
  BottleneckItem,
  WhatIfRequest,
  WhatIfResult,
} from '../../types/aircraft';
import { api } from '../../services/api';

interface ReadinessPlannerProps {
  onLogDecision?: (action: string, notes: string) => void;
}

export const ReadinessPlanner: React.FC<ReadinessPlannerProps> = ({ onLogDecision }) => {
  const [spares, setSpares] = useState<SparePart[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [bays, setBays] = useState<MaintenanceBay[]>([]);
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // What-If Sandbox Modifiers
  const [deltaSpares, setDeltaSpares] = useState<Record<string, number>>({
    'sp-rotor-03': 0,
    'sp-pump-02': 0,
    'sp-hyd-01': 0,
  });
  const [deltaTechs, setDeltaTechs] = useState<Record<string, number>>({
    'Hydraulics Specialist': 0,
    'Rotorcraft Systems': 0,
  });
  const [deltaBays, setDeltaBays] = useState<number>(0);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Load resource baseline
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [sparesData, techData, bayData, jobsData, bnecksData] = await Promise.all([
        api.getInventory(),
        api.getTechnicians(),
        api.getBays(),
        api.getJobs(),
        api.getBottlenecks(),
      ]);
      setSpares(sparesData);
      setTechnicians(techData);
      setBays(bayData);
      setJobs(jobsData);
      setBottlenecks(bnecksData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRunSimulation = async () => {
    setSimulating(true);
    const req: WhatIfRequest = {
      delta_spares: deltaSpares,
      delta_technicians: deltaTechs,
      delta_bays: deltaBays,
    };
    const res = await api.runWhatIf(req);
    setWhatIfResult(res);
    setSimulating(false);
  };

  const handleResetWhatIf = () => {
    setDeltaSpares({ 'sp-rotor-03': 0, 'sp-pump-02': 0, 'sp-hyd-01': 0 });
    setDeltaTechs({ 'Hydraulics Specialist': 0, 'Rotorcraft Systems': 0 });
    setDeltaBays(0);
    setWhatIfResult(null);
  };

  const handleApplyPlan = async () => {
    if (!whatIfResult) return;
    const notes = `Approved what-if allocation: Spares: ${JSON.stringify(deltaSpares)}, Techs: ${JSON.stringify(deltaTechs)}, Bays: ${deltaBays}. Projected recovery: ${whatIfResult.aircraft_days_recovered} aircraft-days.`;
    await api.recordDecision({
      action: 'APPLY_RESOURCE_PLAN',
      previous_state: 'Baseline Logistics Schedule',
      resulting_state: `Projected Readiness: ${whatIfResult.projected_avg_readiness_pct}%`,
      notes,
    });
    if (onLogDecision) {
      onLogDecision('APPLY_RESOURCE_PLAN', notes);
    }
    alert('Plan recorded to immutable Decision Ledger. Logistics requisitions dispatched (simulated).');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Disclaimer */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Simulated Readiness Engine:</strong> Resource allocations evaluate turnaround queues based on deterministic constraint programming.
          </span>
        </div>
        <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-bold">
          ESTIMATED SIMULATED PLANNING OUTCOME
        </span>
      </div>

      {/* Ranked Bottlenecks Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Ranked Fleet Bottlenecks (By Estimated Aircraft-Days Recovered)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Prioritized by recovery impact, not simple aircraft counts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bottlenecks.map((item) => (
            <div
              key={item.rank}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Rank #{item.rank} • {item.resource_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="font-extrabold text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    +{item.estimated_aircraft_days_recovered} Days Impact
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {item.resource_name}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {item.shortage_description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700">Mitigation: </span>
                {item.mitigation_action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive What-If Sandbox */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-blue-200/80 shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Interactive Decision Support
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                WHAT-IF SANDBOX
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Simulate Resource Adjustments (±1 Spares, Technicians, Hangar Bays)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetWhatIf}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{simulating ? 'Calculating...' : 'Run What-If Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Adjusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Spare Parts Modifiers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Spare Parts (Priority Stock)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Swashplate Bearings:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setDeltaSpares((prev) => ({
                        ...prev,
                        'sp-rotor-03': Math.max(0, (prev['sp-rotor-03'] || 0) - 1),
                      }))
                    }
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold w-4 text-center">
                    {deltaSpares['sp-rotor-03'] || 0}
                  </span>
                  <button
                    onClick={() =>
                      setDeltaSpares((prev) => ({
                        ...prev,
                        'sp-rotor-03': (prev['sp-rotor-03'] || 0) + 1,
                      }))
                    }
                    className="w-6 h-6 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Hydraulic Pump Cores:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setDeltaSpares((prev) => ({
                        ...prev,
                        'sp-pump-02': Math.max(0, (prev['sp-pump-02'] || 0) - 1),
                      }))
                    }
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold w-4 text-center">
                    {deltaSpares['sp-pump-02'] || 0}
                  </span>
                  <button
                    onClick={() =>
                      setDeltaSpares((prev) => ({
                        ...prev,
                        'sp-pump-02': (prev['sp-pump-02'] || 0) + 1,
                      }))
                    }
                    className="w-6 h-6 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Technician Modifiers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Technicians (On-Station Roster)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Hydraulics Specialists:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setDeltaTechs((prev) => ({
                        ...prev,
                        'Hydraulics Specialist': Math.max(0, (prev['Hydraulics Specialist'] || 0) - 1),
                      }))
                    }
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold w-4 text-center">
                    {deltaTechs['Hydraulics Specialist'] || 0}
                  </span>
                  <button
                    onClick={() =>
                      setDeltaTechs((prev) => ({
                        ...prev,
                        'Hydraulics Specialist': (prev['Hydraulics Specialist'] || 0) + 1,
                      }))
                    }
                    className="w-6 h-6 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Rotorcraft Techs:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setDeltaTechs((prev) => ({
                        ...prev,
                        'Rotorcraft Systems': Math.max(0, (prev['Rotorcraft Systems'] || 0) - 1),
                      }))
                    }
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold w-4 text-center">
                    {deltaTechs['Rotorcraft Systems'] || 0}
                  </span>
                  <button
                    onClick={() =>
                      setDeltaTechs((prev) => ({
                        ...prev,
                        'Rotorcraft Systems': (prev['Rotorcraft Systems'] || 0) + 1,
                      }))
                    }
                    className="w-6 h-6 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Bay Modifiers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-blue-600" />
              <span>Hangar Bays (Active Slots)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Additional Bay Capacity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeltaBays(Math.max(0, deltaBays - 1))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold w-4 text-center">{deltaBays}</span>
                  <button
                    onClick={() => setDeltaBays(deltaBays + 1)}
                    className="w-6 h-6 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Authorizes temporary outdoor maintenance apron shelter at Base Alpha.
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        {whatIfResult && (
          <div className="bg-white p-5 rounded-xl border border-emerald-300 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">
                  What-If Simulation Outcome
                </span>
              </div>
              <button
                onClick={handleApplyPlan}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Apply as Working Plan &amp; Audit Log</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Baseline Ready</span>
                <div className="text-xl font-black text-slate-800 mt-0.5">
                  {whatIfResult.baseline_ready_count} Aircraft
                </div>
                <span className="text-[10px] text-slate-400">{whatIfResult.baseline_avg_readiness_pct}% Readiness</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-bold">Projected Ready</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5">
                  {whatIfResult.projected_ready_count} Aircraft
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">{whatIfResult.projected_avg_readiness_pct}% Readiness</span>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-[10px] text-blue-700 uppercase font-bold">Aircraft-Days Recovered</span>
                <div className="text-xl font-black text-blue-700 mt-0.5">
                  +{whatIfResult.aircraft_days_recovered} Days
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Net fleet availability</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Remaining Bottlenecks</span>
                <div className="text-xl font-black text-slate-800 mt-0.5">
                  {whatIfResult.remaining_bottlenecks.length}
                </div>
                <span className="text-[10px] text-slate-400">Unresolved constraints</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              {whatIfResult.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Resource Inventory & Technician Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parts Inventory */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">Spare Parts Inventory</h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">{spares.length} Tracked Parts</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {spares.map((sp) => (
              <div
                key={sp.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{sp.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {sp.part_number} • Lead time: {sp.lead_time_days} days
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900 font-mono">
                    {sp.quantity_on_hand} on hand
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      sp.status === 'Adequate'
                        ? 'bg-emerald-50 text-emerald-700'
                        : sp.status === 'Low Stock'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {sp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Roster */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">Technician Shifts &amp; Trades</h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">{technicians.length} Specialists</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{tech.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {tech.trade} • Level {tech.certification_level} • {tech.base}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-600">{tech.shift} Shift</div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      tech.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700'
                        : tech.status === 'Assigned'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tech.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
