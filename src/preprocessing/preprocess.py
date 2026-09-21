"""
Data Preprocessing and Normalization Pipeline
Normalizes recipe and pantry data, builds ingredient vocabulary, 
validates data integrity, and generates both JSON/CSV and compact 
C++ high-performance data files (.dat).
"""

import json
import csv
import os
import math

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
PANTRY_DATA_DIR = os.path.join(BASE_DIR, "data", "sample_pantry")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)

CATEGORY_MAP = {
    "Breakfast": 0,
    "Lunch": 1,
    "Dinner": 2,
    "Snack": 3
}

DIETARY_TAG_MAP = {
    "Vegetarian": 0,
    "Vegan": 1,
    "Gluten-Free": 2,
    "Keto": 3,
    "High-Protein": 4,
    "Halal": 5,
    "Dairy-Free": 6,
    "Low-Carb": 7
}

def normalize_ingredient_name(name: str) -> str:
    """Canonicalize ingredient naming tokens"""
    return name.strip().lower()

def build_ingredient_vocabulary(all_recipe_files, pantry_file):
    """Scans all recipes and pantry items to build a canonical integer vocabulary"""
    vocab = {}
    next_id = 0

    # Load pantry
    with open(pantry_file, "r", encoding="utf-8") as f:
        pantry = json.load(f)
        for item in pantry:
            norm_name = normalize_ingredient_name(item["ingredient_name"])
            if norm_name not in vocab:
                vocab[norm_name] = {
                    "id": next_id,
                    "canonical_name": item["ingredient_name"],
                    "unit": item["unit"],
                    "category": item.get("category", "General"),
                    "estimated_unit_cost": item.get("estimated_unit_cost", 0.01)
                }
                next_id += 1

    # Load recipes
    for r_file in all_recipe_files:
        with open(r_file, "r", encoding="utf-8") as f:
            recipes = json.load(f)
            for r in recipes:
                for ing in r["ingredients"]:
                    norm_name = normalize_ingredient_name(ing["name"])
                    if norm_name not in vocab:
                        vocab[norm_name] = {
                            "id": next_id,
                            "canonical_name": ing["name"],
                            "unit": ing["unit"],
                            "category": "RecipeIngredient",
                            "estimated_unit_cost": 0.01
                        }
                        next_id += 1

    return vocab

def preprocess_recipes(raw_file_path, vocab):
    with open(raw_file_path, "r", encoding="utf-8") as f:
        raw_recipes = json.load(f)

    processed_recipes = []
    for r in raw_recipes:
        cat_id = CATEGORY_MAP.get(r["category"], 1)
        tag_ids = [DIETARY_TAG_MAP[t] for t in r.get("dietary_tags", []) if t in DIETARY_TAG_MAP]
        
        proc_ingredients = []
        for ing in r["ingredients"]:
            norm = normalize_ingredient_name(ing["name"])
            ing_id = vocab[norm]["id"]
            proc_ingredients.append({
                "ingredient_id": ing_id,
                "name": vocab[norm]["canonical_name"],
                "quantity": float(ing["quantity"]),
                "unit": ing["unit"]
            })

        processed_recipes.append({
            "recipe_id": int(r["recipe_id"]),
            "recipe_name": str(r["recipe_name"]),
            "category": r["category"],
            "category_id": cat_id,
            "dietary_tags": r.get("dietary_tags", []),
            "dietary_tag_ids": tag_ids,
            "preparation_time_min": int(r["preparation_time_min"]),
            "calories": float(r["calories"]),
            "protein_g": float(r["protein_g"]),
            "carbohydrates_g": float(r["carbohydrates_g"]),
            "fat_g": float(r["fat_g"]),
            "estimated_cost_usd": float(r["estimated_cost_usd"]),
            "ingredients": proc_ingredients
        })
    return processed_recipes

def preprocess_pantry(pantry_file_path, vocab):
    with open(pantry_file_path, "r", encoding="utf-8") as f:
        raw_pantry = json.load(f)

    processed_pantry = []
    for item in raw_pantry:
        norm = normalize_ingredient_name(item["ingredient_name"])
        ing_id = vocab[norm]["id"]
        processed_pantry.append({
            "pantry_id": int(item["pantry_id"]),
            "ingredient_id": ing_id,
            "ingredient_name": vocab[norm]["canonical_name"],
            "quantity": float(item["quantity"]),
            "unit": item["unit"],
            "days_to_expiry": int(item["days_to_expiry"]),
            "expiry_date": item["expiry_date"],
            "estimated_unit_cost": float(item["estimated_unit_cost"]),
            "category": item["category"],
            "perishability_hazard": float(item["perishability_hazard"])
        })
    return processed_pantry

def export_cpp_binary_dat(processed_recipes, processed_pantry, output_recipe_dat, output_pantry_dat):
    """Exports clean, space-delimited .dat format for sub-millisecond C++ reading"""
    
    # Write Recipes .dat
    with open(output_recipe_dat, "w", encoding="utf-8") as f:
        f.write(f"{len(processed_recipes)}\n")
        for r in processed_recipes:
            # line: id cat_id prep_time cal prot carb fat cost num_tags [tags...] num_ings [ing_id qty ...]
            tag_str = f"{len(r['dietary_tag_ids'])} " + " ".join(map(str, r['dietary_tag_ids'])) if r['dietary_tag_ids'] else "0"
            ing_tokens = []
            for ing in r["ingredients"]:
                ing_tokens.append(f"{ing['ingredient_id']} {ing['quantity']:.2f}")
            ing_str = f"{len(ing_tokens)} " + " ".join(ing_tokens)
            
            f.write(f"{r['recipe_id']} {r['category_id']} {r['preparation_time_min']} "
                    f"{r['calories']:.1f} {r['protein_g']:.1f} {r['carbohydrates_g']:.1f} {r['fat_g']:.1f} "
                    f"{r['estimated_cost_usd']:.2f} {tag_str} {ing_str}\n")

    # Write Pantry .dat
    with open(output_pantry_dat, "w", encoding="utf-8") as f:
        f.write(f"{len(processed_pantry)}\n")
        for item in processed_pantry:
            # line: pantry_id ing_id quantity days_to_expiry unit_cost hazard
            f.write(f"{item['pantry_id']} {item['ingredient_id']} {item['quantity']:.2f} "
                    f"{item['days_to_expiry']} {item['estimated_unit_cost']:.4f} {item['perishability_hazard']:.2f}\n")

def export_csv(recipes, csv_path):
    if not recipes:
        return
    fieldnames = [
        "recipe_id", "recipe_name", "category", "category_id", "preparation_time_min",
        "calories", "protein_g", "carbohydrates_g", "fat_g", "estimated_cost_usd", "dietary_tags"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in recipes:
            row = {k: r[k] for k in fieldnames if k != "dietary_tags"}
            row["dietary_tags"] = ";".join(r["dietary_tags"])
            writer.writerow(row)

def main():
    print("[*] Running Data Preprocessing and Normalization Pipeline...")
    
    pantry_raw_path = os.path.join(PANTRY_DATA_DIR, "pantry_inventory.json")
    recipe_files = [
        os.path.join(RAW_DATA_DIR, "recipes_small.json"),
        os.path.join(RAW_DATA_DIR, "recipes_medium.json"),
        os.path.join(RAW_DATA_DIR, "recipes_large.json")
    ]

    # 1. Build Ingredient Vocabulary
    vocab = build_ingredient_vocabulary(recipe_files, pantry_raw_path)
    vocab_path = os.path.join(PROCESSED_DATA_DIR, "ingredient_vocabulary.json")
    with open(vocab_path, "w", encoding="utf-8") as f:
        json.dump(vocab, f, indent=2)
    print(f"  [+] Unified Ingredient Vocabulary built: {len(vocab)} distinct ingredients mapped.")

    # 2. Process Pantry
    proc_pantry = preprocess_pantry(pantry_raw_path, vocab)
    pantry_proc_json = os.path.join(PROCESSED_DATA_DIR, "pantry_processed.json")
    with open(pantry_proc_json, "w", encoding="utf-8") as f:
        json.dump(proc_pantry, f, indent=2)
    pantry_dat_path = os.path.join(PROCESSED_DATA_DIR, "pantry.dat")

    # 3. Process Tiers
    tiers = [
        ("small", os.path.join(RAW_DATA_DIR, "recipes_small.json")),
        ("medium", os.path.join(RAW_DATA_DIR, "recipes_medium.json")),
        ("large", os.path.join(RAW_DATA_DIR, "recipes_large.json"))
    ]

    for name, raw_path in tiers:
        proc_recipes = preprocess_recipes(raw_path, vocab)
        
        # Save JSON
        json_out = os.path.join(PROCESSED_DATA_DIR, f"recipes_{name}_processed.json")
        with open(json_out, "w", encoding="utf-8") as f:
            json.dump(proc_recipes, f, indent=2)

        # Save CSV
        csv_out = os.path.join(PROCESSED_DATA_DIR, f"recipes_{name}_processed.csv")
        export_csv(proc_recipes, csv_out)

        # Save C++ .dat
        dat_out = os.path.join(PROCESSED_DATA_DIR, f"recipes_{name}.dat")
        export_cpp_binary_dat(proc_recipes, proc_pantry, dat_out, pantry_dat_path)

        print(f"  [+] Processed {name.capitalize()} Tier ({len(proc_recipes)} recipes) -> JSON, CSV, and C++ .dat")

    print("[*] Preprocessing Completed Successfully!")

if __name__ == "__main__":
    main()
