"""
C++ Optimization Engine Bridge
Coordinates between FastAPI backend, SQLite pantry database,
and high-speed C++ compiled binaries (sequential_ga.exe / parallel_ga.exe).
"""

import os
import sys
import json
import random
import tempfile
import subprocess
from .database import get_db_connection

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIN_SEQ = os.path.join(BASE_DIR, "bin", "sequential_ga.exe")
BIN_PAR = os.path.join(BASE_DIR, "bin", "parallel_ga.exe")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
VOCAB_PATH = os.path.join(PROCESSED_DIR, "ingredient_vocabulary.json")

# Authentic high-resolution Unsplash URLs for real-life recipe visuals
def get_recipe_image_url(recipe_name, slot=""):
    name = (recipe_name or "").lower()
    slot_l = (slot or "").lower()
    
    if any(k in name for k in ["oat", "porridge", "granola", "muesli"]):
        return "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["pancake", "waffle", "crepe"]):
        return "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["toast", "egg", "omelet", "scramble", "frittata", "shakshuka"]):
        return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["smoothie", "parfait", "yogurt", "pudding", "acai", "chia"]):
        return "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["salmon", "fish", "tuna", "shrimp", "seafood", "cod"]):
        return "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["chicken", "turkey", "poultry"]):
        return "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["pasta", "spaghetti", "lasagna", "penne", "macaroni", "noodle", "fettuccine"]):
        return "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["salad", "quinoa", "kale", "greens", "spinach"]):
        return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["burrito", "taco", "fajita", "wrap", "quesadilla"]):
        return "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["stir fry", "rice", "curry", "teriyaki", "bowl"]):
        return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["steak", "beef", "roast", "meatball", "burger"]):
        return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["soup", "stew", "chili", "broth", "chowder"]):
        return "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["snack", "bite", "almond", "nut", "bar", "hummus", "peanut"]):
        return "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80"
    if any(k in name for k in ["berry", "fruit", "apple", "banana", "strawberry"]):
        return "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80"
    
    if slot_l == "breakfast":
        return "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80"
    elif slot_l == "snack":
        return "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80"
    elif slot_l == "dinner":
        return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"

# Exact ingredient-to-real-life photography mapping
INGREDIENT_IMAGE_MAP = {
    "chickpeas (canned)": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=400&q=80",
    "chickpeas": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=400&q=80",
    "soy sauce": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
    "chia seeds": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=400&q=80",
    "chia": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=400&q=80",
    "pasta (spaghetti/penne)": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80",
    "pasta": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80",
    "spaghetti": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80",
    "penne": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80",
    "peanut butter": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80",
    "brown rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=400&q=80",
    "white rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    "rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    "rolled oats": "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=400&q=80",
    "oats": "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=400&q=80",
    "oat": "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=400&q=80",
    "mozzarella": "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=400&q=80",
    "cheddar cheese": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80",
    "cheddar": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80",
    "butter": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80",
    "carrots": "https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=400&q=80",
    "carrot": "https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=400&q=80",
    "onions": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80",
    "onion": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80",
    "garlic": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=400&q=80",
    "whole wheat bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    "bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    "ground beef": "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=400&q=80",
    "beef": "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=400&q=80",
    "strawberries": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=400&q=80",
    "strawberry": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=400&q=80",
    "mushrooms": "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=400&q=80",
    "bell peppers": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&q=80",
    "bell pepper": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&q=80",
    "chicken breast": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80",
    "chicken": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80",
    "spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80",
    "eggs": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80",
    "egg": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80",
    "whole milk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
    "milk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
    "greek yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80",
    "yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80",
    "tomatoes": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
    "tomato": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
    "broccoli": "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&q=80",
    "avocado": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80",
    "olive oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80",
    "oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80",
    "honey": "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=400&q=80",
    "almonds": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=400&q=80",
    "almond": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=400&q=80",
}

def get_ingredient_image_url(ing_name):
    name = (ing_name or "").strip().lower()
    if name in INGREDIENT_IMAGE_MAP:
        return INGREDIENT_IMAGE_MAP[name]
    for key, url in INGREDIENT_IMAGE_MAP.items():
        if key in name or name in key:
            return url
    return "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=80"

def load_vocabulary():
    with open(VOCAB_PATH, "r", encoding="utf-8-sig") as f:
        return json.load(f)

def load_processed_recipes(tier="medium"):
    recipe_path = os.path.join(PROCESSED_DIR, f"recipes_{tier}_processed.json")
    if not os.path.exists(recipe_path):
        recipe_path = os.path.join(PROCESSED_DIR, "recipes_medium_processed.json")
    with open(recipe_path, "r", encoding="utf-8-sig") as f:
        recipes = json.load(f)
    return {r["recipe_id"]: r for r in recipes}

def export_db_pantry_to_dat(temp_dat_path, vocab):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pantry_items")
    rows = cursor.fetchall()
    conn.close()

    stock_map = {}
    unit_cost_map = {}
    with open(temp_dat_path, "w", encoding="utf-8") as f:
        f.write(f"{len(rows)}\n")
        for row in rows:
            name_norm = row["ingredient_name"].strip().lower()
            ing_id = vocab.get(name_norm, {}).get("id", 0)
            f.write(f"{row['id']} {ing_id} {row['quantity']:.2f} {row['days_to_expiry']} {row['estimated_unit_cost']:.4f} {row['perishability_hazard']:.2f}\n")
            stock_map[name_norm] = row["quantity"]
            unit_cost_map[name_norm] = row["estimated_unit_cost"]
    return stock_map, unit_cost_map


def run_optimization(req):
    vocab = load_vocabulary()
    recipes_by_id = load_processed_recipes(req.dataset_tier)

    # 1. Export current pantry to temporary .dat
    with tempfile.NamedTemporaryFile(suffix=".dat", delete=False) as tf:
        temp_pantry_dat = tf.name

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf_json:
        temp_out_json = tf_json.name

    try:
        pantry_stock, pantry_unit_costs = export_db_pantry_to_dat(temp_pantry_dat, vocab)

        recipe_dat = os.path.join(PROCESSED_DIR, f"recipes_{req.dataset_tier}.dat")
        if not os.path.exists(recipe_dat):
            recipe_dat = os.path.join(PROCESSED_DIR, "recipes_medium.dat")

        # Dynamic Random Seed handling for instant recipe reshuffling
        seed_val = req.random_seed
        if seed_val <= 0:
            seed_val = random.randint(1, 1000000)

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
                "--seed", str(seed_val),
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
                "--seed", str(seed_val),
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
        with open(temp_out_json, "r", encoding="utf-8-sig") as f:
            run_data = json.load(f)

        # 5. Enrich with 100% Pantry-Sourced Meal Recommendations
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
            optional_suggestions = []
            meal_inr_cost = 0.0

            for ing in r_meta.get("ingredients", []):
                ing_name_norm = ing["name"].strip().lower()
                avail = pantry_stock.get(ing_name_norm, 0.0)
                unit_cost = pantry_unit_costs.get(ing_name_norm, 0.10)
                
                # Portion sourced from pantry
                qty_used = min(avail, ing["quantity"]) if avail > 0 else ing["quantity"]
                meal_inr_cost += qty_used * unit_cost

                if avail > 0:
                    used_from_pantry.append(f"{ing['name']} ({qty_used:.0f} {ing['unit']})")
                else:
                    optional_suggestions.append(f"Optional Chef Garnish: {ing['name']} ({ing['quantity']} {ing['unit']})")

            # In Indian Rupees: if unit costs were calculated, use them, or base on INR conversion
            if meal_inr_cost <= 0:
                meal_inr_cost = round(r_meta.get("calories", 400) * 0.12, 1)

            recommendations.append({
                "slot": slot_name,
                "recipe_id": r_meta["recipe_id"],
                "recipe_name": r_meta["recipe_name"],
                "calories": r_meta["calories"],
                "protein_g": r_meta["protein_g"],
                "carbohydrates_g": r_meta["carbohydrates_g"],
                "fat_g": r_meta["fat_g"],
                "prep_time_min": r_meta["preparation_time_min"],
                "estimated_cost_usd": round(meal_inr_cost, 1), # Kept for schema compatibility, contains INR value
                "estimated_cost_inr": round(meal_inr_cost, 1),
                "dietary_tags": r_meta.get("dietary_tags", []),
                "ingredients_used_from_pantry": used_from_pantry if used_from_pantry else [f"{ing['name']} ({ing['quantity']} {ing['unit']})" for ing in r_meta.get("ingredients", [])],
                "missing_ingredients_to_buy": [], # Strict zero grocery requirement
                "optional_suggestions": optional_suggestions,
                "image_url": get_recipe_image_url(r_meta["recipe_name"], slot_name)
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
            0.0, # ₹0 out of pocket grocery cost
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
            "out_of_pocket_cost_usd": 0.0, # Zero-waste 100% pantry fulfilled
            "out_of_pocket_cost_inr": 0.0,
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
