"""
FastAPI REST API Server for High-Performance Multi-Objective Meal Planning
Provides full pantry CRUD, C++ optimization triggers, real-time pantry simulations,
and HPC performance analytics endpoints.
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, get_db_connection
from .models import (
    PantryItemCreate, PantryItemUpdate, PantryItemResponse,
    OptimizeRequest, OptimizationResponse, SimulatePantryChangeRequest
)
from .optimizer_bridge import run_optimization

# Initialize database
init_db()

app = FastAPI(
    title="HPC Parallel Pantry Meal Optimizer API",
    description="REST API for High-Performance Multi-Objective Pantry-Aware Evolutionary Optimization",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLES_DIR = os.path.join(BASE_DIR, "results", "tables")

@app.get("/")
def root():
    return {
        "project": "High-Performance Parallel Multi-Objective Meal Optimizer",
        "version": "1.0.0",
        "status": "online",
        "endpoints": ["/pantry", "/optimize", "/recommendations", "/performance", "/experiments", "/simulate-pantry-change"]
    }

# ----------------- Pantry CRUD Endpoints -----------------

@app.get("/pantry", response_model=List[PantryItemResponse])
def get_pantry():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pantry_items ORDER BY days_to_expiry ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/pantry", response_model=PantryItemResponse, status_code=status.HTTP_201_CREATED)
def add_pantry_item(item: PantryItemCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    expiry_date = item.expiry_date
    if not expiry_date:
        expiry_date = (datetime.now() + timedelta(days=item.days_to_expiry)).strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO pantry_items (ingredient_name, quantity, unit, days_to_expiry, expiry_date, estimated_unit_cost, category, perishability_hazard)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item.ingredient_name, item.quantity, item.unit,
        item.days_to_expiry, expiry_date, item.estimated_unit_cost,
        item.category, item.perishability_hazard
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {**item.model_dump(), "id": new_id, "expiry_date": expiry_date}


@app.put("/pantry/{item_id}", response_model=PantryItemResponse)
def update_pantry_item(item_id: int, update: PantryItemUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pantry_items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Pantry item not found")

    new_qty = update.quantity if update.quantity is not None else row["quantity"]
    new_days = update.days_to_expiry if update.days_to_expiry is not None else row["days_to_expiry"]
    new_expiry = update.expiry_date if update.expiry_date is not None else row["expiry_date"]
    new_cost = update.estimated_unit_cost if update.estimated_unit_cost is not None else row["estimated_unit_cost"]

    cursor.execute("""
    UPDATE pantry_items
    SET quantity = ?, days_to_expiry = ?, expiry_date = ?, estimated_unit_cost = ?
    WHERE id = ?
    """, (new_qty, new_days, new_expiry, new_cost, item_id))
    conn.commit()
    cursor.execute("SELECT * FROM pantry_items WHERE id = ?", (item_id,))
    updated_row = dict(cursor.fetchone())
    conn.close()
    return updated_row

@app.delete("/pantry/{item_id}")
def delete_pantry_item(item_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pantry_items WHERE id = ?", (item_id,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    return {"status": "success", "message": f"Deleted pantry item #{item_id}"}

# ----------------- Optimization & Recommendation Endpoints -----------------

@app.post("/optimize", response_model=OptimizationResponse)
def trigger_optimization(req: OptimizeRequest):
    try:
        res = run_optimization(req)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommendations")
def get_latest_recommendations():
    req = OptimizeRequest(algorithm="parallel", num_threads=4, dataset_tier="medium")
    return trigger_optimization(req)

@app.get("/performance")
def get_performance_benchmarks():
    summary_path = os.path.join(TABLES_DIR, "benchmark_results_summary.json")
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/experiments")
def get_experiments():
    summary_path = os.path.join(TABLES_DIR, "benchmark_results_summary.json")
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {
                "total_scenarios": len(data),
                "scenarios": data
            }
    return {"total_scenarios": 0, "scenarios": []}

@app.post("/simulate-pantry-change")
def simulate_pantry_change(sim: SimulatePantryChangeRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    action_msg = ""
    if sim.action == "consume" and sim.ingredient_name:
        cursor.execute("SELECT id, quantity FROM pantry_items WHERE LOWER(ingredient_name) = LOWER(?)", (sim.ingredient_name,))
        row = cursor.fetchone()
        if row:
            qty_delta = sim.quantity_delta or 100.0
            new_qty = max(0.0, row["quantity"] - qty_delta)
            if new_qty == 0:
                cursor.execute("DELETE FROM pantry_items WHERE id = ?", (row["id"],))
                action_msg = f"Consumed all of {sim.ingredient_name} (removed from pantry)"
            else:
                cursor.execute("UPDATE pantry_items SET quantity = ? WHERE id = ?", (new_qty, row["id"]))
                action_msg = f"Consumed {qty_delta} of {sim.ingredient_name} (remaining: {new_qty})"
    elif sim.action == "spoil_warning" and sim.ingredient_name:
        cursor.execute("UPDATE pantry_items SET days_to_expiry = 1 WHERE LOWER(ingredient_name) = LOWER(?)", (sim.ingredient_name,))
        action_msg = f"Set expiration urgency to 1 day for {sim.ingredient_name}"
    elif sim.action == "reset":
        cursor.execute("DELETE FROM pantry_items")
        conn.commit()
        conn.close()
        init_db() # re-seeds
        action_msg = "Reset pantry to default perishable state"
        return {"action": action_msg, "optimization_result": trigger_optimization(OptimizeRequest())}

    conn.commit()
    conn.close()

    # Automatically trigger dynamic real-time re-optimization
    opt_result = trigger_optimization(OptimizeRequest(algorithm="parallel", num_threads=4))
    return {
        "action": action_msg,
        "dynamic_reoptimization": opt_result
    }
