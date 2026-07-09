import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { AnalyticsData } from "../types";

interface ChartsProps {
  analytics: AnalyticsData;
  isDark: boolean;
}

export default function AnalyticsCharts({ analytics, isDark }: ChartsProps) {
  // Color configuration
  const COLORS = {
    Light: "#10B981",    // Emerald
    Moderate: "#6366f1", // Indigo
    Heavy: "#f59e0b",    // Amber
    Severe: "#f43f5e",   // Rose
  };

  const pieData = analytics.levelDistribution.map(item => ({
    name: item.level,
    value: item.count
  }));

  const textFill = isDark ? "#94a3b8" : "#4B5563";
  const gridStroke = isDark ? "#1e293b" : "#E5E7EB";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-charts-grid">
      {/* 1. Time Series Area Chart - Diurnal Congestion Trends */}
      <div className={`p-5 rounded-3xl border transition-all duration-300 ${
        isDark ? "bg-slate-900/40 border-slate-800/80 text-white" : "bg-white/80 border-slate-100"
      } backdrop-blur-md shadow-lg`} id="hourly-congestion-card">
        <h3 className={`text-base font-medium font-sans tracking-tight mb-4 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Diurnal Congestion Density Trends (%)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientChennai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="gradientCoimbatore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="hour" stroke={textFill} fontSize={11} />
              <YAxis stroke={textFill} fontSize={11} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#090d16" : "#FFFFFF", 
                  borderColor: isDark ? "#1e293b" : "#E2E8F0",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  borderRadius: "16px"
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="Chennai" name="Chennai OMR Grid" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gradientChennai)" />
              <Area type="monotone" dataKey="Coimbatore" name="Coimbatore Ring" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#gradientCoimbatore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. City Bar Chart - Vehicle Volumes */}
      <div className={`p-5 rounded-3xl border transition-all duration-300 ${
        isDark ? "bg-slate-900/40 border-slate-800/80 text-white" : "bg-white/80 border-slate-100"
      } backdrop-blur-md shadow-lg`} id="city-vehicle-volume-card">
        <h3 className={`text-base font-medium font-sans tracking-tight mb-4 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          City Telemetry Vehicle Count Sum
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.cityCongestion} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="city" stroke={textFill} fontSize={11} />
              <YAxis stroke={textFill} fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#090d16" : "#FFFFFF", 
                  borderColor: isDark ? "#1e293b" : "#E2E8F0",
                  borderRadius: "16px" 
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="vehicles" name="Total Tracked Vehicles" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Pie Chart - Distribution of Congestion Levels */}
      <div className={`p-5 rounded-3xl border transition-all duration-300 ${
        isDark ? "bg-slate-900/40 border-slate-800/80 text-white" : "bg-white/80 border-slate-100"
      } backdrop-blur-md shadow-lg`} id="congestion-level-distribution-card">
        <h3 className={`text-base font-medium font-sans tracking-tight mb-4 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Congestion Severity Share
        </h3>
        <div className="h-72 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || "#6B7280"} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#090d16" : "#FFFFFF", 
                  borderColor: isDark ? "#1e293b" : "#E2E8F0",
                  borderRadius: "16px" 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Line Chart - Average Density performance vs Speeds */}
      <div className={`p-5 rounded-3xl border transition-all duration-300 ${
        isDark ? "bg-slate-900/40 border-slate-800/80 text-white" : "bg-white/80 border-slate-100"
      } backdrop-blur-md shadow-lg`} id="density-performance-card">
        <h3 className={`text-base font-medium font-sans tracking-tight mb-4 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          Average Density vs Rerouting Speeds
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.cityCongestion} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="city" stroke={textFill} fontSize={11} />
              <YAxis stroke={textFill} fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#090d16" : "#FFFFFF", 
                  borderColor: isDark ? "#1e293b" : "#E2E8F0",
                  borderRadius: "16px" 
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="avg_density" name="Avg Density %" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
