"""
C++ Optimization Engine Bridge
Coordinates between FastAPI backend, SQLite pantry database,
and high-speed C++ compiled binaries (sequential_ga.exe / parallel_ga.exe).
"""

import os
import sys
import json
import tempfile
import subprocess
from .database import get_db_connection

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIN_SEQ = os.path.join(BASE_DIR, "bin", "sequential_ga.exe")
BIN_PAR = os.path.join(BASE_DIR, "bin", "parallel_ga.exe")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
VOCAB_PATH = os.path.join(PROCESSED_DIR, "ingredient_vocabulary.json")

def load_vocabulary():
    with open(VOCAB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def load_processed_recipes(tier="medium"):
    recipe_path = os.path.join(PROCESSED_DIR, f"recipes_{tier}_processed.json")
    if not os.path.exists(recipe_path):
        recipe_path = os.path.join(PROCESSED_DIR, "recipes_medium_processed.json")
    with open(recipe_path, "r", encoding="utf-8") as f:
        recipes = json.load(f)
    return {r["recipe_id"]: r for r in recipes}

def export_db_pantry_to_dat(temp_dat_path, vocab):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pantry_items")
    rows = cursor.fetchall()
    conn.close()

    with open(temp_dat_path, "w", encoding="utf-8") as f:
        f.write(f"{len(rows)}\n")
        for row in rows:
            name_norm = row["ingredient_name"].strip().lower()
            ing_id = vocab.get(name_norm, {}).get("id", 0)
            f.write(f"{row['id']} {ing_id} {row['quantity']:.2f} {row['days_to_expiry']} {row['estimated_unit_cost']:.4f} {row['perishability_hazard']:.2f}\n")
    return {r["ingredient_name"].strip().lower(): r["quantity"] for r in rows}

def run_optimization(req):
    vocab = load_vocabulary()
    recipes_by_id = load_processed_recipes(req.dataset_tier)

    # 1. Export current pantry to temporary .dat
    with tempfile.NamedTemporaryFile(suffix=".dat", delete=False) as tf:
        temp_pantry_dat = tf.name

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf_json:
        temp_out_json = tf_json.name

    try:
        pantry_stock = export_db_pantry_to_dat(temp_pantry_dat, vocab)

        recipe_dat = os.path.join(PROCESSED_DIR, f"recipes_{req.dataset_tier}.dat")
        if not os.path.exists(recipe_dat):
            recipe_dat = os.path.join(PROCESSED_DIR, "recipes_medium.dat")

        # 2. Prepare Command
        if req.algorithm.lower() == "parallel":
            bin_exec = BIN_PAR
            cmd = [
                bin_exec,
                "--threads", str(req.num_threads),
                "--recipes", recipe_dat,
                "--pantry", temp_pantry_dat,
                "--pop", str(req.population_size),
                "--gen", str(req.generations),
                "--seed", str(req.random_seed),
                "--cal", str(req.target_calories),
                "--prot", str(req.target_protein),
                "--carb", str(req.target_carbs),
                "--fat", str(req.target_fat),
                "--output_json", temp_out_json
            ]
        else:
            bin_exec = BIN_SEQ
            cmd = [
                bin_exec,
                "--recipes", recipe_dat,
                "--pantry", temp_pantry_dat,
                "--pop", str(req.population_size),
                "--gen", str(req.generations),
                "--seed", str(req.random_seed),
                "--cal", str(req.target_calories),
                "--prot", str(req.target_protein),
                "--carb", str(req.target_carbs),
                "--fat", str(req.target_fat),
                "--output_json", temp_out_json
            ]

        # 3. Execute C++ Engine
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=BASE_DIR)
        if res.returncode != 0:
            raise RuntimeError(f"C++ Optimizer failed: {res.stderr}")

        # 4. Load JSON telemetry
        with open(temp_out_json, "r", encoding="utf-8") as f:
            run_data = json.load(f)

        # 5. Enrich with Meal Recommendations
        slots = ["Breakfast", "Lunch", "Dinner", "Snack"]
        recommendations = []
        selected_ids = run_data.get("selected_recipes", [])

        for idx, r_id in enumerate(selected_ids):
            slot_name = slots[idx] if idx < len(slots) else f"Meal {idx+1}"
            r_meta = recipes_by_id.get(r_id, {
                "recipe_id": r_id, "recipe_name": f"Recipe #{r_id}",
                "calories": 400, "protein_g": 25, "carbohydrates_g": 40, "fat_g": 12,
                "preparation_time_min": 20, "estimated_cost_usd": 3.5,
                "dietary_tags": [], "ingredients": []
            })

            used_from_pantry = []
            missing_to_buy = []

            for ing in r_meta.get("ingredients", []):
                ing_name_norm = ing["name"].strip().lower()
                avail = pantry_stock.get(ing_name_norm, 0.0)
                if avail >= ing["quantity"]:
                    used_from_pantry.append(f"{ing['name']} ({ing['quantity']} {ing['unit']})")
                else:
                    needed = ing["quantity"] - avail
                    missing_to_buy.append(f"{ing['name']} ({needed:.1f} {ing['unit']})")

            recommendations.append({
                "slot": slot_name,
                "recipe_id": r_meta["recipe_id"],
                "recipe_name": r_meta["recipe_name"],
                "calories": r_meta["calories"],
                "protein_g": r_meta["protein_g"],
                "carbohydrates_g": r_meta["carbohydrates_g"],
                "fat_g": r_meta["fat_g"],
                "prep_time_min": r_meta["preparation_time_min"],
                "estimated_cost_usd": r_meta["estimated_cost_usd"],
                "dietary_tags": r_meta.get("dietary_tags", []),
                "ingredients_used_from_pantry": used_from_pantry,
                "missing_ingredients_to_buy": missing_to_buy
            })

        # 6. Save in SQLite History
        scores = run_data["best_scores"]
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO optimization_history 
        (algorithm, num_threads, execution_time_ms, best_fitness, calories, protein_g, carbs_g, fat_g, out_of_pocket_cost, rescued_items, selected_recipes_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_data.get("algorithm", "Sequential GA"),
            req.num_threads if req.algorithm.lower() == "parallel" else 1,
            run_data["execution_time_ms"],
            run_data["best_fitness"],
            scores["total_calories"],
            scores["total_protein"],
            scores["total_carbs"],
            scores["total_fat"],
            scores["out_of_pocket_cost"],
            scores.get("expiring_items_rescued", 0),
            json.dumps(selected_ids)
        ))
        conn.commit()
        conn.close()

        return {
            "algorithm": run_data.get("algorithm", "Sequential GA"),
            "num_threads": req.num_threads if req.algorithm.lower() == "parallel" else 1,
            "execution_time_ms": run_data["execution_time_ms"],
            "best_fitness": run_data["best_fitness"],
            "nutrition_satisfaction_percent": round(scores["f_nutr"] * 100.0, 1),
            "expiry_utilization_percent": round(scores["f_expiry"] * 100.0, 1),
            "out_of_pocket_cost_usd": round(scores["out_of_pocket_cost"], 2),
            "expiring_items_rescued_count": scores.get("expiring_items_rescued", 0),
            "macro_totals": {
                "calories": round(scores["total_calories"], 1),
                "protein_g": round(scores["total_protein"], 1),
                "carbs_g": round(scores["total_carbs"], 1),
                "fat_g": round(scores["total_fat"], 1)
            },
            "recommendations": recommendations
        }

    finally:
        if os.path.exists(temp_pantry_dat):
            os.remove(temp_pantry_dat)
        if os.path.exists(temp_out_json):
            os.remove(temp_out_json)
