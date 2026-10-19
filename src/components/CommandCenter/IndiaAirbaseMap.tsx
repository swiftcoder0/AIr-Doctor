import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Search, ZoomIn, ZoomOut, RotateCcw, MapPin, Shield } from 'lucide-react';
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

  // Status to Color Mapping
  const getStatusColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#EF4444'; // Red
      case 'warning':
        return '#F59E0B'; // Amber
      case 'in_progress':
        return '#F97316'; // Orange
      case 'normal':
      default:
        return '#10B981'; // Emerald
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 79.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // Standard Free OpenStreetMap Tiles with Tactical Dark Filter (Zero API Key Required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        className: 'tactical-dark-osm-tiles',
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      mapInstanceRef.current = map;
    }


    return () => {
      // Don't destroy map on every re-render; we keep instance alive
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
      const color = getStatusColor(base.statusLevel);

      // Create Custom SVG Marker HTML
      const markerHtml = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isSelected
              ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: ${color}33; border: 1.5px solid ${color}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #0F172A; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
            <div style="width: 7px; height: 7px; border-radius: 50%; background: ${color};"></div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-airbase-pin',
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([base.lat, base.lng], { icon: customIcon }).addTo(map);

      // Bind rich tactical tooltip
      const tooltipContent = `
        <div style="font-family: ui-sans-serif, system-ui; padding: 4px 6px; color: #F8FAFC; background: #0F172A; border-radius: 8px; border: 1px solid #334155;">
          <div style="font-weight: 800; font-size: 11px; display: flex; align-items: center; gap: 4px;">
            <span>${base.name}</span>
            <span style="font-size: 9px; padding: 1px 4px; border-radius: 4px; background: #1E293B; color: #94A3B8;">${base.command}</span>
          </div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">
            Readiness: <strong style="color: ${color};">${base.readinessPct}%</strong> • ${base.serviceable}/${base.totalAircraft} Jets
          </div>
          <div style="font-size: 9px; color: #CBD5E1; margin-top: 1px;">
            Status: <span style="color: ${color}; font-weight: 600;">${base.status}</span>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95,
        className: 'tactical-map-tooltip',
      });

      marker.on('click', () => {
        onSelectBase(base);
      });

      markersRef.current[base.id] = marker;
    });
  }, [filteredAirbases, selectedBaseId, onSelectBase]);

  // Center on Selected Base when selectedBaseId changes externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const currentBase = airbases.find((b) => b.id === selectedBaseId);
    if (currentBase) {
      map.panTo([currentBase.lat, currentBase.lng], { animate: true, duration: 0.8 });
    }
  }, [selectedBaseId, airbases]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleReset = () => {
    mapInstanceRef.current?.setView([22.8, 79.5], 5, { animate: true });
  };

  return (
    <div className="bg-[#0B132B] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col relative h-[560px]">
      {/* Map Top Bar */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 z-10 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span>Airbases Across India</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 font-bold">
                {filteredAirbases.length} BASES
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Interactive strategic operational deployment</p>
          </div>
        </div>

        {/* Command Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          {commands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => setSelectedCommand(cmd)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight transition-all shrink-0 ${
                selectedCommand === cmd
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
              }`}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[160px] max-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search base or code..."
            className="w-full pl-8 pr-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <style>{`
        .tactical-dark-osm-tiles .leaflet-tile {
          filter: brightness(0.6) invert(1) contrast(2.6) hue-rotate(200deg) saturate(0.35) brightness(0.72) !important;
        }
        .leaflet-container {
          background-color: #0B132B !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="flex-1 w-full relative z-0" />


      {/* Floating Tactical Zoom Controls */}
      <div className="absolute top-16 right-3 z-10 flex flex-col gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-xs">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          title="Reset View"
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map Bottom Legend matching Aerospace Styling */}
      <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300 z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" /> Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]"></span>
            <span>Operational (≥75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#F59E0B]"></span>
            <span>Spares Needed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_#F97316]"></span>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#EF4444]"></span>
            <span>Critical Grounded</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono hidden md:block">
          SURVEILLANCE GRID • TACTICAL WGS-84
        </div>
      </div>
    </div>
  );
};
