import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Clock,
  ShieldCheck,
  Building2,
  FileCheck,
  X,
} from 'lucide-react';
import { WhatIfRequest, WhatIfResult } from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';

interface ResourceOptimizerViewProps {
  onLogDecision?: () => void;
  onNavigate: (nav: string) => void;
}

export const ResourceOptimizerView: React.FC<ResourceOptimizerViewProps> = ({
  onLogDecision,
  onNavigate,
}) => {
  const defaultReco = mockAirDoctorService.getDefaultRecommendation();

  // State for What-If sandbox
  const [crossBaseTransfer, setCrossBaseTransfer] = useState<boolean>(true);
  const [extraSpare, setExtraSpare] = useState<number>(0);
  const [extraTech, setExtraTech] = useState<number>(0);
  const [extraBay, setExtraBay] = useState<number>(0);

  // Result state
  const [simulationResult, setSimulationResult] = useState<WhatIfResult>(() => {
    return mockAirDoctorService.runWhatIf({
      delta_spares: { 'HP-9042': 0 },
      delta_technicians: { 'Hydraulics Specialist': 0 },
      delta_bays: 0,
      cross_base_transfer: true,
    });
  });

  // Action status & Override modal
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>(
    'Priority sortie requirements at Base Alpha require retaining local hydraulic buffer. Commercial expedite preferred.'
  );

  const handleSimulate = (
    cBase: boolean = crossBaseTransfer,
    spare: number = extraSpare,
    tech: number = extraTech,
    bay: number = extraBay
  ) => {
    const res = mockAirDoctorService.runWhatIf({
      delta_spares: { 'HP-9042': spare },
      delta_technicians: { 'Hydraulics Specialist': tech },
      delta_bays: bay,
      cross_base_transfer: cBase,
    });
    setSimulationResult(res);
  };

  const handleResetToBaseline = () => {
    setCrossBaseTransfer(false);
    setExtraSpare(0);
    setExtraTech(0);
    setExtraBay(0);
    handleSimulate(false, 0, 0, 0);
  };

  const handleApplyRecommendation = () => {
    mockAirDoctorService.recordDecision({
      actor: 'Wing Cmdr. Aditya (Operations Lead)',
      action: 'ACCEPT_OPTIMIZER_RECOMMENDATION',
      previous_state: 'Baseline Readiness: Tejas ready in 96h (Bottleneck: HP-9042 lead time)',
      resulting_state: `Cross-Base Transfer Authorized: Projected ready in ${simulationResult.projectedReadyHours}h (+${simulationResult.aircraft_days_recovered} days recovered)`,
      notes: `Commander accepted optimal recommendation. Transport aircraft dispatched to ferry HP-9042 from Base Alpha to Base Bravo.`,
      scenario_id: 'cross_base_transfer_opt',
    });

    setActionSuccess(
      `Accepted recommendation: Cross-base transfer authorized! Logged to Decision Ledger (+${simulationResult.aircraft_days_recovered} aircraft-days recovered).`
    );
    if (onLogDecision) onLogDecision();
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    mockAirDoctorService.recordDecision({
      actor: 'Wing Cmdr. Aditya (Operations Lead)',
      action: 'OVERRIDE_OPTIMIZER_RECOMMENDATION',
      previous_state: 'Recommended: Cross-Base Transfer from Base Alpha',
      resulting_state: 'Commander Override: Commercial Emergency Procurement Authorized',
      notes: overrideReason,
      isOverride: true,
      overrideReason: overrideReason,
      scenario_id: 'override_manual',
    });

    setShowOverrideModal(false);
    setActionSuccess('Commander override recorded in Decision Ledger with required operational justification.');
    if (onLogDecision) onLogDecision();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Context */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Resource Recovery Optimizer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic what-if modeling: Spares expedite, technician pairing, and cross-base air transport.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToBaseline}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={() => {
              setCrossBaseTransfer(true);
              setExtraSpare(0);
              setExtraTech(0);
              setExtraBay(0);
              handleSimulate(true, 0, 0, 0);
            }}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Recommended Scenario</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => onNavigate('reports-ledger')}
            className="text-[11px] underline text-emerald-800 hover:text-emerald-950 font-bold"
          >
            View Decision Ledger &rarr;
          </button>
        </div>
      )}

      {/* 2. Primary Comparative KPI Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Baseline Downtime
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {simulationResult.baselineReadyHours} h
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">4.0 Aircraft-Days (Tejas AR-02)</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            Projected Downtime
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
            {simulationResult.projectedReadyHours} h
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Compressed return-to-service
          </p>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4.5 border border-emerald-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Aircraft-Days Recovered
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            +{simulationResult.aircraft_days_recovered} Days
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
            {simulationResult.hoursRecovered} hours compressed
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Projected Fleet Readiness
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {simulationResult.projectedFleetReadinessPct}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Up from 50% baseline</p>
        </div>
      </div>

      {/* 3. AI Commander Recommendation Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Optimal AI Recommendation
            </span>
            <span className="text-xs font-mono font-bold text-blue-900">
              Recover +{defaultReco.daysRecovered} Aircraft-Days
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-500">
            Deterministic Confidence: 99.8%
          </span>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            {defaultReco.title}
          </h3>
          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
            {defaultReco.rationale}
          </p>
        </div>

        <div className="p-3 bg-white/70 rounded-xl border border-blue-100 text-xs text-slate-600 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Operational Trade-off: </strong>
            <span>{defaultReco.tradeOff}</span>
          </div>
        </div>

        {/* Commander Decision Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={() => setShowOverrideModal(true)}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Override Recommendation...
          </button>
          <button
            onClick={handleApplyRecommendation}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept Recommendation &amp; Authorize</span>
          </button>
        </div>
      </div>

      {/* 4. Interactive What-If Sandbox Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              What-If Resource Allocation Sandbox
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Test custom resource combinations deterministically
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Option 1: Cross-Base Transfer */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Cross-Base Transfer</span>
              <input
                type="checkbox"
                checked={crossBaseTransfer}
                onChange={(e) => {
                  setCrossBaseTransfer(e.target.checked);
                  handleSimulate(e.target.checked, extraSpare, extraTech, extraBay);
                }}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Airlift 1 unit of HP-9042 from Base Alpha depot in 14 hours.
            </p>
            <span className="text-[10px] font-bold text-blue-700 block">
              Reduces lead time from 96h to 14h
            </span>
          </div>

          {/* Option 2: Add 1 Spare Part */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">+1 Local Spare</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = Math.max(0, extraSpare - 1);
                    setExtraSpare(next);
                    handleSimulate(crossBaseTransfer, next, extraTech, extraBay);
                  }}
                  className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-xs">{extraSpare}</span>
                <button
                  onClick={() => {
                    const next = extraSpare + 1;
                    setExtraSpare(next);
                    handleSimulate(crossBaseTransfer, next, extraTech, extraBay);
                  }}
                  className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Immediate shelf availability (Zero delivery lead time).
            </p>
            <span className="text-[10px] font-bold text-emerald-700 block">
              Ready in 12h repair duration
            </span>
          </div>

          {/* Option 3: Add 1 Technician */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">+1 Tech Specialist</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = Math.max(0, extraTech - 1);
                    setExtraTech(next);
                    handleSimulate(crossBaseTransfer, extraSpare, next, extraBay);
                  }}
                  className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-xs">{extraTech}</span>
                <button
                  onClick={() => {
                    const next = extraTech + 1;
                    setExtraTech(next);
                    handleSimulate(crossBaseTransfer, extraSpare, next, extraBay);
                  }}
                  className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Dual-specialist pairing reduces repair duration from 12h to 8h.
            </p>
            <span className="text-[10px] font-bold text-blue-700 block">
              +4 hours additional recovery
            </span>
          </div>

          {/* Option 4: Add 1 Bay */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">+1 Depot Bay</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = Math.max(0, extraBay - 1);
                    setExtraBay(next);
                    handleSimulate(crossBaseTransfer, extraSpare, extraTech, next);
                  }}
                  className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-xs">{extraBay}</span>
                <button
                  onClick={() => {
                    const next = extraBay + 1;
                    setExtraBay(next);
                    handleSimulate(crossBaseTransfer, extraSpare, extraTech, next);
                  }}
                  className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Pre-empts maintenance hangar queue contention.
            </p>
            <span className="text-[10px] font-bold text-slate-600 block">
              Queue buffer preserved
            </span>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden select-none">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Commander Override Protocol
                </h3>
              </div>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOverride} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Overriding the automated recommendation requires recording an operational rationale in the append-only Decision Ledger.
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Mandatory Operational Justification Reason:
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={4}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  placeholder="State the tactical reason for rejecting cross-base transfer..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Commit Override to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
