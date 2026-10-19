import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plane,
  AlertTriangle,
  ArrowRight,
  Shield,
  Activity,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { CommanderAirbase, AirbaseCommand } from '../../types/aircraft';
import { api } from '../../services/apiClient';

interface BaseOperationsViewProps {
  onNavigateToCommandCenter: () => void;
}

export const BaseOperationsView: React.FC<BaseOperationsViewProps> = ({
  onNavigateToCommandCenter,
}) => {
  const [airbases, setAirbases] = useState<CommanderAirbase[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBaseModal, setSelectedBaseModal] = useState<CommanderAirbase | null>(null);

  useEffect(() => {
    api.getCommanderAirbases().then((data) => {
      if (data) setAirbases(data);
    });
  }, []);

  const commands: (AirbaseCommand | 'All')[] = [
    'All',
    'Western',
    'Northern',
    'Central',
    'Eastern',
    'Southern',
    'South Western',
  ];

  const filteredBases = airbases.filter((b) => {
    const matchesCmd = selectedCommand === 'All' || b.command === selectedCommand;
    const matchesQuery =
      searchQuery === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.squadrons.some((sq) => sq.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCmd && matchesQuery;
  });

  const getStatusBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in_progress':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'normal':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Base Operations</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              26 AIR FORCE STATIONS
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status, station commanders, squadron deployments and airfield readiness
          </p>
        </div>

        <button
          onClick={onNavigateToCommandCenter}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <span>Return to Tactical Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        {/* Command Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {commands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => setSelectedCommand(cmd)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCommand === cmd
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cmd === 'All' ? 'All Commands (26)' : cmd}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search base, code, squadron..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Airbase Cards Grid (26 Airbases) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBases.map((base) => (
          <div
            key={base.id}
            onClick={() => setSelectedBaseModal(base)}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              {/* Header with Name & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {base.command} Command
                  </span>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {base.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{base.code}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
                    base.statusLevel
                  )}`}
                >
                  {base.status}
                </span>
              </div>

              {/* Station Commander & Readiness */}
              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Station Commander</div>
                  <div className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                    {base.commanderName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-slate-900 leading-none">
                    {base.readinessPct}%
                  </div>
                  <div className="text-[9px] font-bold text-slate-400">READY</div>
                </div>
              </div>

              {/* Squadron Pills */}
              <div className="mt-2.5 space-y-1">
                {base.squadrons.map((sq, i) => (
                  <div
                    key={i}
                    className="text-[10px] px-2 py-1 rounded-lg bg-blue-50/60 text-blue-900 border border-blue-100 font-medium truncate"
                  >
                    {sq}
                  </div>
                ))}
              </div>

              {/* Aircraft Stats Bar */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="p-1.5 bg-slate-50 rounded-lg">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Total</div>
                  <div className="font-black text-slate-900">{base.totalAircraft}</div>
                </div>
                <div className="p-1.5 bg-emerald-50 rounded-lg">
                  <div className="text-[9px] text-emerald-600 font-bold uppercase">Ready</div>
                  <div className="font-black text-emerald-700">{base.serviceable}</div>
                </div>
                <div className="p-1.5 bg-orange-50 rounded-lg">
                  <div className="text-[9px] text-orange-600 font-bold uppercase">Maint</div>
                  <div className="font-black text-orange-700">{base.underMaintenance}</div>
                </div>
              </div>

              {/* Active Blocker if any */}
              {base.blockers && base.blockers.length > 0 && (
                <div className="mt-2.5 p-2 bg-amber-50 rounded-lg border border-amber-200/80 text-[10px] text-amber-900 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{base.blockers[0]}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-600 group-hover:text-blue-800">
              <span>View Station Briefing</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Station Modal */}
      {selectedBaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {selectedBaseModal.command} Air Command
                </span>
                <h2 className="text-lg font-black text-slate-900">{selectedBaseModal.name}</h2>
                <div className="text-xs font-mono text-slate-500">ICAO/Code: {selectedBaseModal.code}</div>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                  selectedBaseModal.statusLevel
                )}`}
              >
                {selectedBaseModal.status}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                Commander: <strong>{selectedBaseModal.commanderName}</strong>
              </div>
              <div>
                Last Tactical Inspection: <strong>{selectedBaseModal.lastInspection}</strong>
              </div>
              <div>
                Coordinates: <strong>{selectedBaseModal.lat.toFixed(3)}° N, {selectedBaseModal.lng.toFixed(3)}° E</strong>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase">Aircraft Breakdown</div>
              {selectedBaseModal.aircraftBreakdown.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800">{item.type}</span>
                  <span className="font-mono text-slate-600">
                    <strong className="text-emerald-700">{item.serviceable}</strong> ready • {item.maintenance} maint • {item.grounded} grounded (Total {item.total})
                  </span>
                </div>
              ))}
            </div>

            <div className="text-right pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedBaseModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close Station View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
