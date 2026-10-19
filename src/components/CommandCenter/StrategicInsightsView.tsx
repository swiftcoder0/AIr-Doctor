import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  Zap,
  Activity,
  ArrowRight,
  Shield,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { CommanderFleetMetrics } from '../../types/aircraft';
import { api } from '../../services/apiClient';

interface StrategicInsightsViewProps {
  onNavigateToCommandCenter: () => void;
}

export const StrategicInsightsView: React.FC<StrategicInsightsViewProps> = ({
  onNavigateToCommandCenter,
}) => {
  const [metrics, setMetrics] = useState<CommanderFleetMetrics | null>(null);

  useEffect(() => {
    api.getCommanderFleetMetrics().then((data) => {
      if (data) setMetrics(data);
    });
  }, []);

  const commandReadiness = [
    { command: 'Western Command', readiness: 78, target: 75, baseCount: 6, status: 'EXCEEDS TARGET' },
    { command: 'Southern Command', readiness: 84, target: 75, baseCount: 4, status: 'OPTIMAL' },
    { command: 'Central Command', readiness: 71, target: 75, baseCount: 3, status: 'NEAR TARGET' },
    { command: 'Eastern Command', readiness: 77, target: 75, baseCount: 5, status: 'EXCEEDS TARGET' },
    { command: 'South Western Command', readiness: 76, target: 75, baseCount: 6, status: 'ON TARGET' },
    { command: 'Northern Command', readiness: 68, target: 75, baseCount: 2, status: 'ATTENTION NEEDED' },
  ];

  const mttrData = [
    { type: 'Scheduled 50-hr Routine', mttr: '14.2 hrs', baseline: '18.0 hrs', improvement: '-21%' },
    { type: 'Unscheduled Line LRU Swap', mttr: '6.8 hrs', baseline: '9.5 hrs', improvement: '-28%' },
    { type: 'Heavy Depot Level Bay Overhaul', mttr: '142 hrs', baseline: '168 hrs', improvement: '-15%' },
    { type: 'Cross-Base Strategic Ferry Recovery', mttr: '26 hrs', baseline: '38 hrs', improvement: '-31%' },
  ];

  const strategicRecommendations = [
    {
      title: 'Forward Staging of APU Starters to Western Corridor',
      priority: 'HIGH',
      impact: '+4.2% Fleet Readiness',
      description:
        'Re-route 2x APU Starter Generators from Ojhar 11 BRD to Ambala AFS. This eliminates the active ground state on Rafale RB-008 within 36 hours.',
    },
    {
      title: 'Sulur to Bareilly LCA Tejas Mk1 Staging Rebalance',
      priority: 'MEDIUM',
      impact: '+2 Combat Airframes in Northern Sector',
      description:
        'Clear ferry transit for LA-5021 and LA-5022. Southern sector readiness remains at 83% while strengthening Northern QRA capabilities.',
    },
    {
      title: 'Deploy High-Altitude Pre-Heater Spares to Leh AFS',
      priority: 'CRITICAL',
      impact: 'Restores Sub-Zero Sortie Capability',
      description:
        'Leh AFS runway apron pre-heaters operating below spec. Air HQ logistics priority transit recommended via Hindon C-130J flight.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Strategic Insights</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              AI PREDICTIVE ANALYTICS
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational trends, MTTR curves, LightGBM multi-base RUL forecasts & bottleneck mitigation
          </p>
        </div>

        <button
          onClick={onNavigateToCommandCenter}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <span>Return to Command Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics?.keyInsights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
              insight.tone === 'warning'
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                : 'bg-white border-slate-200/80 text-slate-900'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {insight.title}
            </div>
            <div className="text-2xl font-black mt-1 leading-none">{insight.metric}</div>
            <p className="text-xs text-slate-600 mt-1.5 leading-snug">{insight.detail}</p>
          </div>
        ))}
      </div>

      {/* Command-wise Readiness Performance */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Command-wise Readiness Distribution</h3>
            <p className="text-xs text-slate-500">Benchmark against 75% MoD operational target</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            FLEET AVERAGE: {metrics?.overallReadinessPct || 69}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commandReadiness.map((cmd) => {
            const meetsTarget = cmd.readiness >= cmd.target;
            return (
              <div
                key={cmd.command}
                className="p-4 rounded-xl border border-slate-200/70 bg-slate-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{cmd.command}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      meetsTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cmd.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-black text-slate-900">{cmd.readiness}%</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Target: {cmd.target}% ({cmd.baseCount} Bases)
                  </div>
                </div>
                {/* Progress */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${meetsTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${cmd.readiness}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MTTR Curves & Strategic Action Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* MTTR Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Mean Time to Repair (MTTR) Curves
            </h3>
            <p className="text-xs text-slate-500">Real-time improvement over Q2 baseline</p>
          </div>

          <div className="space-y-3">
            {mttrData.map((m, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{m.type}</span>
                  <span className="font-black text-emerald-700">{m.improvement} Faster</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1 font-mono">
                  <span>Current: <strong>{m.mttr}</strong></span>
                  <span>Baseline: {m.baseline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" /> Autonomous Decision Directives
            </h3>
            <p className="text-xs text-slate-500">Prioritized tactical recommendations</p>
          </div>

          <div className="space-y-3">
            {strategicRecommendations.map((rec, idx) => (
              <div key={idx} className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 text-xs">{rec.title}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      rec.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : rec.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700">{rec.impact}</div>
                <p className="text-[11px] text-slate-600 leading-snug">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
