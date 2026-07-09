export interface City {
  id: number;
  name: string;
  created_at: string;
}

export interface District {
  id: number;
  name: string;
  city_id: number;
  created_at: string;
}

export interface Area {
  id: number;
  name: string;
  district_id: number;
  created_at: string;
}

export interface Junction {
  id: number;
  name: string;
  area_id: number;
  latitude: number;
  longitude: number;
  status: string;
  signal_mode: string;
  created_at: string;
}

export interface TrafficRecord {
  id: number;
  junction_id: number;
  vehicle_count: number;
  avg_speed: number;
  congestion_level: 'Light' | 'Moderate' | 'Heavy' | 'Severe';
  expected_delay_mins: number;
  traffic_density: number;
  updated_at: string;
  junction_name: string;
  junction_status: string;
  junction_signal_mode: string;
  junction_latitude: number;
  junction_longitude: number;
  area_id: number;
  area_name: string;
  district_id: number;
  district_name: string;
  city_id: number;
  city_name: string;
}

export interface EmergencyVehicle {
  id: number;
  vehicle_type: 'Ambulance' | 'Fire Truck' | 'Police';
  vehicle_number: string;
  route_from: string;
  route_to: string;
  current_junction_id: number | null;
  current_junction_name?: string;
  status: 'Dispatched' | 'En Route' | 'Cleared';
  priority_level: number;
  updated_at: string;
}

export interface TrafficLog {
  id: number;
  junction_id: number;
  junction_name?: string;
  event_type: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Critical';
  created_at: string;
}

export interface Report {
  id: number;
  title: string;
  city_id: number;
  city_name?: string;
  summary: string;
  created_at: string;
}

export interface AnalyticsData {
  summary: {
    total_vehicles: number;
    avg_speed: number;
    severe_percent: number;
    active_junctions: number;
  };
  cityCongestion: {
    city: string;
    avg_density: number;
    vehicles: number;
  }[];
  levelDistribution: {
    level: string;
    count: number;
  }[];
  timeSeries: {
    hour: string;
    Chennai: number;
    Coimbatore: number;
    Madurai: number;
    Trichy: number;
  }[];
}
