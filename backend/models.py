from datetime import datetime
from database import db
import bcrypt

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }


class City(db.Model):
    __tablename__ = 'cities'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    districts = db.relationship('District', backref='city', lazy=True, cascade="all, delete-orphan")
    reports = db.relationship('Report', backref='city', lazy=True, cascade="all, delete")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat()
        }


class District(db.Model):
    __tablename__ = 'districts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id', ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    areas = db.relationship('Area', backref='district', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "city_id": self.city_id,
            "created_at": self.created_at.isoformat()
        }


class Area(db.Model):
    __tablename__ = 'areas'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    district_id = db.Column(db.Integer, db.ForeignKey('districts.id', ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    junctions = db.relationship('Junction', backref='area', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "district_id": self.district_id,
            "created_at": self.created_at.isoformat()
        }


class Junction(db.Model):
    __tablename__ = 'junctions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id', ondelete="CASCADE"), nullable=False, index=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Active') # Active, Under Maintenance, Disabled
    signal_mode = db.Column(db.String(50), default='Adaptive AI') # Adaptive AI, Fixed Timer, Manual Override
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    traffic_data = db.relationship('TrafficData', backref='junction', uselist=False, cascade="all, delete-orphan")
    emergency_vehicles = db.relationship('EmergencyVehicle', backref='junction', lazy=True)
    logs = db.relationship('TrafficLog', backref='junction', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "area_id": self.area_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "status": self.status,
            "signal_mode": self.signal_mode,
            "created_at": self.created_at.isoformat()
        }


class TrafficData(db.Model):
    __tablename__ = 'traffic_data'
    id = db.Column(db.Integer, primary_key=True)
    junction_id = db.Column(db.Integer, db.ForeignKey('junctions.id', ondelete="CASCADE"), unique=True, nullable=False, index=True)
    vehicle_count = db.Column(db.Integer, default=0)
    avg_speed = db.Column(db.Integer, default=40) # in km/h
    congestion_level = db.Column(db.String(50), default='Light') # Light, Moderate, Heavy, Severe
    expected_delay_mins = db.Column(db.Integer, default=0)
    traffic_density = db.Column(db.Integer, default=10) # percentage (0-100)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "junction_id": self.junction_id,
            "vehicle_count": self.vehicle_count,
            "avg_speed": self.avg_speed,
            "congestion_level": self.congestion_level,
            "expected_delay_mins": self.expected_delay_mins,
            "traffic_density": self.traffic_density,
            "updated_at": self.updated_at.isoformat()
        }


class EmergencyVehicle(db.Model):
    __tablename__ = 'emergency_vehicles'
    id = db.Column(db.Integer, primary_key=True)
    vehicle_type = db.Column(db.String(50), nullable=False) # Ambulance, Fire Truck, Police
    vehicle_number = db.Column(db.String(50), nullable=False)
    route_from = db.Column(db.String(120), nullable=False)
    route_to = db.Column(db.String(120), nullable=False)
    current_junction_id = db.Column(db.Integer, db.ForeignKey('junctions.id', ondelete="SET NULL"), nullable=True, index=True)
    status = db.Column(db.String(50), default='Dispatched') # Dispatched, En Route, Cleared
    priority_level = db.Column(db.Integer, default=5) # 1-5 (highest)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_type": self.vehicle_type,
            "vehicle_number": self.vehicle_number,
            "route_from": self.route_from,
            "route_to": self.route_to,
            "current_junction_id": self.current_junction_id,
            "status": self.status,
            "priority_level": self.priority_level,
            "updated_at": self.updated_at.isoformat()
        }


class TrafficLog(db.Model):
    __tablename__ = 'traffic_logs'
    id = db.Column(db.Integer, primary_key=True)
    junction_id = db.Column(db.Integer, db.ForeignKey('junctions.id', ondelete="CASCADE"), nullable=False, index=True)
    event_type = db.Column(db.String(100), nullable=False) # Congestion Peak, Accident, Greenwave, Signal Outage
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50), default='Info') # Info, Warning, Critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "junction_id": self.junction_id,
            "event_type": self.event_type,
            "message": self.message,
            "severity": self.severity,
            "created_at": self.created_at.isoformat()
        }


class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id', ondelete="CASCADE"), nullable=False, index=True)
    summary = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "city_id": self.city_id,
            "summary": self.summary,
            "created_at": self.created_at.isoformat()
        }
