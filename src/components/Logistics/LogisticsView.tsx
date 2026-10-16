import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Bot,
  Package,
  Users,
  Warehouse,
  Check,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { BaseId, SparePart, Technician, MaintenanceBay } from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';

import { api } from '../../services/apiClient';

interface LogisticsViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onNavigate: (nav: string) => void;
  onLogDecision?: () => void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  selectedBaseId,
  onNavigate,
  onLogDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'spares' | 'techs' | 'bays'>('spares');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  const [spares, setSpares] = useState<SparePart[]>(() => mockAirDoctorService.getSpares('all'));
  const [technicians, setTechnicians] = useState<Technician[]>(() => mockAirDoctorService.getTechnicians(selectedBaseId));
  const [bays, setBays] = useState<MaintenanceBay[]>(() => mockAirDoctorService.getBays(selectedBaseId));

  React.useEffect(() => {
    let active = true;
    api.getSpares('all').then((data) => { if (active && data) setSpares(data); });
    api.getTechnicians(selectedBaseId).then((data) => { if (active && data) setTechnicians(data); });
    api.getBays(selectedBaseId).then((data) => { if (active && data) setBays(data); });
    return () => { active = false; };
  }, [selectedBaseId]);

  const handleApplyRecommendation = async () => {
    const entry = {
      actor: 'Air Commander',
      action: 'APPLY_CROSS_BASE_TRANSFER',
      previous_state: 'Base Bravo HP-9042: 0 units (Delayed 96h)',
      resulting_state: 'Cross-Base Transfer Authorized (+2.92 Aircraft-Days Recovered)',
      notes: 'Transferred 1 unit of HP-9042 from Base Alpha to Base Bravo. Down-time reduced by 72 hours.',
      baseId: 'base-bravo' as BaseId,
    };
    try {
      await api.recordDecision(entry);
    } catch {
      mockAirDoctorService.recordDecision(entry);
    }
    setActionSuccess('Applied recommendation: Cross-base transfer authorized for HP-9042! Readiness updated to 85%.');
    setTimeout(() => setActionSuccess(''), 4000);
    if (onLogDecision) onLogDecision();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header matching Reference Image */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Maintenance &amp; Logistics — Resource Optimizer
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Analyse spares, technicians and bays to reduce aircraft downtime.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => onNavigate('reports-analytics')}
            className="text-[11px] underline text-emerald-800"
          >
            View in Decision Ledger &rarr;
          </button>
        </div>
      )}

      {/* Top 2 Cards: Current Bottleneck (Red) & Optimized Scenario (Green) matching Image 1 (4/4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Current Bottleneck Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Bottleneck
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                Hydraulic Pump Kit (HP-9042)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Out of stock at Base Bravo <br />
                Supplier lead time: 6–8 weeks
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-rose-600 font-mono">+84 hours</div>
            <span className="text-xs text-rose-500 font-medium">Delay Impact</span>
          </div>
        </div>

        {/* Optimized Scenario Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Optimized Scenario
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                Cross-Base Transfer
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transfer from Base Alpha <br />
                Total downtime: 26 hours
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-emerald-600 font-mono">+2.92</div>
            <span className="text-xs text-emerald-600 font-medium">Aircraft-Days Recovered</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Logistics Tables (Left) + AI Recommendation (Right) matching Image 1 (4/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Tabbed Tables (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          {/* Segmented Tabs matching Reference Image */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('spares')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'spares'
                  ? 'bg-[#142A20] text-emerald-400 border border-emerald-500/40 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Spare Inventory
            </button>
            <button
              onClick={() => setActiveTab('techs')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'techs'
                  ? 'bg-[#142A20] text-emerald-400 border border-emerald-500/40 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Technicians
            </button>
            <button
              onClick={() => setActiveTab('bays')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'bays'
                  ? 'bg-[#142A20] text-emerald-400 border border-emerald-500/40 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Maintenance Bays
            </button>
          </div>

          {/* Table: Spare Inventory matching Image 1 (4/4) */}
          {activeTab === 'spares' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="pb-3">Part No.</th>
                    <th className="pb-3">Part Name</th>
                    <th className="pb-3">Stock (Alpha)</th>
                    <th className="pb-3">Stock (Bravo)</th>
                    <th className="pb-3">Min Required</th>
                    <th className="pb-3">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {spares.slice(0, 4).map((sp) => (
                    <tr key={sp.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-mono font-bold text-slate-900">{sp.partNumber}</td>
                      <td className="py-3 text-slate-800">{sp.name}</td>
                      <td className="py-3 font-mono font-bold text-slate-700">{sp.stockAlpha}</td>
                      <td className={`py-3 font-mono font-bold ${sp.stockBravo === 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {sp.stockBravo}
                      </td>
                      <td className="py-3 font-mono text-slate-700">{sp.minimumRequired}</td>
                      <td className={`py-3 font-medium ${sp.supplierLeadTime.includes('weeks') && sp.stockBravo === 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        {sp.supplierLeadTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table: Technicians */}
          {activeTab === 'techs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="pb-3">Badge</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Trade / Qualification</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Assigned Aircraft</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {technicians.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-mono text-slate-500">{t.badgeNumber}</td>
                      <td className="py-3 font-bold text-slate-900">{t.name}</td>
                      <td className="py-3 text-slate-700">{t.trade}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{t.assignedAircraft || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table: Bays */}
          {activeTab === 'bays' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {bays.map((bay) => (
                <div key={bay.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{bay.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${bay.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {bay.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{bay.type}</p>
                  {bay.occupiedByAircraft && (
                    <div className="text-[11px] text-slate-700">
                      Occupied by: <strong>{bay.occupiedByAircraft}</strong> ({bay.estimatedFreeTime})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Recommendation Card matching Image 1 (4/4) (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">AI Recommendation</h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                <span className="text-blue-700 font-bold">Transfer 1 unit of HP-9042 from Base Alpha</span> to reduce downtime by <strong className="text-slate-900">72 hours</strong> and improve fleet readiness to <strong className="text-emerald-700">85%</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleApplyRecommendation}
              className="w-full py-2.5 bg-[#142A20] hover:bg-[#1a382b] text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Apply Recommendation
            </button>
            <button
              onClick={() => onNavigate('resource-optimizer')}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Compare Other Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
