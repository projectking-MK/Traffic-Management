import { useState, useEffect, FormEvent } from "react";
import { 
  Plus, Edit2, Trash2, Siren, FileText, AlertCircle, 
  Check, X, RefreshCw, Layers, ShieldCheck, MapPin, 
  Settings, Zap, AlertTriangle 
} from "lucide-react";
import { TrafficRecord, EmergencyVehicle, TrafficLog, City, District, Area } from "../types";

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  isDark: boolean;
  junctions: TrafficRecord[];
  onRefreshData: () => void;
}

export default function AdminDashboard({
  token,
  onLogout,
  isDark,
  junctions,
  onRefreshData,
}: AdminDashboardProps) {
  // Navigation tabs inside admin
  const [activeTab, setActiveTab] = useState<"telemetry" | "dispatch" | "logs">("telemetry");

  // Telemetry list, cities, districts, areas
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyVehicle[]>([]);

  // Filtering during dropdown selections
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  // Create New Junction state
  const [newJunctionName, setNewJunctionName] = useState("");
  const [newAreaId, setNewAreaId] = useState("");
  const [newLatitude, setNewLatitude] = useState("");
  const [newLongitude, setNewLongitude] = useState("");
  const [newStatus, setNewStatus] = useState("Active");
  const [newSignalMode, setNewSignalMode] = useState("Adaptive AI");
  const [newVehicleCount, setNewVehicleCount] = useState("50");
  const [newAvgSpeed, setNewAvgSpeed] = useState("40");
  const [newCongestionLevel, setNewCongestionLevel] = useState("Light");
  const [newExpectedDelay, setNewExpectedDelay] = useState("2");
  const [newTrafficDensity, setNewTrafficDensity] = useState("20");

  // Edit Junction telemetry state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVehicleCount, setEditVehicleCount] = useState("50");
  const [editAvgSpeed, setEditAvgSpeed] = useState("40");
  const [editCongestionLevel, setEditCongestionLevel] = useState("Light");
  const [editExpectedDelay, setEditExpectedDelay] = useState("2");
  const [editTrafficDensity, setEditTrafficDensity] = useState("20");
  const [editStatus, setEditStatus] = useState("Active");
  const [editSignalMode, setEditSignalMode] = useState("Adaptive AI");

  // Dispatch Emergency vehicle state
  const [evType, setEvType] = useState("Ambulance");
  const [evNumber, setEvNumber] = useState("");
  const [evFrom, setEvFrom] = useState("");
  const [evTo, setEvTo] = useState("");
  const [evJunctionId, setEvJunctionId] = useState("");
  const [evPriority, setEvPriority] = useState("5");

  // Notifications state
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load auxiliary database directories
  useEffect(() => {
    fetchCities();
    fetchLogs();
    fetchEmergencies();
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      fetchDistricts(Number(selectedCityId));
      setSelectedDistrictId("");
      setAreas([]);
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (selectedDistrictId) {
      fetchAreas(Number(selectedDistrictId));
    }
  }, [selectedDistrictId]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/cities");
      if (res.ok) {
        const data = await res.json();
        setCities(data);
      }
    } catch (err) {
      console.error("Cities fetch error", err);
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
      console.error("Districts fetch error", err);
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
      console.error("Areas fetch error", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Logs fetch error", err);
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
      console.error("Emergency vehicles fetch error", err);
    }
  };

  // CRUD: Create Junction & associated Telemetry
  const handleCreateJunction = async (e: FormEvent) => {
    e.preventDefault();
    if (!newJunctionName || !newAreaId) {
      showToast("Junction name and Area reference are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/traffic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          junction_name: newJunctionName,
          area_id: Number(newAreaId),
          latitude: Number(newLatitude) || 13.0,
          longitude: Number(newLongitude) || 80.2,
          status: newStatus,
          signal_mode: newSignalMode,
          vehicle_count: Number(newVehicleCount),
          avg_speed: Number(newAvgSpeed),
          congestion_level: newCongestionLevel,
          expected_delay_mins: Number(newExpectedDelay),
          traffic_density: Number(newTrafficDensity),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create junction");
      }

      showToast("Junction & traffic dataset created successfully!");
      onRefreshData();
      fetchLogs();
      setShowAddForm(false);
      // Reset state
      setNewJunctionName("");
      setNewAreaId("");
      setNewLatitude("");
      setNewLongitude("");
      setSelectedCityId("");
      setSelectedDistrictId("");
    } catch (err: any) {
      showToast(err.message || "Failed to submit. Check login session.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // CRUD: Update Traffic Telemetry
  const handleStartEdit = (record: TrafficRecord) => {
    setEditingId(record.id);
    setEditVehicleCount(record.vehicle_count.toString());
    setEditAvgSpeed(record.avg_speed.toString());
    setEditCongestionLevel(record.congestion_level);
    setEditExpectedDelay(record.expected_delay_mins.toString());
    setEditTrafficDensity(record.traffic_density.toString());
    setEditStatus(record.junction_status);
    setEditSignalMode(record.junction_signal_mode);
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/traffic/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_count: Number(editVehicleCount),
          avg_speed: Number(editAvgSpeed),
          congestion_level: editCongestionLevel,
          expected_delay_mins: Number(editExpectedDelay),
          traffic_density: Number(editTrafficDensity),
          status: editStatus,
          signal_mode: editSignalMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update record");
      }

      showToast("Traffic telemetry parameters updated successfully!");
      setEditingId(null);
      onRefreshData();
      fetchLogs();
    } catch (err: any) {
      showToast(err.message || "Failed to save updates", "error");
    }
  };

  // CRUD: Purge Junction record
  const handleDeleteJunction = async (id: number) => {
    if (!window.confirm("Are you absolutely sure you want to completely purge this junction? All historic log files and sensors will be wiped.")) {
      return;
    }

    try {
      const res = await fetch(`/api/traffic/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to purge record");
      }

      showToast("Junction purged successfully from smart grids!");
      onRefreshData();
      fetchLogs();
    } catch (err: any) {
      showToast(err.message || "Failed to purge database entry", "error");
    }
  };

  // Deploy Emergency Vehicle
  const handleDeployVehicle = async (e: FormEvent) => {
    e.preventDefault();
    if (!evNumber || !evFrom || !evTo) {
      showToast("Vehicle number, departure point, and destination destination are required", "error");
      return;
    }

    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_type: evType,
          vehicle_number: evNumber,
          route_from: evFrom,
          route_to: evTo,
          current_junction_id: evJunctionId ? Number(evJunctionId) : null,
          status: "En Route",
          priority_level: Number(evPriority),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deployment failed");
      }

      showToast(`${evType} deployed! Siren signals enabled in matching GIS nodes.`);
      fetchEmergencies();
      fetchLogs();
      onRefreshData();
      setEvNumber("");
      setEvFrom("");
      setEvTo("");
      setEvJunctionId("");
    } catch (err: any) {
      showToast(err.message || "Failed to initiate priority wave", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6" id="admin-management-dashboard">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-2 max-w-md animate-bounce ${
          toastType === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`} id="admin-toast-banner">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Module Panel Header */}
      <div className={`p-6 rounded-3xl border flex flex-wrap justify-between items-center gap-4 ${
        isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200"
      }`} id="admin-panel-main-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
              Tamil Nadu Traffic Authority Console
              <span className="text-xs bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded-full font-bold">SECURE ADMIN</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">Authenticated operator control module for active sensor manipulation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            id="admin-logout-btn"
          >
            Terminal Logout
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800/80" id="admin-subtabs-nav">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "telemetry"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
          id="admin-tab-telemetry"
        >
          <Layers className="w-4 h-4" />
          Signal Overrides ({junctions.length})
        </button>
        <button
          onClick={() => setActiveTab("dispatch")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "dispatch"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
          id="admin-tab-dispatch"
        >
          <Siren className="w-4 h-4" />
          Emergency Priority Dispatch
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "logs"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
          id="admin-tab-logs"
        >
          <FileText className="w-4 h-4" />
          Traffic Log Stream ({logs.length})
        </button>
      </div>

      {/* ACTIVE TAB: TELEMETRY & SIGNAL OVERRIDES */}
      {activeTab === "telemetry" && (
        <div className="flex flex-col gap-6" id="telemetry-tab-view">
          {/* Action Header bar */}
          <div className="flex justify-between items-center">
            <h3 className={`text-base font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              Active Junction Grid Sensors
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/20"
              id="toggle-add-junction-form-btn"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Cancel Provisioning" : "Provision New Junction"}
            </button>
          </div>

          {/* Provisioning Form Card */}
          {showAddForm && (
            <form onSubmit={handleCreateJunction} className={`p-6 rounded-3xl border animate-fadeIn flex flex-col gap-5 ${
              isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200"
            }`} id="add-junction-form">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 text-indigo-400 font-bold text-sm">
                <MapPin className="w-4 h-4" />
                Initialize New Smart Highway Node
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City select */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">1. City</label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    required
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">Select City...</option>
                    {cities.map(c => <option key={`p-city-${c.id}`} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* District select */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">2. District</label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    required
                    disabled={!selectedCityId}
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">Select District...</option>
                    {districts.map(d => <option key={`p-dist-${d.id}`} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Area select */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">3. Area</label>
                  <select
                    value={newAreaId}
                    onChange={(e) => setNewAreaId(e.target.value)}
                    required
                    disabled={!selectedDistrictId}
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">Select Area...</option>
                    {areas.map(a => <option key={`p-area-${a.id}`} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Junction Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Junction Name</label>
                  <input
                    type="text"
                    value={newJunctionName}
                    onChange={(e) => setNewJunctionName(e.target.value)}
                    placeholder="e.g. Adyar Madhya Kailash"
                    required
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                {/* Lat */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLatitude}
                    onChange={(e) => setNewLatitude(e.target.value)}
                    placeholder="e.g. 13.0063"
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                {/* Lon */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLongitude}
                    onChange={(e) => setNewLongitude(e.target.value)}
                    placeholder="e.g. 80.2486"
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-slate-800/40">
                {/* Vehicle Count */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Vehicles</label>
                  <input
                    type="number"
                    value={newVehicleCount}
                    onChange={(e) => setNewVehicleCount(e.target.value)}
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                {/* Avg Speed */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Avg Speed (km/h)</label>
                  <input
                    type="number"
                    value={newAvgSpeed}
                    onChange={(e) => setNewAvgSpeed(e.target.value)}
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                {/* Congestion Level */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Congestion</label>
                  <select
                    value={newCongestionLevel}
                    onChange={(e) => setNewCongestionLevel(e.target.value)}
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Heavy">Heavy</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>

                {/* Delay */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Delay (mins)</label>
                  <input
                    type="number"
                    value={newExpectedDelay}
                    onChange={(e) => setNewExpectedDelay(e.target.value)}
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                {/* Density */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Density (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newTrafficDensity}
                    onChange={(e) => setNewTrafficDensity(e.target.value)}
                    className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Deploy Hardware Sensor node
                </button>
              </div>
            </form>
          )}

          {/* Telemetry Control Table */}
          <div className={`border rounded-3xl overflow-hidden shadow-lg ${
            isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200"
          }`} id="telemetry-records-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-bold text-slate-400 ${
                    isDark ? "bg-slate-950/60 border-slate-800/60" : "bg-slate-50 border-slate-200"
                  }`}>
                    <th className="p-4">Signal Node</th>
                    <th className="p-4">Area & District</th>
                    <th className="p-4 text-center">Vehicles</th>
                    <th className="p-4 text-center">Speed</th>
                    <th className="p-4 text-center">Congestion</th>
                    <th className="p-4 text-center">Density</th>
                    <th className="p-4 text-center">Signal Mode</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {junctions.map((j) => {
                    const isEditing = editingId === j.id;

                    return (
                      <tr key={`row-${j.id}`} className={`hover:bg-slate-800/10 transition-colors ${
                        isEditing ? "bg-indigo-600/5" : ""
                      }`}>
                        {/* Name */}
                        <td className="p-4 font-bold">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <span className={`w-2 h-2 rounded-full ${
                              j.congestion_level === "Severe" ? "bg-rose-500 animate-pulse" :
                              j.congestion_level === "Heavy" ? "bg-amber-500" :
                              j.congestion_level === "Moderate" ? "bg-indigo-500" : "bg-emerald-500"
                            }`} />
                            {j.junction_name}
                          </div>
                          <span className="text-[10px] text-slate-500 block">{j.city_name} City</span>
                        </td>

                        {/* Location details */}
                        <td className="p-4">
                          <span className="text-slate-300 block font-medium">{j.area_name}</span>
                          <span className="text-[10px] text-slate-500 block">{j.district_name}</span>
                        </td>

                        {/* Vehicle Count */}
                        <td className="p-4 text-center font-semibold">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editVehicleCount}
                              onChange={(e) => setEditVehicleCount(e.target.value)}
                              className="w-16 p-1 rounded border border-slate-700 bg-slate-950 text-center text-xs text-white focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            j.vehicle_count
                          )}
                        </td>

                        {/* Speed */}
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editAvgSpeed}
                              onChange={(e) => setEditAvgSpeed(e.target.value)}
                              className="w-16 p-1 rounded border border-slate-700 bg-slate-950 text-center text-xs text-white focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            `${j.avg_speed} km/h`
                          )}
                        </td>

                         {/* Congestion level */}
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <select
                              value={editCongestionLevel}
                              onChange={(e) => setEditCongestionLevel(e.target.value)}
                              className="p-1 rounded border border-slate-700 bg-slate-950 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="Light">Light</option>
                              <option value="Moderate">Moderate</option>
                              <option value="Heavy">Heavy</option>
                              <option value="Severe">Severe</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              j.congestion_level === "Severe" ? "bg-rose-500/10 text-rose-400" :
                              j.congestion_level === "Heavy" ? "bg-amber-500/10 text-amber-400" :
                              j.congestion_level === "Moderate" ? "bg-indigo-500/10 text-indigo-400" :
                              "bg-emerald-500/10 text-emerald-400"
                            }`}>
                              {j.congestion_level}
                            </span>
                          )}
                        </td>

                        {/* Density */}
                        <td className="p-4 text-center font-bold text-slate-300">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editTrafficDensity}
                              onChange={(e) => setEditTrafficDensity(e.target.value)}
                              className="w-16 p-1 rounded border border-slate-700 bg-slate-950 text-center text-xs text-white focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            `${j.traffic_density}%`
                          )}
                        </td>

                        {/* Signal Mode */}
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <select
                              value={editSignalMode}
                              onChange={(e) => setEditSignalMode(e.target.value)}
                              className="p-1 rounded border border-slate-700 bg-slate-950 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="Adaptive AI">Adaptive AI</option>
                              <option value="Fixed Timer">Fixed Timer</option>
                              <option value="Manual Override">Manual Override</option>
                            </select>
                          ) : (
                            <span className="flex items-center justify-center gap-1 font-medium">
                              <Zap className="w-3.5 h-3.5 text-indigo-400" />
                              {j.junction_signal_mode}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(j.id)}
                                className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                                title="Save Telemetry Overrides"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 cursor-pointer"
                                title="Discard Changes"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(j)}
                                className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 cursor-pointer"
                                title="Override Telemetry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteJunction(j.id)}
                                className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                title="Wipe Signal Node"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE TAB: EMERGENCY PRIORITY DISPATCH */}
      {activeTab === "dispatch" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn" id="dispatch-tab-view">
          {/* Dispatch Control panel Form */}
          <form onSubmit={handleDeployVehicle} className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col gap-4 ${
            isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200"
          }`} id="deploy-vehicle-form">
            <h3 className={`text-base font-bold flex items-center gap-1.5 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              <Siren className="w-5 h-5 text-rose-500 animate-pulse" />
              Deploy Priority Emergency Unit
            </h3>
            <p className="text-xs text-slate-400 -mt-2">
              Bypasses standard signaling to establish greenwave priority tunnels across corresponding GPS junctions.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Vehicle Type</label>
                <select
                  value={evType}
                  onChange={(e) => setEvType(e.target.value)}
                  className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 ${
                    isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="Ambulance">Ambulance</option>
                  <option value="Fire Truck">Fire Truck</option>
                  <option value="Police">Police Escort</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">License Plate No.</label>
                <input
                  type="text"
                  value={evNumber}
                  onChange={(e) => setEvNumber(e.target.value)}
                  placeholder="e.g. TN-07-BY-1234"
                  required
                  className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 ${
                    isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Departure (From)</label>
                <input
                  type="text"
                  value={evFrom}
                  onChange={(e) => setEvFrom(e.target.value)}
                  placeholder="e.g. Adyar Institute"
                  required
                  className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 ${
                    isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Destination (To)</label>
                <input
                  type="text"
                  value={evTo}
                  onChange={(e) => setEvTo(e.target.value)}
                  placeholder="e.g. Apollo Greams"
                  required
                  className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 ${
                    isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Current GPS Intersection</label>
                <select
                  value={evJunctionId}
                  onChange={(e) => setEvJunctionId(e.target.value)}
                  className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 ${
                    isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="">None / Off-network</option>
                  {junctions.map(j => (
                    <option key={`ev-j-${j.id}`} value={j.junction_id}>
                      {j.junction_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Priority Weight (1-5)</label>
                <select
                  value={evPriority}
                  onChange={(e) => setEvPriority(e.target.value)}
                  className={`p-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 ${
                    isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="5">Level 5 (Severe Emergency)</option>
                  <option value="4">Level 4 (High Dispatch)</option>
                  <option value="3">Level 3 (Moderate Duty)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              id="submit-deploy-ev-btn"
            >
              <Siren className="w-4 h-4 animate-bounce" />
              Launch Emergency Priority Corridor
            </button>
          </form>

          {/* Deployed Emergency Grid Status list */}
          <div className="lg:col-span-7 flex flex-col gap-4" id="deployed-emergencies-list">
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              Deployed Emergency Signals on GIS Map
            </h3>

            {emergencies.length === 0 ? (
              <div className={`p-8 rounded-3xl border border-dashed text-center flex-1 flex flex-col justify-center items-center ${
                isDark ? "border-slate-800/80 text-slate-500 bg-slate-950/20" : "border-slate-200 text-slate-400"
              }`}>
                <Siren className="w-8 h-8 mb-2 opacity-55 text-rose-500" />
                <p className="text-xs font-semibold">No active sirened vehicles tracked.</p>
                <p className="text-[10px] mt-0.5 max-w-xs text-slate-500">All emergency corridors are clear and returned to automated standard signaling.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin" id="emergency-cards-scroll">
                {emergencies.map((ev) => (
                  <div key={`ev-${ev.id}`} className={`p-4 rounded-xl border flex justify-between items-center ${
                    isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
                  }`} id={`emergency-ev-card-${ev.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-rose-600/10 text-rose-400">
                        <Siren className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                            {ev.vehicle_number}
                          </span>
                          <span className="text-[9px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            {ev.vehicle_type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          Route: <strong className="text-slate-300">{ev.route_from}</strong> → <strong className="text-slate-300">{ev.route_to}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                        {ev.status}
                      </span>
                      <p className="text-[9px] text-slate-500 mt-1">Priority: Level {ev.priority_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE TAB: TRAFFIC LOG STREAM */}
      {activeTab === "logs" && (
        <div className="flex flex-col gap-4 animate-fadeIn" id="logs-tab-view">
          <div className="flex justify-between items-center">
            <h3 className={`text-base font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              Telemetry Grid Incidents
            </h3>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 text-slate-400 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Incident logs
            </button>
          </div>

          <div className={`border rounded-3xl overflow-hidden ${
            isDark ? "bg-slate-900/40 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200"
          }`} id="logs-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-bold text-slate-400 ${
                    isDark ? "bg-slate-950/60 border-slate-800/60" : "bg-slate-50 border-slate-200"
                  }`}>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Intersection Node</th>
                    <th className="p-4">Incident Event</th>
                    <th className="p-4">Message / Description</th>
                    <th className="p-4 text-center">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {logs.map((log) => (
                    <tr key={`log-${log.id}`} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 text-slate-500 text-[10px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-slate-300">
                        {log.junction_name || "Off-network System"}
                      </td>
                      <td className="p-4 text-indigo-400 font-semibold text-[11px]">
                        {log.event_type}
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {log.message}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          log.severity === "Critical" ? "bg-rose-500/15 text-rose-400" :
                          log.severity === "Warning" ? "bg-amber-500/15 text-amber-400" :
                          "bg-indigo-500/15 text-indigo-400"
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
