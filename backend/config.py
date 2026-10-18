import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# SQLite database file located in backend directory
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'airdoctor.db'}")

# Security & Demarcation constants
DATA_CLASSIFICATION = "SYNTHETIC / UNCLASSIFIED DATA — SIMULATED DEMO WORKFLOW"
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB max for demo CSV uploads
ALLOWED_CSV_EXTENSIONS = {".csv", ".txt"}

# CORS Origins (configurable via environment variable)
_cors_env = os.getenv("CORS_ORIGINS")
if _cors_env:
    CORS_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
