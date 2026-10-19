import React, { useState, useEffect } from 'react';
import {
  Plane,
  Search,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Shield,
  Activity,
  Sliders,
  Filter,
} from 'lucide-react';
import { CommanderFleetMetrics } from '../../types/aircraft';
import { api } from '../../services/apiClient';

interface FleetOverviewViewProps {
  onSelectAircraftAndNavigate: (aircraftId: string) => void;
  onNavigateToCommandCenter: () => void;
}

interface FleetJet {
  id: string;
  tailCode: string;
  type: 'Rafale' | 'Tejas' | 'Su-30MKI' | 'MiG-29' | 'Mirage 2000';
  squadron: string;
  base: string;
  status: 'Ready' | 'Maintenance' | 'Attention';
  healthScore: number;
  flightHours: string;
  nextSortie: string;
  criticalIssue?: string;
}

export const FleetOverviewView: React.FC<FleetOverviewViewProps> = ({
  onSelectAircraftAndNavigate,
  onNavigateToCommandCenter,
}) => {
  const [metrics, setMetrics] = useState<CommanderFleetMetrics | null>(null);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    api.getCommanderFleetMetrics().then((data) => {
      if (data) setMetrics(data);
    });
  }, []);

  // Comprehensive fleet of jets across airbases
  const fleetJets: FleetJet[] = [
    {
      id: 'rafale-rb001',
      tailCode: 'RB-001',
      type: 'Rafale',
      squadron: 'No. 17 Golden Arrows',
      base: 'Ambala AFS',
      status: 'Ready',
      healthScore: 98,
      flightHours: '420 h',
      nextSortie: 'Today 14:30 IST (Patrol)',
    },
    {
      id: 'rafale-rb008',
      tailCode: 'RB-008',
      type: 'Rafale',
      squadron: 'No. 17 Golden Arrows',
      base: 'Ambala AFS',
      status: 'Attention',
      healthScore: 68,
      flightHours: '510 h',
      nextSortie: 'Grounded (Awaiting APU)',
      criticalIssue: 'APU Starter Generator shortage',
    },
    {
      id: 'rafale-eh014',
      tailCode: 'EH-014',
      type: 'Rafale',
      squadron: 'No. 101 Falcons',
      base: 'Hasimara AFS',
      status: 'Ready',
      healthScore: 94,
      flightHours: '380 h',
      nextSortie: 'Tomorrow 09:00 IST',
    },
    {
      id: 'tejas-la5001',
      tailCode: 'LA-5001',
      type: 'Tejas',
      squadron: 'No. 45 Flying Daggers',
      base: 'Sulur AFS',
      status: 'Ready',
      healthScore: 92,
      flightHours: '640 h',
      nextSortie: 'Today 16:00 IST',
    },
    {
      id: 'tejas-la5018',
      tailCode: 'LA-5018',
      type: 'Tejas',
      squadron: 'No. 45 Flying Daggers',
      base: 'Sulur AFS',
      status: 'Maintenance',
      healthScore: 78,
      flightHours: '720 h',
      nextSortie: 'Post-Overhaul Clearance Pending',
      criticalIssue: 'Completed 300-hr depot overhaul; awaiting Commander sign-off',
    },
    {
      id: 'tejas-la5021',
      tailCode: 'LA-5021',
      type: 'Tejas',
      squadron: 'No. 18 Flying Bullets',
      base: 'Sulur AFS',
      status: 'Ready',
      healthScore: 96,
      flightHours: '290 h',
      nextSortie: 'Ferry to Bareilly (Approved)',
    },
    {
      id: 'su30-sb122',
      tailCode: 'SB-122',
      type: 'Su-30MKI',
      squadron: 'No. 20 Lightning',
      base: 'Pune AFS',
      status: 'Maintenance',
      healthScore: 71,
      flightHours: '1,120 h',
      nextSortie: 'Bay 3 Structural Alignment',
      criticalIssue: 'Radar beam calibration bench queued',
    },
    {
      id: 'su30-sb145',
      tailCode: 'SB-145',
      type: 'Su-30MKI',
      squadron: 'No. 8 Pursoots',
      base: 'Bareilly AFS',
      status: 'Attention',
      healthScore: 64,
      flightHours: '980 h',
      nextSortie: 'Grounded (Bleed Valve)',
      criticalIssue: 'Turbofan bleed valve delayed from depot',
    },
    {
      id: 'su30-sb190',
      tailCode: 'SB-190',
      type: 'Su-30MKI',
      squadron: 'No. 222 Tigersharks',
      base: 'Thanjavur AFS',
      status: 'Ready',
      healthScore: 95,
      flightHours: '450 h',
      nextSortie: 'BrahMos Maritime Patrol',
    },
    {
      id: 'mig29-kb701',
      tailCode: 'KB-701',
      type: 'MiG-29',
      squadron: 'No. 47 Black Archers',
      base: 'Adampur AFS',
      status: 'Maintenance',
      healthScore: 72,
      flightHours: '1,420 h',
      nextSortie: 'Structural Assessment',
    },
    {
      id: 'mig29-kb715',
      tailCode: 'KB-715',
      type: 'MiG-29',
      squadron: 'No. 27 Flaming Arrows',
      base: 'Bhuj AFS',
      status: 'Ready',
      healthScore: 89,
      flightHours: '830 h',
      nextSortie: 'Combat Air Patrol 18:00',
    },
    {
      id: 'mirage-kf104',
      tailCode: 'KF-104',
      type: 'Mirage 2000',
      squadron: 'No. 1 Tigers',
      base: 'Gwalior AFS',
      status: 'Attention',
      healthScore: 66,
      flightHours: '1,280 h',
      nextSortie: 'Avionics Bench P1',
      criticalIssue: 'Waveguide RF loss on AESA radar antenna',
    },
  ];

  const types = ['All', 'Rafale', 'Tejas', 'Su-30MKI', 'MiG-29', 'Mirage 2000'];

  const filteredJets = fleetJets.filter((jet) => {
    const matchesType = selectedType === 'All' || jet.type === selectedType;
    const matchesStatus = statusFilter === 'All' || jet.status === statusFilter;
    const matchesQuery =
      searchQuery === '' ||
      jet.tailCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jet.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jet.squadron.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jet.base.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Fleet Overview</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              142 COMBAT AIRFRAMES
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet-wide airframe serviceability, predictive health scores & sortie readiness
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

      {/* Fleet Type Readiness Breakdown Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics?.readinessByType.map((item) => (
          <div
            key={item.type}
            onClick={() => setSelectedType(selectedType === item.type ? 'All' : item.type)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedType === item.type
                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{item.type}</span>
              <span className="text-xs font-mono font-bold text-slate-500">{item.count} Jets</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1 leading-none">
              {item.readiness}%
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${item.readiness >= 75 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${item.readiness}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedType === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['All', 'Ready', 'Maintenance', 'Attention'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tail, squadron, base..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Aircraft Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredJets.map((jet) => {
          const isReady = jet.status === 'Ready';
          const isMaint = jet.status === 'Maintenance';
          return (
            <div
              key={jet.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {jet.type}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {jet.tailCode}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-medium">{jet.base}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isReady
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isMaint
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {jet.status}
                  </span>
                </div>

                {/* Health Score Gauge */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Health Score</div>
                    <div className="text-sm font-black text-slate-900">{jet.healthScore}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Flight Hours</div>
                    <div className="text-xs font-mono font-bold text-slate-700">{jet.flightHours}</div>
                  </div>
                </div>

                {/* Squadron */}
                <div className="mt-2.5 text-[11px] font-semibold text-slate-600 truncate">
                  {jet.squadron}
                </div>

                {/* Next Flight / Status */}
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{jet.nextSortie}</span>
                </div>

                {/* Critical Issue Banner */}
                {jet.criticalIssue && (
                  <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-900 font-medium">
                    {jet.criticalIssue}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectAircraftAndNavigate(jet.id)}
                className="w-full mt-4 py-2 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open 3D Digital Twin</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
