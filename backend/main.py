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

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

if os.path.exists("public"):
    app.mount("/public", StaticFiles(directory="public"), name="public")

    @app.get("/tejas_hangar.jpg")
    async def serve_tejas_hangar():
        file_path = os.path.join("public", "tejas_hangar.jpg")
        if os.path.exists(file_path):
            return FileResponse(file_path, media_type="image/jpeg")
        return Response(status_code=404)

    @app.get("/iaf_fighter_tarmac.jpg")
    async def serve_iaf_fighter_tarmac():
        file_path = os.path.join("public", "iaf_fighter_tarmac.jpg")
        if os.path.exists(file_path):
            return FileResponse(file_path, media_type="image/jpeg")
        return Response(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
