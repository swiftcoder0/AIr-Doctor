import React from 'react';
import {
  Fan,
  Wind,
  Navigation,
  Gauge,
  CircleDot,
  Radio,
  Feather,
  ChevronRight,
  ArrowRight,
  Triangle,
  Layers,
} from 'lucide-react';
import { AircraftComponentData } from '../../types/aircraft';

interface ComponentStatusListProps {
  components: AircraftComponentData[];
  selectedComponent: AircraftComponentData | null;
  onSelectComponent: (component: AircraftComponentData) => void;
  onViewAll?: () => void;
}

export const ComponentStatusList: React.FC<ComponentStatusListProps> = ({
  components,
  selectedComponent,
  onSelectComponent,
  onViewAll,
}) => {
  // Map component categories/names to icons
  const getComponentIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('engine')) return Fan;
    if (lower.includes('intake')) return Wind;
    if (lower.includes('flight control') || lower.includes('surface')) return Navigation;
    if (lower.includes('hydraulic')) return Gauge;
    if (lower.includes('landing')) return CircleDot;
    if (lower.includes('radar') || lower.includes('nose')) return Radio;
    if (lower.includes('canard')) return Feather;
    if (lower.includes('wing')) return Feather;
    if (lower.includes('stabilizer') || lower.includes('tail')) return Triangle;
    return Layers;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Component Status
          </h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {components.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Rows */}
      <div className="space-y-1 overflow-y-auto max-h-[380px] pr-1 divide-y divide-slate-50">
        {components.map((comp) => {
          const Icon = getComponentIcon(comp.name);
          const isSelected = selectedComponent?.id === comp.id;
          const isAlert = comp.status === 'Maintenance Required';
          const isMonitor = comp.status === 'Monitor';

          return (
            <div
              key={comp.id}
              onClick={() => onSelectComponent(comp)}
              className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-50/80 border border-blue-200/80 shadow-xs'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              {/* Left: Icon & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isAlert
                      ? 'bg-rose-100 text-rose-600'
                      : isMonitor
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-xs font-medium truncate ${
                    isSelected ? 'font-bold text-blue-900' : 'text-slate-700'
                  }`}
                >
                  {comp.name}
                </span>
              </div>

              {/* Right: Health % & Status Badge */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-extrabold font-mono ${
                    isAlert
                      ? 'text-rose-600'
                      : isMonitor
                      ? 'text-amber-600'
                      : 'text-slate-800'
                  }`}
                >
                  {comp.health}%
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-center min-w-[62px] ${
                    isAlert
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : isMonitor
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {comp.status === 'Maintenance Required'
                    ? 'Required'
                    : comp.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
