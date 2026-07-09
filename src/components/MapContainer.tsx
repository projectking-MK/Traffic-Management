import { useState } from "react";
import { MapPin, Navigation, Siren, Eye, EyeOff, Radio } from "lucide-react";
import { TrafficRecord, EmergencyVehicle } from "../types";

interface MapContainerProps {
  junctions: TrafficRecord[];
  emergencies: EmergencyVehicle[];
  selectedJunction: TrafficRecord | null;
  onSelectJunction: (j: TrafficRecord) => void;
  isDark: boolean;
}

export default function MapContainer({
  junctions,
  emergencies,
  selectedJunction,
  onSelectJunction,
  isDark,
}: MapContainerProps) {
  const [showJunctions, setShowJunctions] = useState(true);
  const [showEmergencyRoutes, setShowEmergencyRoutes] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);

  // Helper to resolve colors for congestion levels
  const getCongestionColorClass = (level: string) => {
    switch (level) {
      case "Severe":
        return "bg-rose-500 text-rose-500 border-rose-300 ring-rose-400";
      case "Heavy":
        return "bg-amber-500 text-amber-500 border-amber-300 ring-amber-400";
      case "Moderate":
        return "bg-indigo-500 text-indigo-500 border-indigo-300 ring-indigo-400";
      default:
        return "bg-emerald-500 text-emerald-500 border-emerald-300 ring-emerald-400";
    }
  };

  // Convert GPS coordinates into scaled layout percentages for visual plotting
  const getPosition = (latitude: number, longitude: number) => {
    // Chennai-bound bounding box scaling to plot within container
    // Lat range roughly: 12.95 to 13.08
    // Lon range roughly: 80.20 to 80.27
    const minLat = 12.97;
    const maxLat = 13.07;
    const minLon = 80.21;
    const maxLon = 80.27;

    let y = 100 - ((latitude - minLat) / (maxLat - minLat)) * 100;
    let x = ((longitude - minLon) / (maxLon - minLon)) * 100;

    // Safety clamps
    x = Math.max(8, Math.min(92, x));
    y = Math.max(8, Math.min(92, y));

    return { top: `${y}%`, left: `${x}%` };
  };

  return (
    <div className={`relative h-[480px] w-full rounded-3xl border overflow-hidden transition-all duration-300 shadow-inner ${
      isDark ? "bg-slate-950 border-slate-800/85" : "bg-slate-100 border-slate-200"
    }`} id="traffic-gis-map-component">
      
      {/* 1. Map GIS Status Overlay Header */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-between items-center gap-3 z-10">
        <div className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-md backdrop-blur-md ${
          isDark ? "bg-slate-900/40 text-white border-slate-800/80" : "bg-white/90 text-slate-800 border-slate-100"
        }`}>
          <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          Tamil Nadu Smart GIS Telemetry Grid
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJunctions(!showJunctions)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all ${
              showJunctions 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25" 
                : isDark ? "bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800/50" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
            title="Toggle Junction Signals"
            id="toggle-junctions-btn"
          >
            {showJunctions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Signals
          </button>

          <button
            onClick={() => setShowEmergencyRoutes(!showEmergencyRoutes)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all ${
              showEmergencyRoutes 
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/25" 
                : isDark ? "bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800/50" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
            title="Toggle Emergency Dispatch Blueprints"
            id="toggle-emergency-btn"
          >
            <Siren className="w-3.5 h-3.5" />
            Siren Vehicles
          </button>

          <button
            onClick={() => setShowGridLines(!showGridLines)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all ${
              showGridLines 
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25" 
                : isDark ? "bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800/50" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
            title="Toggle City Grid Mesh Lines"
            id="toggle-mesh-btn"
          >
            <Navigation className="w-3.5 h-3.5 rotate-45" />
            Grid lines
          </button>
        </div>
      </div>

      {/* 2. Abstract Grid Line Network / Roads Representation */}
      {showGridLines && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" id="map-grid-mesh-lines">
          {/* Main Road Channels */}
          <line x1="10%" y1="50%" x2="90%" y2="50%" stroke={isDark ? "#334155" : "#9CA3AF"} strokeWidth="4" strokeDasharray="6 4" />
          <line x1="50%" y1="10%" x2="50%" y2="90%" stroke={isDark ? "#334155" : "#9CA3AF"} strokeWidth="4" strokeDasharray="6 4" />
          <line x1="20%" y1="20%" x2="80%" y2="80%" stroke={isDark ? "#334155" : "#9CA3AF"} strokeWidth="2" strokeDasharray="10 5" />
          <line x1="15%" y1="80%" x2="85%" y2="20%" stroke={isDark ? "#334155" : "#9CA3AF"} strokeWidth="2" strokeDasharray="10 5" />
          
          {/* Outer Ring Road Link */}
          <circle cx="50%" cy="50%" r="35%" fill="none" stroke={isDark ? "#1e293b" : "#D1D5DB"} strokeWidth="2" strokeDasharray="12 6" />
          <circle cx="50%" cy="50%" r="20%" fill="none" stroke={isDark ? "#1e293b" : "#D1D5DB"} strokeWidth="1.5" />
        </svg>
      )}

      {/* 3. Render Junction Nodes */}
      {showJunctions && junctions.map((j) => {
        const coords = getPosition(j.junction_latitude, j.junction_longitude);
        const colorClass = getCongestionColorClass(j.congestion_level);
        const isSelected = selectedJunction?.id === j.id;

        return (
          <div
            key={`map-j-${j.id}`}
            style={{ top: coords.top, left: coords.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
            id={`junction-marker-group-${j.id}`}
          >
            {/* Pulsating outer signal boundary */}
            <span className={`absolute inline-flex h-10 w-10 rounded-full opacity-35 animate-ping -left-3 -top-3 ${colorClass}`} />
            
            {/* Interactive signal marker dot */}
            <button
              onClick={() => onSelectJunction(j)}
              className={`relative flex items-center justify-center w-6.5 h-6.5 rounded-full border-2 shadow-lg transition-all duration-300 ${colorClass} ${
                isSelected 
                  ? "scale-135 ring-4 border-white dark:border-slate-900 ring-indigo-500/50" 
                  : "hover:scale-120 hover:ring-2"
              }`}
              id={`junction-marker-${j.id}`}
            >
              <MapPin className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Hover Tooltip / Detail Float */}
            <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-48 p-3 rounded-2xl border shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 scale-90 group-hover:scale-100 backdrop-blur-md ${
              isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}>
              <p className="text-[11px] font-bold truncate text-slate-200">{j.junction_name}</p>
              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  Density: <strong className={j.congestion_level === "Severe" ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{j.traffic_density}%</strong>
                </span>
                <span>{j.vehicle_count} Veh</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* 4. Render Emergency Vehicles */}
      {showEmergencyRoutes && emergencies.map((ev) => {
        // Resolve closest junction coordinates or plot standard offsets
        let lat = 13.0100;
        let lon = 80.2500;
        if (ev.current_junction_id) {
          const match = junctions.find(j => j.junction_id === ev.current_junction_id);
          if (match) {
            // Give slight coordinate offset so they don't overlay exactly on top of signals
            lat = match.junction_latitude + 0.003;
            lon = match.junction_longitude - 0.003;
          }
        } else {
          // Absolute random placements
          lat = 13.025 + (ev.id * 0.005);
          lon = 80.225 + (ev.id * 0.006);
        }

        const coords = getPosition(lat, lon);

        return (
          <div
            key={`map-ev-${ev.id}`}
            style={{ top: coords.top, left: coords.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-30"
            id={`emergency-vehicle-marker-${ev.id}`}
          >
            {/* Blinking blue/red emergency halo rings */}
            <span className="absolute inline-flex h-12 w-12 rounded-full opacity-20 animate-ping -left-4 -top-4 bg-rose-600" />
            <span className="absolute inline-flex h-8 w-8 rounded-full opacity-35 animate-pulse -left-2 -top-2 bg-indigo-600" />

            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-rose-600 text-white border-2 border-white dark:border-slate-900 shadow-md">
              <Siren className="w-4 h-4 animate-bounce" />
            </div>

            {/* Hover Tooltip / Route details */}
            <div className={`absolute top-9 left-1/2 -translate-x-1/2 w-48 p-3 rounded-2xl border shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 backdrop-blur-md ${
              isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400">
                <Siren className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                {ev.vehicle_type} Priority
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-1 truncate">Plate: {ev.vehicle_number}</p>
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-500 leading-normal">
                <strong>From:</strong> {ev.route_from}<br />
                <strong>To:</strong> {ev.route_to}
              </div>
            </div>
          </div>
        );
      })}

      {/* 5. GIS Map Key / Legend */}
      <div className={`absolute bottom-4 right-4 p-4 rounded-2xl border backdrop-blur-md shadow-lg text-[10px] flex flex-col gap-1.5 z-10 ${
        isDark ? "bg-slate-900/90 border-slate-800/80 text-slate-300" : "bg-white/95 border-slate-200 text-slate-600"
      }`} id="map-legend-card">
        <div className="font-bold border-b pb-1.5 mb-1.5 border-slate-800/80 text-slate-400">Congestion Levels</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Severe (&gt; 90% Density)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Heavy (70% - 90% Density)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          <span>Moderate (40% - 70% Density)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Light (0% - 40% Density)</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-800/80">
          <span className="w-2.5 h-2.5 bg-rose-600 rounded flex items-center justify-center text-white text-[7px]">🚨</span>
          <span>Active Priority Sirens</span>
        </div>
      </div>
    </div>
  );
}
