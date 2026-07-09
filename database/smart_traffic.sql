-- MySQL Smart Traffic Management System Schema & Initial Seed
-- Tamil Nadu Road Transport Department Database Init

CREATE DATABASE IF NOT EXISTS smart_traffic;
USE smart_traffic;

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Districts Table
CREATE TABLE IF NOT EXISTS districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    city_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    INDEX idx_district_city (city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Areas Table
CREATE TABLE IF NOT EXISTS areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    district_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
    INDEX idx_area_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junctions Table
CREATE TABLE IF NOT EXISTS junctions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    area_id INT NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Under Maintenance, Disabled
    signal_mode VARCHAR(50) DEFAULT 'Adaptive AI', -- Adaptive AI, Fixed Timer, Manual Override
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    INDEX idx_junction_area (area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TrafficData Table (Enriched 1-to-1 Junction telemetry)
CREATE TABLE IF NOT EXISTS traffic_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    junction_id INT NOT NULL UNIQUE,
    vehicle_count INT DEFAULT 0,
    avg_speed INT DEFAULT 40, -- km/h
    congestion_level VARCHAR(50) DEFAULT 'Light', -- Light, Moderate, Heavy, Severe
    expected_delay_mins INT DEFAULT 0,
    traffic_density INT DEFAULT 10, -- (0 to 100 %)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (junction_id) REFERENCES junctions(id) ON DELETE CASCADE,
    INDEX idx_traffic_junction (junction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- EmergencyVehicles Table
CREATE TABLE IF NOT EXISTS emergency_vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL, -- Ambulance, Fire Truck, Police
    vehicle_number VARCHAR(50) NOT NULL,
    route_from VARCHAR(120) NOT NULL,
    route_to VARCHAR(120) NOT NULL,
    current_junction_id INT,
    status VARCHAR(50) DEFAULT 'Dispatched', -- Dispatched, En Route, Cleared
    priority_level INT DEFAULT 5, -- 1-5 (highest)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (current_junction_id) REFERENCES junctions(id) ON DELETE SET NULL,
    INDEX idx_emergency_junction (current_junction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TrafficLogs Table
CREATE TABLE IF NOT EXISTS traffic_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    junction_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- Congestion Peak, Accident, Greenwave, Signal Outage
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'Info', -- Info, Warning, Critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (junction_id) REFERENCES junctions(id) ON DELETE CASCADE,
    INDEX idx_log_junction (junction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    city_id INT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    INDEX idx_report_city (city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==================================================
-- SEED SAMPLE DATA
-- ==================================================

-- Insert Admin (Password: admin123, hash created via bcrypt)
-- Hashed string corresponds to 'admin123'
INSERT INTO admins (email, password_hash) VALUES 
('admin@tamilnadu.gov.in', '$2b$10$O0G5E/4Pq4WfFqLgBtwNMeNREn.XN1kO7iK8xRkO.S6t81vD5K5QO');

-- Insert Cities
INSERT INTO cities (id, name) VALUES 
(1, 'Chennai'),
(2, 'Coimbatore'),
(3, 'Madurai'),
(4, 'Trichy');

-- Insert Districts
INSERT INTO districts (id, name, city_id) VALUES 
(1, 'Chennai South', 1),
(2, 'Chennai Central', 1),
(3, 'Chennai North', 1),
(4, 'Coimbatore North', 2),
(5, 'Coimbatore South', 2);

-- Insert Areas
INSERT INTO areas (id, name, district_id) VALUES 
(1, 'Adyar', 1),
(2, 'T. Nagar', 1),
(3, 'Velachery', 1),
(4, 'Nungambakkam', 2),
(5, 'Anna Nagar', 2),
(6, 'Gandhipuram', 4),
(7, 'Peelamedu', 4);

-- Insert Junctions
INSERT INTO junctions (id, name, area_id, latitude, longitude, status, signal_mode) VALUES 
(1, 'Madhya Kailash Junction', 1, 13.006300, 80.248600, 'Active', 'Adaptive AI'),
(2, 'Adyar Signal', 1, 13.001200, 80.256500, 'Active', 'Adaptive AI'),
(3, 'Thiruvanmiyur Signal', 1, 12.984100, 80.259900, 'Active', 'Fixed Timer'),
(4, 'Panagal Park Junction', 2, 13.040500, 80.233600, 'Active', 'Adaptive AI'),
(5, 'G.N. Chetty Road Junction', 2, 13.043500, 80.242100, 'Under Maintenance', 'Manual Override'),
(6, 'Velachery Bypass Junction', 3, 12.979600, 80.219800, 'Active', 'Adaptive AI'),
(7, 'Nungambakkam High Road Signal', 4, 13.060700, 80.241000, 'Active', 'Fixed Timer'),
(8, 'GP Signal Coimbatore', 6, 11.016800, 76.968900, 'Active', 'Adaptive AI');

-- Insert TrafficData
INSERT INTO traffic_data (junction_id, vehicle_count, avg_speed, congestion_level, expected_delay_mins, traffic_density) VALUES 
(1, 185, 14, 'Severe', 22, 92),
(2, 120, 28, 'Moderate', 8, 48),
(3, 65, 42, 'Light', 2, 22),
(4, 210, 10, 'Severe', 30, 95),
(5, 95, 20, 'Heavy', 15, 75),
(6, 150, 18, 'Heavy', 18, 80),
(7, 130, 25, 'Moderate', 10, 55),
(8, 140, 22, 'Heavy', 14, 70);

-- Insert Emergency Vehicles
INSERT INTO emergency_vehicles (vehicle_type, vehicle_number, route_from, route_to, current_junction_id, status, priority_level) VALUES 
('Ambulance', 'TN-07-BY-1234', 'Adyar Cancer Institute', 'Apollo Greams Road', 1, 'En Route', 5),
('Fire Truck', 'TN-01-G-9999', 'Teynampet Station', 'T. Nagar Ranganathan St', 4, 'Dispatched', 4);

-- Insert Traffic Logs
INSERT INTO traffic_logs (junction_id, event_type, message, severity) VALUES 
(1, 'Congestion Peak', 'Madhya Kailash peak delay due to corporate outbound corridor rush.', 'Warning'),
(4, 'Emergency Greenwave', 'Greenwave priority override enabled for Ambulance TN-07-BY-1234.', 'Info'),
(5, 'Signal Outage', 'Power fluctuations caused signal malfunction at G.N. Chetty Road.', 'Critical');

-- Insert Reports
INSERT INTO reports (title, city_id, summary) VALUES 
('Chennai South Mobility Optimization Report Q2 2026', 1, 'In-depth assessment of Rajiv Gandhi Salai (OMR) traffic patterns, detailing wait-time reductions.'),
('Coimbatore Smart Traffic Feasibility Analysis', 2, 'Strategic roadmap detailing feasibility of micro-sensors near Gandhipuram GP Signal grid.');
