"""
Main FastAPI entrypoint for Vercel Serverless and Cloud Hosting
Serves static React frontend and handles SPA routing.
"""

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Parallel Pantry Meal Optimizer",
    description="High-Performance Multi-Objective Pantry Meal Optimizer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

assets_dir = os.path.join(FRONTEND_DIST, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

images_dir = os.path.join(FRONTEND_DIST, "images")
if os.path.exists(images_dir):
    app.mount("/images", StaticFiles(directory=images_dir), name="images")

data_dir = os.path.join(FRONTEND_DIST, "data")
if os.path.exists(data_dir):
    app.mount("/data", StaticFiles(directory=data_dir), name="data")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "project": "Parallel Pantry Meal Optimizer", "version": "1.0.0"}

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    potential_file = os.path.join(FRONTEND_DIST, full_path)
    if full_path and os.path.isfile(potential_file):
        return FileResponse(potential_file)
    
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    
    return JSONResponse(
        status_code=200,
        content={"status": "online", "message": "Parallel Pantry Meal Optimizer is online."}
    )
