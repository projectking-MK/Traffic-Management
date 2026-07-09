import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")

# Clean and validate the database connection URI
if not db_url or db_url.startswith("http://") or db_url.startswith("https://") or not any(db_url.startswith(scheme) for scheme in ["mysql", "postgresql", "sqlite", "oracle", "mssql"]):
    # Use localized SQLite database as an active fallback for sandbox robustness
    db_url = "sqlite:///smart_traffic.db"
else:
    # Handle postgres scheme replacement for compatibility with modern SQLAlchemy
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smart_traffic_secret_default_key_2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smart_traffic_jwt_default_key_2026")
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = 14400 # 4 hours
