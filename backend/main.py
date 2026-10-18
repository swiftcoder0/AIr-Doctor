from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, SessionLocal
from backend.services.seed_data import seed_database_if_empty
from backend.api.routes import router
from backend.config import DATA_CLASSIFICATION, CORS_ORIGINS

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # 2. Seed initial data deterministically if tables are empty
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

    yield

app = FastAPI(
    title="AirDoctor API",
    description="Synthetic Aircraft Health & Readiness Intelligence Backend (FastAPI + SQLite Persistence)",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
