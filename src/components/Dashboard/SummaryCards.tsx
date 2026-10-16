import React from 'react';
import { Plane, CheckCircle2, Wrench, AlertTriangle } from 'lucide-react';
import { FleetSummary } from '../../types/aircraft';

interface SummaryCardsProps {
  summary: FleetSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const cards = [
    {
      id: 'total',
      count: summary.totalAircraft.toString().padStart(2, '0'),
      title: 'Aircraft',
      subtitle: 'Total fleet under monitoring',
      icon: Plane,
      iconBg: 'bg-blue-50 text-blue-600',
      accentColor: 'border-l-blue-500',
    },
    {
      id: 'ready',
      count: summary.readyToFly.toString().padStart(2, '0'),
      title: 'Ready to Fly',
      subtitle: 'Operational and cleared',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      accentColor: 'border-l-emerald-500',
    },
    {
      id: 'maintenance',
      count: summary.inMaintenance.toString().padStart(2, '0'),
      title: 'In Maintenance',
      subtitle: 'Under scheduled or unscheduled maintenance',
      icon: Wrench,
      iconBg: 'bg-amber-50 text-amber-600',
      accentColor: 'border-l-amber-500',
    },
    {
      id: 'alerts',
      count: summary.attentionRequired.toString().padStart(2, '0'),
      title: 'Attention Required',
      subtitle: 'No critical alerts',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600',
      accentColor: 'border-l-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex items-center gap-4"
          >
            {/* Circular Icon Badge */}
            <div
              className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Metric details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {card.count}
                </span>
                <span className="text-sm font-bold text-slate-900 truncate">
                  {card.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
