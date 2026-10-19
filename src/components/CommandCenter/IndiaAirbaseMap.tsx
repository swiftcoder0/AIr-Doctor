import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Building2, ZoomIn, ZoomOut, LocateFixed, Search } from 'lucide-react';
import { CommanderAirbase, AirbaseCommand } from '../../types/aircraft';

interface IndiaAirbaseMapProps {
  airbases: CommanderAirbase[];
  selectedBaseId: string;
  onSelectBase: (base: CommanderAirbase) => void;
}

export const IndiaAirbaseMap: React.FC<IndiaAirbaseMapProps> = ({
  airbases,
  selectedBaseId,
  onSelectBase,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [selectedCommand, setSelectedCommand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const commands: (AirbaseCommand | 'All')[] = [
    'All',
    'Western',
    'Northern',
    'Central',
    'Eastern',
    'Southern',
    'South Western',
  ];

  // Dynamically calculate base counts per command
  const commandCounts = useMemo(() => {
    const counts: Record<string, number> = { All: airbases.length };
    airbases.forEach((b) => {
      counts[b.command] = (counts[b.command] || 0) + 1;
    });
    return counts;
  }, [airbases]);

  // Filter airbases based on command pill and search query
  const filteredAirbases = useMemo(() => {
    return airbases.filter((base) => {
      const matchesCommand = selectedCommand === 'All' || base.command === selectedCommand;
      const matchesSearch =
        searchQuery === '' ||
        base.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        base.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        base.command.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCommand && matchesSearch;
    });
  }, [airbases, selectedCommand, searchQuery]);

  // Status to Color Mapping matching light theme specification
  const getStatusColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#EF4444'; // Red
      case 'warning':
        return '#F59E0B'; // Amber (Spares Needed)
      case 'in_progress':
        return '#F97316'; // Orange (Maintenance)
      case 'normal':
      default:
        return '#10B981'; // Emerald Green (Operational)
    }
  };

  // Prominent bases that show persistent name badges matching reference screenshot
  const prominentBaseIds = useMemo(
    () => new Set(['ambala', 'pune', 'leh', 'gwalior', 'sulur', 'hasimara']),
    []
  );

  // Initialize Leaflet Map with Clean Light CartoDB Positron Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 79.8],
        zoom: 4.8,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // ESRI World Light Gray Base - Free, clean, light aesthetic without any API key or watermarks
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep instance intact across renders
    };
  }, []);

  // Sync Markers whenever filteredAirbases or selectedBaseId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    filteredAirbases.forEach((base) => {
      const isSelected = base.id === selectedBaseId;
      const showBadge = prominentBaseIds.has(base.id) || isSelected;
      const color = getStatusColor(base.statusLevel);

      // Create Custom SVG Marker HTML matching the reference image
      const markerHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
          ${
            isSelected
              ? `<div style="position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); width: 36px; height: 36px; border-radius: 50%; background: ${color}22; border: 2px solid ${color}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                 <div style="position: absolute; top: -14px; left: -14px; width: 20px; height: 20px; background: #2563EB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 2px solid white; z-index: 10;">
                   ✈
                 </div>`
              : ''
          }
          <div style="width: ${isSelected ? '22px' : '18px'}; height: ${
            isSelected ? '22px' : '18px'
          }; border-radius: 50%; background: #FFFFFF; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.22); transition: transform 0.2s ease;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></div>
          </div>
          ${
            showBadge
              ? `<div style="margin-top: 3px; background: #0F172A; color: #FFFFFF; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont; font-weight: 700; font-size: 10px; padding: 2px 7px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(15,23,42,0.35); border: 1px solid rgba(255,255,255,0.15); pointer-events: none;">
                  ${base.name}
                </div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-airbase-pin',
        html: markerHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([base.lat, base.lng], { icon: customIcon }).addTo(map);

      // Bind rich tactical tooltip
      const tooltipContent = `
        <div style="font-family: ui-sans-serif, system-ui; padding: 5px 8px; color: #0F172A; background: #FFFFFF; border-radius: 10px; border: 1px solid #CBD5E1; box-shadow: 0 4px 12px rgba(0,0,0,0.12); min-width: 130px;">
          <div style="font-weight: 800; font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <span>${base.name}</span>
            <span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: #F1F5F9; color: #475569; font-weight: 700;">${base.command}</span>
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 3px;">
            Readiness: <strong style="color: ${color}; font-weight: 800;">${base.readinessPct}%</strong> • ${base.serviceable}/${base.totalAircraft} Jets
          </div>
          <div style="font-size: 9px; color: #334155; margin-top: 2px; font-weight: 600;">
            Status: <span style="color: ${color};">${base.status}</span>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -14],
        opacity: 0.98,
        className: 'clean-light-map-tooltip',
      });

      marker.on('click', () => {
        onSelectBase(base);
      });

      markersRef.current[base.id] = marker;
    });
  }, [filteredAirbases, selectedBaseId, prominentBaseIds, onSelectBase]);

  // Center on Selected Base when selectedBaseId changes externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const currentBase = airbases.find((b) => b.id === selectedBaseId);
    if (currentBase) {
      map.panTo([currentBase.lat, currentBase.lng], { animate: true, duration: 0.6 });
    }
  }, [selectedBaseId, airbases]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleReset = () => {
    mapInstanceRef.current?.setView([22.8, 79.8], 4.8, { animate: true });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col relative h-[520px]">
      {/* Top Bar Header matching Reference Image */}
      <div className="p-3.5 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-tight">
              Airbases Across India
            </div>
            <p className="text-[11px] text-slate-500">Operational status and fleet deployment</p>
          </div>
        </div>

        {/* Command Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {commands.map((cmd) => {
            const count = commandCounts[cmd] || 0;
            const isSelected = selectedCommand === cmd;
            return (
              <button
                key={cmd}
                onClick={() => setSelectedCommand(cmd)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {cmd} {count > 0 && <span className="opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaflet Light Map Container */}
      <style>{`
        .leaflet-container {
          background-color: #E2E8F0 !important;
        }
        .clean-light-map-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .clean-light-map-tooltip .leaflet-tooltip-content {
          margin: 0 !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="flex-1 w-full relative z-0" />

      {/* Floating Zoom Controls (Top Left) matching Reference Screenshot */}
      <div className="absolute top-20 left-4 z-10 flex flex-col gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-md">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors font-bold text-sm cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors font-bold text-sm cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          title="Reset to India View"
          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <LocateFixed className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map Legend (Bottom Left) matching Reference Screenshot */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-2xl p-3 shadow-md text-xs text-slate-700 space-y-1.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="text-[11px] font-semibold text-slate-800">Operational</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
          <span className="text-[11px] font-semibold text-slate-800">Spares Needed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
          <span className="text-[11px] font-semibold text-slate-800">Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
          <span className="text-[11px] font-semibold text-slate-800">Critical / Grounded</span>
        </div>
      </div>
    </div>
  );
};
