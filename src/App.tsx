import { useState, useEffect, FormEvent } from "react";
import { 
  Building2, Moon, Sun, Lock, Unlock, RefreshCw, Search, 
  MapPin, Sliders, LineChart, Shield, HelpCircle, AlertTriangle, 
  Car, Compass, Eye, ServerCrash, ArrowDownToLine, Zap, HelpCircle as HelpIcon 
} from "lucide-react";
import { TrafficRecord, EmergencyVehicle, Report, AnalyticsData, City, District, Area } from "./types";
import MapContainer from "./components/MapContainer";
import PredictionPanel from "./components/PredictionPanel";
import AnalyticsCharts from "./components/AnalyticsCharts";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<"control" | "analytics" | "admin">("control");

  // Database lists
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Real-time Traffic feeds
  const [allTraffic, setAllTraffic] = useState<TrafficRecord[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyVehicle[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Selector filters
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Focus state
  const [selectedJunction, setSelectedJunction] = useState<TrafficRecord | null>(null);

  // Login credentials state
  const [adminEmail, setAdminEmail] = useState("admin@tamilnadu.gov.in");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem("tn_traffic_admin_token") || "");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Load database resources
  useEffect(() => {
    fetchAuxiliaryData();
    fetchTrafficFeed();
    fetchEmergencies();
    fetchAnalytics();
  }, []);

  // Sync dependent dropdown cascades
  useEffect(() => {
    if (selectedCityId) {
      fetchDistricts(Number(selectedCityId));
      setSelectedDistrictId("");
      setSelectedAreaId("");
      setAreas([]);
    } else {
      setDistricts([]);
      setAreas([]);
      setSelectedDistrictId("");
      setSelectedAreaId("");
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (selectedDistrictId) {
      fetchAreas(Number(selectedDistrictId));
      setSelectedAreaId("");
    } else {
      setAreas([]);
      setSelectedAreaId("");
    }
  }, [selectedDistrictId]);

  // Fetch helper APIs
  const fetchAuxiliaryData = async () => {
    try {
      const resCities = await fetch("/api/cities");
      if (resCities.ok) {
        const data = await resCities.json();
        setCities(data);
      }

      const resReports = await fetch("/api/reports");
      if (resReports.ok) {
        const data = await resReports.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Auxiliary load failed", err);
    }
  };

  const fetchDistricts = async (cityId: number) => {
    try {
      const res = await fetch(`/api/districts?city_id=${cityId}`);
      if (res.ok) {
        const data = await res.json();
        setDistricts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAreas = async (districtId: number) => {
    try {
      const res = await fetch(`/api/areas?district_id=${districtId}`);
      if (res.ok) {
        const data = await res.json();
        setAreas(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrafficFeed = async () => {
    setLoading(true);
    setApiError("");
    try {
      // Build filter query parameters matching user filters
      let query = "/api/traffic?";
      if (selectedCityId) query += `city_id=${selectedCityId}&`;
      if (selectedDistrictId) query += `district_id=${selectedDistrictId}&`;
      if (selectedAreaId) query += `area_id=${selectedAreaId}&`;

      const res = await fetch(query);
      if (!res.ok) throw new Error("Could not fetch grid sensor telemetry from the SQL server");
      const data = await res.json();
      setAllTraffic(data);

      // Re-establish focus on refresh if any
      if (selectedJunction) {
        const updated = data.find((j: TrafficRecord) => j.id === selectedJunction.id);
        if (updated) setSelectedJunction(updated);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to contact database");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencies = async () => {
    try {
      const res = await fetch("/api/emergency");
      if (res.ok) {
        const data = await res.json();
        setEmergencies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perform secure REST admin authentication
  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid authority credentials");
      }

      setAdminToken(data.token);
      localStorage.setItem("tn_traffic_admin_token", data.token);
      setActiveView("admin");
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken("");
    localStorage.removeItem("tn_traffic_admin_token");
    setActiveView("control");
  };

  const triggerExportCSV = () => {
    if (allTraffic.length === 0) return;
    
    // Convert current selected telemetry to CSV format
    const headers = ["Junction", "City", "Area", "Vehicles Count", "Average Speed (km/h)", "Expected Delay (mins)", "Density (%)", "Congestion Level", "Last Updated"];
    const rows = allTraffic.map(j => [
      j.junction_name,
      j.city_name,
      j.area_name,
      j.vehicle_count,
      j.avg_speed,
      j.expected_delay_mins,
      j.traffic_density,
      j.congestion_level,
      j.updated_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TamilNadu_Traffic_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live filtered records based on search query
  const filteredTraffic = allTraffic.filter(item => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      item.junction_name.toLowerCase().includes(term) ||
      item.area_name.toLowerCase().includes(term) ||
      item.congestion_level.toLowerCase().includes(term)
    );
  });

  // Calculate severe zones
  const severeZonesCount = allTraffic.filter(j => j.congestion_level === "Severe" || j.congestion_level === "Heavy").length;
  const totalVehiclesCount = allTraffic.reduce((acc, curr) => acc + curr.vehicle_count, 0);

  return (
    <div className={`min-h-screen font-sans antialiased transition-all duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
    }`} id="main-application-frame">
      
      {/* 1. Official Government Header & Navigation */}
      <header className={`border-b transition-colors sticky top-0 z-40 backdrop-blur-md ${
        isDark ? "bg-slate-950/85 border-slate-800/80" : "bg-white/90 border-slate-200"
      }`} id="app-global-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo Brand Frame */}
          <div className="flex items-center gap-3.5" id="nav-brand-logo">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
              <Building2 className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-950 animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs font-bold tracking-widest uppercase text-indigo-400 font-mono">
                  STMS TN
                </h1>
                <span className="text-[9px] bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className={`text-xs font-semibold leading-none mt-1 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                Tamil Nadu Road Transport Authority
              </p>
            </div>
          </div>

          {/* Quick Real-Time Status Ticker Bar */}
          <div className="hidden lg:flex items-center gap-6 text-[11px] font-medium text-slate-400" id="nav-status-ticker">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SQL Server: <strong className="text-emerald-400 font-bold">Online</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Signals Registered: <strong className="text-slate-200">{allTraffic.length} Nodes</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${severeZonesCount > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`}></span>
              <span>High Alert Zones: <strong className={severeZonesCount > 0 ? "text-rose-400 font-bold animate-pulse" : "text-emerald-400 font-bold"}>{severeZonesCount} Areas</strong></span>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="flex items-center gap-3" id="nav-utility-controls">
            {/* View selectors */}
            <div className={`p-1.5 rounded-xl border flex gap-1 ${
              isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                onClick={() => setActiveView("control")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "control"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="view-selector-control-btn"
              >
                Control Room
              </button>
              <button
                onClick={() => {
                  fetchAnalytics();
                  setActiveView("analytics");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "analytics"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="view-selector-analytics-btn"
              >
                Analytics
              </button>
              <button
                onClick={() => {
                  if (adminToken) {
                    setActiveView("admin");
                  } else {
                    setActiveView("admin");
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeView === "admin"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:text-rose-400"
                }`}
                id="view-selector-admin-btn"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Box
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl border hover:bg-slate-800/10 transition-colors ${
                isDark ? "border-slate-800 text-yellow-400" : "border-slate-200 text-indigo-900"
              }`}
              title="Toggle Screen Mode"
              id="theme-toggle-btn"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main App Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="app-viewport-container">
        
        {/* VIEW A: INTERACTIVE CONTROL ROOM DASHBOARD */}
        {activeView === "control" && (
          <div className="flex flex-col gap-6" id="dashboard-view-control">
            
            {/* Top Header matching the Mockup */}
            <div className="flex justify-between items-end flex-wrap gap-4" id="control-dashboard-header">
              <div>
                <h2 className="text-3xl font-serif font-light text-white tracking-tight">
                  Chennai Metro <span className="text-slate-500 italic">Dashboard</span>
                </h2>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span> Tamil Nadu State
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span> District: Chennai Central
                  </span>
                </div>
              </div>
            </div>

            {/* 2.1 Search & Dropdown Filters Bar */}
            <div className={`p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 transition-all duration-300 ${
              isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200 shadow-sm"
            }`} id="filters-action-panel">
              
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Telemetry Filters:
                </span>

                {/* City Dropdown */}
                <div className="relative">
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className={`pl-3 pr-8 py-2 rounded-xl text-xs font-bold border appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                    id="filter-city-select"
                  >
                    <option value="">Tamil Nadu (All Cities)</option>
                    {cities.map(c => <option key={`city-${c.id}`} value={c.id}>{c.name}</option>)}
                  </select>
                  <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* District Dropdown */}
                <div className="relative">
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    disabled={!selectedCityId}
                    className={`pl-3 pr-8 py-2 rounded-xl text-xs font-bold border appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                    } disabled:opacity-50`}
                    id="filter-district-select"
                  >
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={`dist-${d.id}`} value={d.id}>{d.name}</option>)}
                  </select>
                  <Sliders className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Area Dropdown */}
                <div className="relative">
                  <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={!selectedDistrictId}
                    className={`pl-3 pr-8 py-2 rounded-xl text-xs font-bold border appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                    } disabled:opacity-50`}
                    id="filter-area-select"
                  >
                    <option value="">All Areas</option>
                    {areas.map(a => <option key={`area-${a.id}`} value={a.id}>{a.name}</option>)}
                  </select>
                  <Compass className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Run Filter Button */}
                <button
                  onClick={fetchTrafficFeed}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all duration-200"
                  id="apply-filter-btn"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run query
                </button>
              </div>

              {/* Keyword Search & Export */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search intersection name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-slate-200 placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                    }`}
                    id="search-junctions-input"
                  />
                </div>

                <button
                  onClick={triggerExportCSV}
                  disabled={allTraffic.length === 0}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                    isDark ? "border-slate-800 text-slate-300 hover:bg-slate-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Export Current GIS Telemetry as CSV report"
                  id="export-csv-btn"
                >
                  <ArrowDownToLine className="w-4 h-4 text-indigo-400" />
                  CSV
                </button>
              </div>
            </div>

            {/* 2.2 Live GIS Map Visualizer Frame */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="dashboard-main-visuals-grid">
              
              {/* Left Column: Map Vis + Selected Area Summary Stats */}
              <div className="xl:col-span-8 flex flex-col gap-6" id="dashboard-left-visualization">
                
                {/* Simulated Geographic Interactive Smart Map */}
                <MapContainer
                  junctions={allTraffic}
                  emergencies={emergencies}
                  selectedJunction={selectedJunction}
                  onSelectJunction={setSelectedJunction}
                  isDark={isDark}
                />

                 {/* Macro summary details for filtered junctions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="dashboard-stats-row">
                  <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-sm" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Vehicles</span>
                    <strong className="text-2xl font-bold font-mono block mt-2 text-slate-100">{totalVehiclesCount.toLocaleString()}</strong>
                    <span className="text-[10px] text-slate-500 mt-2 block">Active across telemetry nodes</span>
                  </div>
                  
                  <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-sm" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Grid Speed</span>
                    <strong className="text-2xl font-bold font-mono block mt-2 text-emerald-400">
                      {allTraffic.length > 0 
                        ? Math.round(allTraffic.reduce((acc, curr) => acc + curr.avg_speed, 0) / allTraffic.length) 
                        : 40} <span className="text-xs font-normal text-slate-500">km/h</span>
                    </strong>
                    <span className="text-[10px] text-slate-500 mt-2 block">Optimal transit standard is 50</span>
                  </div>

                  <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-sm" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Delay</span>
                    <strong className="text-2xl font-bold font-mono block mt-2 text-amber-500">
                      {allTraffic.length > 0 
                        ? Math.round(allTraffic.reduce((acc, curr) => acc + curr.expected_delay_mins, 0) / allTraffic.length) 
                        : 0} <span className="text-xs font-normal text-slate-500">Mins</span>
                    </strong>
                    <span className="text-[10px] text-slate-500 mt-2 block">Traffic light wait buffers</span>
                  </div>

                  <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-sm" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Priority Wave</span>
                    <strong className="text-2xl font-bold font-mono block mt-2 text-rose-500 uppercase italic">
                      {emergencies.filter(e => e.status === "En Route").length} Sirens
                    </strong>
                    <span className="text-[10px] text-slate-500 mt-2 block">Siren responders clearing lanes</span>
                  </div>
                </div>

                {/* AI Predictive Analytics Matrix Panel */}
                <PredictionPanel
                  junctions={allTraffic}
                  selectedJunction={selectedJunction}
                  isDark={isDark}
                />
              </div>

              {/* Right Column: Live Nodes List Feed + Governmental Bulletins */}
              <div className="xl:col-span-4 flex flex-col gap-6" id="dashboard-right-signals-feed">
                
                {/* Section header: Active signals feed */}
                <div className={`p-5 rounded-3xl border flex flex-col flex-1 min-h-[480px] max-h-[580px] ${
                  isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200 shadow-sm"
                }`} id="live-telemetry-feed-card">
                  <div className="flex justify-between items-center border-b border-slate-800/40 pb-3 mb-3">
                    <div>
                      <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-800"}`}>
                        <Car className="w-4 h-4 text-indigo-400" />
                        Live Intersections Feed
                      </h3>
                      <p className="text-[10px] text-slate-400">Showing {filteredTraffic.length} matching nodes</p>
                    </div>
                    
                    <button
                      onClick={fetchTrafficFeed}
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 transition"
                      title="Force telemetry sync"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Intersections list */}
                  <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 scrollbar-thin" id="intersections-scrollable-list">
                    {loading && (
                      <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                        <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
                        <span className="text-xs text-slate-500">Querying SQL telemetries...</span>
                      </div>
                    )}

                    {!loading && filteredTraffic.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center justify-center gap-2 h-full">
                        <ServerCrash className="w-8 h-8 opacity-40 text-slate-500" />
                        <span>No telemetry streams match filters.</span>
                        <p className="text-[10px] text-slate-600 max-w-xs">Try selecting another City or District configuration from Tamil Nadu transport lists.</p>
                      </div>
                    )}

                    {!loading && filteredTraffic.map((item) => {
                      const isSelected = selectedJunction?.id === item.id;
                      return (
                        <div
                          key={`feed-node-${item.id}`}
                          onClick={() => setSelectedJunction(item)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-indigo-600/10 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20" 
                              : isDark ? "bg-slate-950/60 border-slate-800/60 hover:bg-slate-950" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                          }`}
                          id={`feed-item-card-${item.id}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className={`text-xs font-bold leading-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                {item.junction_name}
                              </h4>
                              <span className="text-[9px] text-slate-500 mt-0.5 block font-medium">
                                Area: {item.area_name} • District: {item.district_name}
                              </span>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              item.congestion_level === "Severe" ? "bg-rose-500/15 text-rose-500 border border-rose-500/10" :
                              item.congestion_level === "Heavy" ? "bg-amber-500/15 text-amber-500 border border-amber-500/10" :
                              item.congestion_level === "Moderate" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/10" :
                              "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
                            }`}>
                              {item.congestion_level}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
                            <div>
                              <span className="text-[9px] text-slate-500 block">Vehicles</span>
                              <strong className={`font-bold block ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                {item.vehicle_count} count
                              </strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">Density</span>
                              <strong className={`font-bold block ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                {item.traffic_density}%
                              </strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">Avg Speed</span>
                              <strong className="text-emerald-500 font-bold block">
                                {item.avg_speed} km/h
                              </strong>
                            </div>
                          </div>

                          {/* Quick automated alert warning */}
                          {item.congestion_level === "Severe" && (
                            <div className="mt-2 p-1.5 rounded bg-rose-500/5 text-rose-400 text-[9px] font-bold flex items-center gap-1 border border-rose-500/10 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                              AI Rerouting Triggered: Wait delay exceeds 20m.
                            </div>
                          )}
                          {item.congestion_level === "Light" && (
                            <div className="mt-2 p-1.5 rounded bg-emerald-500/5 text-emerald-400 text-[9px] font-semibold flex items-center gap-1 border border-emerald-500/10">
                              <Zap className="w-3 h-3 text-emerald-500 shrink-0" />
                              Optimal greenwave signals are flowing smoothly.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Government Official Mobility Bulletins (Reports) */}
                <div className={`p-5 rounded-3xl border flex flex-col gap-3.5 ${
                  isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200 shadow-sm"
                }`} id="official-bulletins-card">
                  <h3 className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-indigo-400`}>
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Government Mobility Bulletins
                  </h3>
                  <div className="space-y-3" id="bulletins-container">
                    {reports.map((rep) => (
                      <div key={`rep-${rep.id}`} className="border-l-2 border-indigo-500 pl-3">
                        <h4 className={`text-xs font-bold leading-tight ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                          {rep.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {rep.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: RICH ANALYTICS ROOM */}
        {activeView === "analytics" && (
          <div className="flex flex-col gap-6" id="dashboard-view-analytics">
            <div className={`p-5 rounded-2xl border ${
              isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-black ${isDark ? "text-white" : "text-slate-800"}`}>
                    Tamil Nadu Urban Congestion Analytics Grid
                  </h2>
                  <p className="text-xs text-slate-400">Static sensor aggregation measuring wait delays, diurnal flow curves, and volume distribution</p>
                </div>
                
                <button
                  onClick={fetchAnalytics}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sync Charts
                </button>
              </div>
            </div>

            {analytics ? (
              <AnalyticsCharts analytics={analytics} isDark={isDark} />
            ) : (
              <div className="text-center py-24">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-500">Retrieving aggregated spatial analytics...</span>
              </div>
            )}
          </div>
        )}

        {/* VIEW C: SECURE ADMIN TELEMETRY OVERRIDES */}
        {activeView === "admin" && (
          <div id="dashboard-view-admin">
            {!adminToken ? (
              /* High-end secure Admin login gate */
              <div className="max-w-md mx-auto py-12" id="admin-login-card">
                <div className={`p-6 rounded-2xl border shadow-2xl flex flex-col gap-5 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="text-center flex flex-col items-center">
                    <div className="p-3 rounded-full bg-red-600/10 text-red-500 mb-3">
                      <Lock className="w-8 h-8 animate-pulse" />
                    </div>
                    <h2 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-800"}`}>
                      Secure Hardware Override Gate
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Credentials are required to access real-time signal loop manual offsets.
                    </p>
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/15 text-red-400 text-xs border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {loginError}
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-400">Operator Email</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className={`p-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                        }`}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-400">Security Password</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className={`p-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                        }`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loggingIn}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all flex items-center justify-center gap-2"
                      id="admin-login-submit-btn"
                    >
                      {loggingIn ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Authenticating security codes...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          Authorize Terminal Access
                        </>
                      )}
                    </button>
                  </form>

                  <div className={`p-3.5 rounded-xl text-[11px] leading-relaxed flex flex-col gap-1 ${
                    isDark ? "bg-slate-950/60 text-slate-500" : "bg-slate-50 text-slate-600"
                  }`}>
                    <span className="font-bold text-slate-400 block">Demo Terminal Codes:</span>
                    <span>Operator: <strong className="font-bold text-blue-500">admin@tamilnadu.gov.in</strong></span>
                    <span>Passcode: <strong className="font-bold text-blue-500">admin123</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              /* Verified Overrides Panel */
              <AdminDashboard
                token={adminToken}
                onLogout={handleAdminLogout}
                isDark={isDark}
                junctions={allTraffic}
                onRefreshData={fetchTrafficFeed}
              />
            )}
          </div>
        )}

      </main>

      {/* 3. Official Government Footer Badge */}
      <footer className={`border-t py-6 mt-12 transition-all ${
        isDark ? "bg-slate-950 border-slate-900 text-slate-500" : "bg-white border-slate-200 text-slate-600"
      }`} id="app-global-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold tracking-wider uppercase text-blue-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            GOVERNMENT OF TAMIL NADU • ROAD TRANSPORT & HIGHWAYS DEPARTMENT
          </p>
          <p className="text-[9px] text-slate-600 max-w-md">
            This intelligent traffic overpass GIS console is configured with automatic fail-safe loops. All active overrides, automated greenwave priorities, and AI recommendations are archived securely inside SQLite / MySQL audit datastores.
          </p>
          <p className="text-[8px] text-slate-700 mt-2">
            © 2026 Tamil Nadu Transport Authority. All Rights Reserved. Enterprise Edition Q2.
          </p>
        </div>
      </footer>
    </div>
  );
}
