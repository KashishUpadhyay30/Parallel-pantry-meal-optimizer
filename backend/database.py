"""
SQLite Database Connection and Initialization
Manages pantry state and optimization run records.
"""

import sqlite3
import os
import sys
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "pantry_planner.db")
SAMPLE_PANTRY_PATH = os.path.join(BASE_DIR, "data", "sample_pantry", "pantry_inventory.json")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_reseed=False):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pantry_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ingredient_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        days_to_expiry INTEGER NOT NULL,
        expiry_date TEXT NOT NULL,
        estimated_unit_cost REAL NOT NULL,
        category TEXT NOT NULL,
        perishability_hazard REAL NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS optimization_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        algorithm TEXT NOT NULL,
        num_threads INTEGER NOT NULL,
        execution_time_ms REAL NOT NULL,
        best_fitness REAL NOT NULL,
        calories REAL NOT NULL,
        protein_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        out_of_pocket_cost REAL NOT NULL,
        rescued_items INTEGER NOT NULL,
        selected_recipes_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

    if force_reseed:
        cursor.execute("DELETE FROM pantry_items")
        conn.commit()

    # Seed with sample pantry if empty
    cursor.execute("SELECT COUNT(*) as count FROM pantry_items")
    if cursor.fetchone()["count"] == 0 and os.path.exists(SAMPLE_PANTRY_PATH):
        with open(SAMPLE_PANTRY_PATH, "r", encoding="utf-8-sig") as f:
            sample_items = json.load(f)
            for item in sample_items:
                cursor.execute("""
                INSERT INTO pantry_items (ingredient_name, quantity, unit, days_to_expiry, expiry_date, estimated_unit_cost, category, perishability_hazard)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item["ingredient_name"], item["quantity"], item["unit"],
                    item["days_to_expiry"], item["expiry_date"],
                    item["estimated_unit_cost"], item["category"],
                    item["perishability_hazard"]
                ))
            conn.commit()
    conn.close()

if __name__ == "__main__":
    force = "--reseed" in sys.argv
    init_db(force_reseed=force)
    print(f"[+] Database initialized (force_reseed={force}) at: {DB_PATH}")
