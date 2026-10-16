import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# SQLite database file located in backend directory
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'airdoctor.db'}")

# Security & Demarcation constants
DATA_CLASSIFICATION = "SYNTHETIC / UNCLASSIFIED DATA — SIMULATED DEMO WORKFLOW"
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB max for demo CSV uploads
ALLOWED_CSV_EXTENSIONS = {".csv", ".txt"}
