import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';
import { LogisticsInventoryItem } from '../../types/aircraft';

interface StockLocationInfo {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  role: string;
  stockQty: number;
  reservedQty: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface StockAvailabilityMapProps {
  selectedPart: LogisticsInventoryItem | null;
  selectedLocation: string | null;
  onSelectLocation: (locationName: string) => void;
  inventoryList: LogisticsInventoryItem[];
}

export const StockAvailabilityMap: React.FC<StockAvailabilityMapProps> = ({
  selectedPart,
  selectedLocation,
  onSelectLocation,
  inventoryList,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);

  const [hasMapError, setHasMapError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 5 configured IAF demo logistics nodes
  const locationsData: StockLocationInfo[] = useMemo(() => {
    // If a part is selected, compute stock at each location for this part
    const partNum = selectedPart?.part_number;

    const baseConfigs = [
      { id: 'ambala', name: 'AFS Ambala', code: 'AMB', lat: 30.378, lng: 76.776, role: 'Forward Base / Depot', defaultQty: 4, defaultRes: 1 },
      { id: 'chandigarh', name: 'ASP Chandigarh', code: 'IXC', lat: 30.733, lng: 76.779, role: 'Air Support Park', defaultQty: 3, defaultRes: 0 },
      { id: 'hasimara', name: 'AFS Hasimara', code: 'HAS', lat: 26.704, lng: 89.370, role: 'Eastern Combat Base', defaultQty: 1, defaultRes: 1 },
      { id: 'pune', name: 'AFS Pune', code: 'PNQ', lat: 18.582, lng: 73.919, role: 'Air Force Station', defaultQty: 6, defaultRes: 2 },
      { id: 'sulur', name: 'BRD Sulur', code: 'SLR', lat: 11.013, lng: 77.161, role: 'Base Repair Depot', defaultQty: 2, defaultRes: 0 },
    ];

    return baseConfigs.map((b) => {
      // Find matching item in inventoryList for this base and part
      let usable = b.defaultQty;
      let reserved = b.defaultRes;

      if (partNum) {
        const match = inventoryList.find(
          (inv) => inv.part_number === partNum && inv.location.toLowerCase().includes(b.name.toLowerCase().split(' ')[1])
        );
        if (match) {
          usable = match.usable_qty;
          reserved = match.reserved_qty;
        }
      }

      let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
      if (usable === 0) status = 'Out of Stock';
      else if (usable <= 2) status = 'Low Stock';

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        lat: b.lat,
        lng: b.lng,
        role: b.role,
        stockQty: usable,
        reservedQty: reserved,
        status: status,
      };
    });
  }, [selectedPart, inventoryList]);

  // Leaflet initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [22.8, 80.0],
          zoom: 4.4,
          minZoom: 3.5,
          maxZoom: 9,
          zoomControl: false,
          attributionControl: false,
        });

        // CartoDB Positron clean light tiles
        const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c', 'd'],
        });

        tileLayer.on('tileerror', () => {
          // If network error, set graceful fallback
          // Do not throw uncaught error
        });

        tileLayer.addTo(map);
        mapInstanceRef.current = map;
      }
    } catch (err: any) {
      setHasMapError(true);
      setErrorMessage(err?.message || 'Failed to initialize mapping engine.');
    }

    return () => {
      // Keep map instance intact across tab changes
    };
  }, []);

  // Sync Markers and Transfer Arcs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || hasMapError) return;

    try {
      // Clear old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      // Draw logistics corridor connecting AFS Ambala -> ASP Chandigarh -> AFS Hasimara -> AFS Pune -> BRD Sulur
      const corridorPoints: L.LatLngExpression[] = [
        [30.378, 76.776], // Ambala
        [30.733, 76.779], // Chandigarh
        [26.704, 89.370], // Hasimara
        [18.582, 73.919], // Pune
        [11.013, 77.161], // Sulur
        [30.378, 76.776], // Loop to Ambala
      ];

      const polyline = L.polyline(corridorPoints, {
        color: '#3B82F6',
        weight: 1.5,
        dashArray: '4, 6',
        opacity: 0.6,
      }).addTo(map);
      polylineRef.current = polyline;

      // Add Markers
      locationsData.forEach((loc) => {
        const isSelected = selectedLocation === loc.name || (selectedPart && selectedPart.location === loc.name);
        const color = loc.status === 'In Stock' ? '#10B981' : loc.status === 'Low Stock' ? '#F59E0B' : '#EF4444';

        const markerHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
            ${
              isSelected
                ? `<div style="position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); width: 34px; height: 34px; border-radius: 50%; background: ${color}22; border: 2px solid ${color}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="width: ${isSelected ? '20px' : '16px'}; height: ${
          isSelected ? '20px' : '16px'
        }; border-radius: 50%; background: #FFFFFF; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
              <div style="width: 5px; height: 5px; border-radius: 50%; background: ${color};"></div>
            </div>
            <div style="margin-top: 3px; background: rgba(15, 23, 42, 0.92); color: #FFFFFF; font-family: ui-sans-serif, system-ui; font-weight: 700; font-size: 9px; padding: 2px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); pointer-events: none; display: flex; align-items: center; gap: 4px;">
              <span>${loc.name}</span>
              <span style="color: ${color}; font-weight: 900;">Qty: ${loc.stockQty}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-stock-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          onSelectLocation(loc.name);
        });

        markersRef.current[loc.id] = marker;
      });
    } catch {
      // Graceful error handling
    }
  }, [locationsData, selectedLocation, selectedPart, hasMapError, onSelectLocation]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleReset = () => {
    mapInstanceRef.current?.setView([22.8, 80.0], 4.4);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between h-full">
      {/* Header & Legend */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-black text-slate-900 tracking-tight">
            Stock Availability Across Locations
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {selectedPart ? (
              <span>
                Showing <strong>{selectedPart.part_number}</strong> ({selectedPart.description})
              </span>
            ) : (
              <span>Overview of configured depot nodes &amp; airbases</span>
            )}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>In Stock</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Low Stock</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Out of Stock</span>
          </span>
        </div>
      </div>

      {/* Map Viewport or Graceful Fallback */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50">
        {hasMapError ? (
          /* Graceful Schematic Fallback Map */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-700 space-y-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <div className="text-xs font-bold text-slate-900">Interactive Map Tile Offline</div>
            <p className="text-[10px] text-slate-500 text-center max-w-xs">
              External map tiles are currently unreachable. Displaying local schematic layout of configured bases.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-sm text-[10px]">
              {locationsData.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => onSelectLocation(loc.name)}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-left hover:border-blue-400"
                >
                  <div className="font-bold text-slate-800">{loc.name}</div>
                  <div className="text-slate-500">Qty: {loc.stockQty} • {loc.status}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setHasMapError(false);
                setErrorMessage('');
              }}
              className="mt-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-blue-600 flex items-center gap-1 shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Map</span>
            </button>
          </div>
        ) : (
          <>
            {/* Real Interactive Leaflet Container */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Zoom & Reset Controls */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom in"
                className="w-6 h-6 rounded-lg bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom out"
                className="w-6 h-6 rounded-lg bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Reset view"
                className="w-6 h-6 rounded-lg bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Compact Location Summary Beneath Map */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="font-semibold text-slate-700">Configured Hubs: 5 Bases</span>
        <span>Source: Local Inventory Registry (Demo)</span>
      </div>
    </div>
  );
};
