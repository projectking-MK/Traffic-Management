import os
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from config import Config
from database import db
from models import Admin, City, District, Area, Junction, TrafficData, EmergencyVehicle, TrafficLog, Report

app = Flask(__name__, static_folder='../dist', static_url_path='/')
app.config.from_object(Config)

# Enable CORS for all API endpoints
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize JWT Manager
jwt = JWTManager(app)

# Initialize database
db.init_app(app)


def auto_seed():
    """Auto-seeds the database with high-fidelity Tamil Nadu road telemetry if it is empty."""
    db.create_all()
    if Admin.query.first() is None:
        print("Database is empty. Initiating automatic seeding sequence with Tamil Nadu datasets...")
        
        # 1. Create Default Admin Operator
        admin = Admin(email="admin@tamilnadu.gov.in")
        admin.set_password("admin123")
        db.session.add(admin)

        # 2. Add Cities
        chennai = City(id=1, name="Chennai")
        coimbatore = City(id=2, name="Coimbatore")
        madurai = City(id=3, name="Madurai")
        trichy = City(id=4, name="Trichy")
        db.session.add_all([chennai, coimbatore, madurai, trichy])
        db.session.commit()

        # 3. Add Districts
        south = District(id=1, name="Chennai South", city_id=1)
        central = District(id=2, name="Chennai Central", city_id=1)
        north = District(id=3, name="Chennai North", city_id=1)
        c_north = District(id=4, name="Coimbatore North", city_id=2)
        c_south = District(id=5, name="Coimbatore South", city_id=2)
        db.session.add_all([south, central, north, c_north, c_south])
        db.session.commit()

        # 4. Add Areas
        adyar = Area(id=1, name="Adyar", district_id=1)
        tnagar = Area(id=2, name="T. Nagar", district_id=1)
        velachery = Area(id=3, name="Velachery", district_id=1)
        nungam = Area(id=4, name="Nungambakkam", district_id=2)
        annanagar = Area(id=5, name="Anna Nagar", district_id=2)
        gandhi = Area(id=6, name="Gandhipuram", district_id=4)
        peela = Area(id=7, name="Peelamedu", district_id=4)
        db.session.add_all([adyar, tnagar, velachery, nungam, annanagar, gandhi, peela])
        db.session.commit()

        # 5. Add Junctions
        j1 = Junction(id=1, name="Madhya Kailash Junction", area_id=1, latitude=13.0063, longitude=80.2486, status="Active", signal_mode="Adaptive AI")
        j2 = Junction(id=2, name="Adyar Signal", area_id=1, latitude=13.0012, longitude=80.2565, status="Active", signal_mode="Adaptive AI")
        j3 = Junction(id=3, name="Thiruvanmiyur Signal", area_id=1, latitude=12.9841, longitude=80.2599, status="Active", signal_mode="Fixed Timer")
        j4 = Junction(id=4, name="Panagal Park Junction", area_id=2, latitude=13.0405, longitude=80.2336, status="Active", signal_mode="Adaptive AI")
        j5 = Junction(id=5, name="G.N. Chetty Road Junction", area_id=2, latitude=13.0435, longitude=80.2421, status="Under Maintenance", signal_mode="Manual Override")
        j6 = Junction(id=6, name="Velachery Bypass Junction", area_id=3, latitude=12.9796, longitude=80.2198, status="Active", signal_mode="Adaptive AI")
        j7 = Junction(id=7, name="Nungambakkam High Road Signal", area_id=4, latitude=13.0607, longitude=80.2410, status="Active", signal_mode="Fixed Timer")
        j8 = Junction(id=8, name="GP Signal Coimbatore", area_id=6, latitude=11.0168, longitude=76.9689, status="Active", signal_mode="Adaptive AI")
        db.session.add_all([j1, j2, j3, j4, j5, j6, j7, j8])
        db.session.commit()

        # 6. Add Traffic Data Telemetry
        td1 = TrafficData(junction_id=1, vehicle_count=185, avg_speed=14, congestion_level="Severe", expected_delay_mins=22, traffic_density=92)
        td2 = TrafficData(junction_id=2, vehicle_count=120, avg_speed=28, congestion_level="Moderate", expected_delay_mins=8, traffic_density=48)
        td3 = TrafficData(junction_id=3, vehicle_count=65, avg_speed=42, congestion_level="Light", expected_delay_mins=2, traffic_density=22)
        td4 = TrafficData(junction_id=4, vehicle_count=210, avg_speed=10, congestion_level="Severe", expected_delay_mins=30, traffic_density=95)
        td5 = TrafficData(junction_id=5, vehicle_count=95, avg_speed=20, congestion_level="Heavy", expected_delay_mins=15, traffic_density=75)
        td6 = TrafficData(junction_id=6, vehicle_count=150, avg_speed=18, congestion_level="Heavy", expected_delay_mins=18, traffic_density=80)
        td7 = TrafficData(junction_id=7, vehicle_count=130, avg_speed=25, congestion_level="Moderate", expected_delay_mins=10, traffic_density=55)
        td8 = TrafficData(junction_id=8, vehicle_count=140, avg_speed=22, congestion_level="Heavy", expected_delay_mins=14, traffic_density=70)
        db.session.add_all([td1, td2, td3, td4, td5, td6, td7, td8])
        db.session.commit()

        # 7. Add Emergency Vehicles
        ev1 = EmergencyVehicle(vehicle_type="Ambulance", vehicle_number="TN-07-BY-1234", route_from="Adyar Cancer Institute", route_to="Apollo Greams Road", current_junction_id=1, status="En Route", priority_level=5)
        ev2 = EmergencyVehicle(vehicle_type="Fire Truck", vehicle_number="TN-01-G-9999", route_from="Teynampet Station", route_to="T. Nagar Ranganathan St", current_junction_id=4, status="Dispatched", priority_level=4)
        db.session.add_all([ev1, ev2])
        db.session.commit()

        # 8. Add Initial Traffic Audit Logs
        log1 = TrafficLog(junction_id=1, event_type="Congestion Peak", message="Madhya Kailash peak delay due to corporate outbound rush.", severity="Warning")
        log2 = TrafficLog(junction_id=4, event_type="Emergency Greenwave", message="Greenwave priority enabled for Ambulance TN-07-BY-1234.", severity="Info")
        log3 = TrafficLog(junction_id=5, event_type="Signal Outage", message="Power fluctuations caused intermittent signal outage at G.N. Chetty Road.", severity="Critical")
        db.session.add_all([log1, log2, log3])
        db.session.commit()

        # 9. Add Reports
        rep1 = Report(title="Chennai South Mobility Optimization Report Q2 2026", city_id=1, summary="In-depth assessment of Rajiv Gandhi Salai (OMR) traffic patterns, detailing wait-time reductions.")
        rep2 = Report(title="Coimbatore Smart Traffic Feasibility Analysis", city_id=2, summary="Strategic roadmap detailing feasibility of micro-sensors near Gandhipuram GP Signal grid.")
        db.session.add_all([rep1, rep2])
        db.session.commit()

        print("Database automatic seeding completed successfully!")
    else:
        print("Database already contains data; skipping seeding.")


# Flask Command CLI Support
@app.cli.command("seed-db")
def seed_db_command():
    """Seeds the database via flask CLI."""
    auto_seed()


# =====================================================================
# REST API ENDPOINTS
# =====================================================================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Incomplete login payload"}), 400
    
    admin = Admin.query.filter_by(email=email).first()
    if admin and admin.check_password(password):
        token = create_access_token(identity=admin.email)
        return jsonify({"token": token, "email": admin.email}), 200
    return jsonify({"error": "Invalid email or password"}), 401


@app.route('/api/cities', methods=['GET'])
def get_cities():
    try:
        cities = City.query.order_by(City.name.asc()).all()
        return jsonify([city.to_dict() for city in cities]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/districts', methods=['GET'])
def get_districts():
    try:
        city_id = request.args.get('city_id')
        query_base = District.query
        if city_id:
            query_base = query_base.filter_by(city_id=city_id)
        districts = query_base.order_by(District.name.asc()).all()
        return jsonify([d.to_dict() for d in districts]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/areas', methods=['GET'])
def get_areas():
    try:
        district_id = request.args.get('district_id')
        query_base = Area.query
        if district_id:
            query_base = query_base.filter_by(district_id=district_id)
        areas = query_base.order_by(Area.name.asc()).all()
        return jsonify([a.to_dict() for a in areas]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/junctions', methods=['GET'])
def get_junctions():
    try:
        area_id = request.args.get('area_id')
        query_base = Junction.query
        if area_id:
            query_base = query_base.filter_by(area_id=area_id)
        junctions = query_base.order_by(Junction.name.asc()).all()
        return jsonify([j.to_dict() for j in junctions]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/traffic', methods=['GET'])
def get_traffic():
    try:
        city_id = request.args.get('city_id')
        district_id = request.args.get('district_id')
        area_id = request.args.get('area_id')
        junction_id = request.args.get('junction_id')

        query_base = db.session.query(TrafficData).join(Junction).join(Area).join(District).join(City)

        if city_id:
            query_base = query_base.filter(City.id == city_id)
        if district_id:
            query_base = query_base.filter(District.id == district_id)
        if area_id:
            query_base = query_base.filter(Area.id == area_id)
        if junction_id:
            query_base = query_base.filter(Junction.id == junction_id)

        results = query_base.order_by(TrafficData.updated_at.desc()).all()
        
        output = []
        for td in results:
            j = td.junction
            a = j.area
            d = a.district
            c = d.city
            row = td.to_dict()
            row.update({
                "junction_name": j.name,
                "junction_status": j.status,
                "junction_signal_mode": j.signal_mode,
                "junction_latitude": j.latitude,
                "junction_longitude": j.longitude,
                "area_name": a.name,
                "district_name": d.name,
                "city_name": c.name
            })
            output.append(row)
            
        return jsonify(output), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/traffic', methods=['POST'])
@jwt_required()
def add_traffic():
    data = request.get_json() or {}
    junction_name = data.get('junction_name')
    area_id = data.get('area_id')
    
    if not junction_name or not area_id:
        return jsonify({"error": "Junction name and area reference are required"}), 400
    
    try:
        j = Junction(
            name=junction_name,
            area_id=area_id,
            latitude=data.get('latitude', 13.0),
            longitude=data.get('longitude', 80.2),
            status=data.get('status', 'Active'),
            signal_mode=data.get('signal_mode', 'Adaptive AI')
        )
        db.session.add(j)
        db.session.flush()

        td = TrafficData(
            junction_id=j.id,
            vehicle_count=data.get('vehicle_count', 0),
            avg_speed=data.get('avg_speed', 40),
            congestion_level=data.get('congestion_level', 'Light'),
            expected_delay_mins=data.get('expected_delay_mins', 0),
            traffic_density=data.get('traffic_density', 10)
        )
        db.session.add(td)
        db.session.commit()

        log = TrafficLog(
            junction_id=j.id,
            event_type="Creation",
            message=f"Smart traffic telemetry established for new junction {j.name}.",
            severity="Info"
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({"message": "Junction telemetry initialized successfully", "id": td.id, "junctionId": j.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/traffic/<int:id>', methods=['PUT'])
@jwt_required()
def update_traffic(id):
    data = request.get_json() or {}
    td = TrafficData.query.get_or_404(id)
    j = td.junction

    try:
        if 'vehicle_count' in data:
            td.vehicle_count = data['vehicle_count']
        if 'avg_speed' in data:
            td.avg_speed = data['avg_speed']
        if 'congestion_level' in data:
            td.congestion_level = data['congestion_level']
        if 'expected_delay_mins' in data:
            td.expected_delay_mins = data['expected_delay_mins']
        if 'traffic_density' in data:
            td.traffic_density = data['traffic_density']

        if 'status' in data:
            j.status = data['status']
        if 'signal_mode' in data:
            j.signal_mode = data['signal_mode']

        db.session.commit()

        log = TrafficLog(
            junction_id=j.id,
            event_type="Manual Override",
            message=f"Traffic data manually modified. Alert level: {td.congestion_level}. Density: {td.traffic_density}%. Mode: {j.signal_mode}.",
            severity="Warning" if td.congestion_level in ["Heavy", "Severe"] else "Info"
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({"message": "Telemetry updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/traffic/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_traffic(id):
    td = TrafficData.query.get_or_404(id)
    j = td.junction
    try:
        db.session.delete(j) # cascading deletes purge traffic_data and logs
        db.session.commit()
        return jsonify({"message": "Junction and all associated datasets purged successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/emergency', methods=['GET'])
def get_emergency():
    try:
        vehicles = EmergencyVehicle.query.order_by(EmergencyVehicle.priority_level.desc()).all()
        output = []
        for ev in vehicles:
            row = ev.to_dict()
            row["current_junction_name"] = ev.junction.name if ev.junction else "Unknown"
            output.append(row)
        return jsonify(output), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/emergency', methods=['POST'])
def add_emergency():
    data = request.get_json() or {}
    vehicle_type = data.get('vehicle_type')
    vehicle_number = data.get('vehicle_number')
    route_from = data.get('route_from')
    route_to = data.get('route_to')
    current_junction_id = data.get('current_junction_id')
    status = data.get('status', 'Dispatched')
    priority_level = data.get('priority_level', 5)

    if not vehicle_type or not vehicle_number or not route_from or not route_to:
        return jsonify({"error": "Incomplete emergency vehicle deployment parameters"}), 400

    try:
        ev = EmergencyVehicle(
            vehicle_type=vehicle_type,
            vehicle_number=vehicle_number,
            route_from=route_from,
            route_to=route_to,
            current_junction_id=current_junction_id,
            status=status,
            priority_level=priority_level
        )
        db.session.add(ev)
        db.session.commit()

        if current_junction_id:
            log = TrafficLog(
                junction_id=current_junction_id,
                event_type="Emergency Priority",
                message=f"Emergency priority wave dispatch for {vehicle_type} ({vehicle_number}) en route to {route_to}.",
                severity="Critical"
            )
            db.session.add(log)
            db.session.commit()

        return jsonify({"message": "Emergency deployment logged successfully", "id": ev.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        logs = TrafficLog.query.order_by(TrafficLog.created_at.desc()).limit(20).all()
        output = []
        for log in logs:
            row = log.to_dict()
            row["junction_name"] = log.junction.name if log.junction else "System"
            output.append(row)
        return jsonify(output), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports', methods=['GET'])
def get_reports():
    try:
        reports = Report.query.order_by(Report.created_at.desc()).all()
        output = []
        for r in reports:
            row = r.to_dict()
            row["city_name"] = r.city.name if r.city else "Tamil Nadu"
            output.append(row)
        return jsonify(output), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    try:
        total_vehicles = db.session.query(db.func.sum(TrafficData.vehicle_count)).scalar() or 0
        avg_speed = db.session.query(db.func.avg(TrafficData.avg_speed)).scalar() or 40
        active_junctions = db.session.query(db.func.count(Junction.id)).scalar() or 0
        severe_junctions = db.session.query(db.func.count(TrafficData.id)).filter(TrafficData.congestion_level.in_(["Heavy", "Severe"])).scalar() or 0

        city_congestion = db.session.query(
            City.name.label("city"),
            db.func.avg(TrafficData.traffic_density).label("avg_density"),
            db.func.sum(TrafficData.vehicle_count).label("vehicles")
        ).join(Junction, TrafficData.junction_id == Junction.id)\
         .join(Area, Junction.area_id == Area.id)\
         .join(District, Area.district_id == District.id)\
         .join(City, District.city_id == City.id)\
         .group_by(City.id).all()

        level_dist = db.session.query(
            TrafficData.congestion_level.label("level"),
            db.func.count(TrafficData.id).label("count")
        ).group_by(TrafficData.congestion_level).all()

        time_series = [
            { "hour": "08:00", "Chennai": 82, "Coimbatore": 58, "Madurai": 45, "Trichy": 35 },
            { "hour": "10:00", "Chennai": 95, "Coimbatore": 72, "Madurai": 65, "Trichy": 50 },
            { "hour": "12:00", "Chennai": 70, "Coimbatore": 50, "Madurai": 55, "Trichy": 40 },
            { "hour": "14:00", "Chennai": 65, "Coimbatore": 48, "Madurai": 48, "Trichy": 38 },
            { "hour": "16:00", "Chennai": 80, "Coimbatore": 62, "Madurai": 60, "Trichy": 48 },
            { "hour": "18:00", "Chennai": 98, "Coimbatore": 85, "Madurai": 78, "Trichy": 65 },
            { "hour": "20:00", "Chennai": 88, "Coimbatore": 68, "Madurai": 62, "Trichy": 52 }
        ]

        return jsonify({
            "summary": {
                "total_vehicles": int(total_vehicles),
                "avg_speed": int(avg_speed),
                "severe_percent": int((severe_junctions / active_junctions * 100) if active_junctions > 0 else 0),
                "active_junctions": active_junctions
            },
            "cityCongestion": [{"city": row.city, "avg_density": float(row.avg_density), "vehicles": int(row.vehicles)} for row in city_congestion],
            "levelDistribution": [{"level": row.level, "count": row.count} for row in level_dist],
            "timeSeries": time_series
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def predict_traffic():
    data = request.get_json() or {}
    junction_id = data.get('junctionId')
    factor = data.get('factor')

    if not junction_id:
        return jsonify({"error": "Junction ID reference is required"}), 400

    try:
        # Query traffic data and junction details
        td = TrafficData.query.filter_by(junction_id=junction_id).first()
        if not td:
            return jsonify({"error": "Junction traffic telemetry not found"}), 404

        j = td.junction
        a = j.area
        d = a.district
        c = d.city

        # Safe Lazy Initialization for Gemini client
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key == "":
            # Fallback mock report
            generated_fallback = f"""
### Smart Traffic Prediction Report: {j.name}
**Alert Level**: {"🔴 CRITICAL WARNING" if td.congestion_level in ["Severe", "Heavy"] else "🟡 WARNING"}

#### 1. Forecasting Matrix (Next 60 Minutes)
*   **Next 15 Minutes**: Projected vehicles **{round(td.vehicle_count * 1.15)}** | Expected delay: **{td.expected_delay_mins + 4} mins** | Density: **{min(100, td.traffic_density + 8)}%**
*   **Next 60 Minutes**: Projected vehicles **{round(td.vehicle_count * 0.85)}** (Expected commute wave dissipation) | Expected delay: **{max(2, td.expected_delay_mins - 5)} mins** | Density: **{max(10, td.traffic_density - 20)}%**

#### 2. Adaptive AI Signaling Recommendations
*   **Green-Light Duration**: Since current mode is **{j.signal_mode}**, we recommend a **+22 second duration increase** on the primary inflow approach to clear backlog.
*   **Automation Level**: Toggle system mode to **Adaptive AI** immediately to enable micro-sensor automatic feedback.

#### 3. Regional Diversion Strategy
*   Reroute light motor vehicle streams toward secondary collector roads in **{a.name}** to prevent absolute queue expansion.
*   Advise heavy cargo freight transport to halt/divert before approaching **{j.name}**.
"""
            return jsonify({"prediction": generated_fallback.strip()}), 200

        # Run real Gemini generation
        from google import genai
        client = genai.Client(api_key=api_key)

        ai_prompt = f"""
        You are the AI Smart Traffic Management brain for the Tamil Nadu Road Transport & Highways Department.
        Analyze the current live traffic parameters for the following junction and predict its future state:
        
        - Junction: "{j.name}" in Area: "{a.name}", City: "{c.name}"
        - Live Vehicle Count: {td.vehicle_count} vehicles currently tracked
        - Average Traffic Speed: {td.avg_speed} km/h
        - Congestion Level: {td.congestion_level}
        - Expected Delay: {td.expected_delay_mins} minutes
        - Road Density Percentage: {td.traffic_density}%
        - Current Signal Control Mode: {j.signal_mode}
        
        Special parameters / Operator notes: {factor or "None (Standard 1-hour ahead congestion prediction requested)"}.
        
        Generate a professional, structured, executive-level smart recommendation and forecasting report.
        Format the response in neat Markdown. Do not repeat instructions. Include:
        1. **Forecasting Matrix**: Calculate/predict vehicle count, expected delays, and density in 15-min and 60-min intervals.
        2. **Smart Signal Optimization**: Specify timing adjustments for this signal (e.g. increase green cycle by X seconds, switch to Adaptive AI) to clear the gridlock.
        3. **Traffic Diversion Strategy**: Detail neighboring roads or bypass corridors in Tamil Nadu to reroute incoming traffic.
        4. **System Health Alert Level**: Assign an automated alert level (Low, Warning, Critical) based on the parameters.
        """

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=ai_prompt,
        )

        return jsonify({"prediction": response.text}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================================
# STATIC CONTENT & SPA FALLBACK ROUTING
# =====================================================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


# =====================================================================
# RUN APPLICATION
# =====================================================================

if __name__ == '__main__':
    with app.app_context():
        # Auto-seed the schema and sample Tamil Nadu data
        auto_seed()
    # Runs on Port 3000 as required by the environment reverse proxy
    app.run(host='0.0.0.0', port=3000, debug=True)
