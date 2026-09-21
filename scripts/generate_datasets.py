"""
Dataset Generator for High-Performance Multi-Objective Meal Planning
Generates multi-tier raw recipe datasets (Small: 60, Medium: 500, Large: 2500)
and realistic sample pantry inventories.
"""

import json
import random
import os
from datetime import datetime, timedelta

# Fix seed for reproducibility in scientific evaluation
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
PANTRY_DATA_DIR = os.path.join(BASE_DIR, "data", "sample_pantry")

os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(PANTRY_DATA_DIR, exist_ok=True)

# Ingredient Catalog with Standard Units, Base Cost ($/unit), Category, and Perishability (1-5)
INGREDIENT_CATALOG = [
    # Dairy / Eggs
    {"name": "Whole Milk", "unit": "ml", "unit_cost": 0.003, "category": "Dairy", "hazard": 4.5},
    {"name": "Greek Yogurt", "unit": "g", "unit_cost": 0.008, "category": "Dairy", "hazard": 4.0},
    {"name": "Cheddar Cheese", "unit": "g", "unit_cost": 0.012, "category": "Dairy", "hazard": 3.0},
    {"name": "Eggs", "unit": "count", "unit_cost": 0.30, "category": "Dairy", "hazard": 3.5},
    {"name": "Butter", "unit": "g", "unit_cost": 0.010, "category": "Dairy", "hazard": 2.5},
    {"name": "Heavy Cream", "unit": "ml", "unit_cost": 0.009, "category": "Dairy", "hazard": 4.5},
    {"name": "Parmesan Cheese", "unit": "g", "unit_cost": 0.020, "category": "Dairy", "hazard": 2.0},
    {"name": "Mozzarella", "unit": "g", "unit_cost": 0.011, "category": "Dairy", "hazard": 4.0},

    # Fresh Produce (Vegetables)
    {"name": "Spinach", "unit": "g", "unit_cost": 0.010, "category": "Produce", "hazard": 5.0},
    {"name": "Tomatoes", "unit": "g", "unit_cost": 0.006, "category": "Produce", "hazard": 4.5},
    {"name": "Broccoli", "unit": "g", "unit_cost": 0.007, "category": "Produce", "hazard": 4.0},
    {"name": "Carrots", "unit": "g", "unit_cost": 0.004, "category": "Produce", "hazard": 2.5},
    {"name": "Onions", "unit": "g", "unit_cost": 0.003, "category": "Produce", "hazard": 2.0},
    {"name": "Garlic", "unit": "g", "unit_cost": 0.008, "category": "Produce", "hazard": 2.0},
    {"name": "Bell Peppers", "unit": "g", "unit_cost": 0.008, "category": "Produce", "hazard": 4.0},
    {"name": "Mushrooms", "unit": "g", "unit_cost": 0.012, "category": "Produce", "hazard": 5.0},
    {"name": "Zucchini", "unit": "g", "unit_cost": 0.006, "category": "Produce", "hazard": 4.0},
    {"name": "Avocado", "unit": "count", "unit_cost": 1.25, "category": "Produce", "hazard": 4.5},
    {"name": "Potatoes", "unit": "g", "unit_cost": 0.003, "category": "Produce", "hazard": 1.5},
    {"name": "Sweet Potatoes", "unit": "g", "unit_cost": 0.004, "category": "Produce", "hazard": 2.0},
    {"name": "Lettuce", "unit": "g", "unit_cost": 0.007, "category": "Produce", "hazard": 5.0},
    {"name": "Cucumber", "unit": "g", "unit_cost": 0.005, "category": "Produce", "hazard": 4.0},

    # Fresh Produce (Fruits)
    {"name": "Bananas", "unit": "count", "unit_cost": 0.35, "category": "Produce", "hazard": 4.0},
    {"name": "Apples", "unit": "count", "unit_cost": 0.75, "category": "Produce", "hazard": 2.5},
    {"name": "Strawberries", "unit": "g", "unit_cost": 0.015, "category": "Produce", "hazard": 5.0},
    {"name": "Blueberries", "unit": "g", "unit_cost": 0.018, "category": "Produce", "hazard": 4.5},
    {"name": "Lemons", "unit": "count", "unit_cost": 0.60, "category": "Produce", "hazard": 2.5},

    # Meat & Seafood & Plant Protein
    {"name": "Chicken Breast", "unit": "g", "unit_cost": 0.014, "category": "Protein", "hazard": 4.8},
    {"name": "Ground Turkey", "unit": "g", "unit_cost": 0.015, "category": "Protein", "hazard": 4.8},
    {"name": "Ground Beef", "unit": "g", "unit_cost": 0.018, "category": "Protein", "hazard": 4.8},
    {"name": "Salmon Fillet", "unit": "g", "unit_cost": 0.026, "category": "Protein", "hazard": 5.0},
    {"name": "Tuna (Canned)", "unit": "g", "unit_cost": 0.012, "category": "Protein", "hazard": 1.0},
    {"name": "Tofu", "unit": "g", "unit_cost": 0.008, "category": "Protein", "hazard": 3.8},
    {"name": "Chickpeas (Canned)", "unit": "g", "unit_cost": 0.005, "category": "Protein", "hazard": 1.0},
    {"name": "Black Beans (Canned)", "unit": "g", "unit_cost": 0.005, "category": "Protein", "hazard": 1.0},
    {"name": "Lentils", "unit": "g", "unit_cost": 0.004, "category": "Protein", "hazard": 1.0},
    {"name": "Shrimp", "unit": "g", "unit_cost": 0.024, "category": "Protein", "hazard": 4.8},

    # Grains, Pasta & Bakery
    {"name": "White Rice", "unit": "g", "unit_cost": 0.003, "category": "Grains", "hazard": 1.0},
    {"name": "Brown Rice", "unit": "g", "unit_cost": 0.004, "category": "Grains", "hazard": 1.0},
    {"name": "Rolled Oats", "unit": "g", "unit_cost": 0.003, "category": "Grains", "hazard": 1.0},
    {"name": "Whole Wheat Bread", "unit": "count", "unit_cost": 0.20, "category": "Bakery", "hazard": 3.5},
    {"name": "Pasta (Spaghetti/Penne)", "unit": "g", "unit_cost": 0.004, "category": "Grains", "hazard": 1.0},
    {"name": "Quinoa", "unit": "g", "unit_cost": 0.009, "category": "Grains", "hazard": 1.0},
    {"name": "Tortillas", "unit": "count", "unit_cost": 0.25, "category": "Bakery", "hazard": 2.5},

    # Oils, Sauces & Condiments
    {"name": "Olive Oil", "unit": "ml", "unit_cost": 0.015, "category": "Pantry", "hazard": 1.0},
    {"name": "Soy Sauce", "unit": "ml", "unit_cost": 0.008, "category": "Pantry", "hazard": 1.0},
    {"name": "Peanut Butter", "unit": "g", "unit_cost": 0.008, "category": "Pantry", "hazard": 1.2},
    {"name": "Honey", "unit": "g", "unit_cost": 0.012, "category": "Pantry", "hazard": 1.0},
    {"name": "Tomato Sauce", "unit": "g", "unit_cost": 0.005, "category": "Pantry", "hazard": 1.5},
    {"name": "Almonds", "unit": "g", "unit_cost": 0.018, "category": "Pantry", "hazard": 1.5},
    {"name": "Walnuts", "unit": "g", "unit_cost": 0.020, "category": "Pantry", "hazard": 1.5},
    {"name": "Chia Seeds", "unit": "g", "unit_cost": 0.016, "category": "Pantry", "hazard": 1.0}
]

INGREDIENT_MAP = {ing["name"]: ing for ing in INGREDIENT_CATALOG}

# Canonical Recipe Templates across Meal Slots
RECIPE_TEMPLATES = [
    # BREAKFAST
    {
        "name": "Classic Spinach & Mushroom Omelette",
        "category": "Breakfast",
        "tags": ["Vegetarian", "Keto", "Gluten-Free", "High-Protein", "Halal"],
        "prep_time": 15,
        "ingredients": [
            ("Eggs", 3), ("Spinach", 50), ("Mushrooms", 60), ("Butter", 15), ("Cheddar Cheese", 30)
        ]
    },
    {
        "name": "Greek Yogurt Berry Nut Bowl",
        "category": "Breakfast",
        "tags": ["Vegetarian", "Gluten-Free", "High-Protein", "Halal"],
        "prep_time": 5,
        "ingredients": [
            ("Greek Yogurt", 200), ("Blueberries", 60), ("Strawberries", 50), ("Almonds", 25), ("Honey", 20)
        ]
    },
    {
        "name": "Avocado & Egg Whole Wheat Toast",
        "category": "Breakfast",
        "tags": ["Vegetarian", "Halal"],
        "prep_time": 10,
        "ingredients": [
            ("Whole Wheat Bread", 2), ("Avocado", 1), ("Eggs", 2), ("Olive Oil", 10), ("Tomatoes", 40)
        ]
    },
    {
        "name": "Peanut Butter Banana Oatmeal",
        "category": "Breakfast",
        "tags": ["Vegan", "Vegetarian", "Dairy-Free", "Halal"],
        "prep_time": 10,
        "ingredients": [
            ("Rolled Oats", 60), ("Whole Milk", 150), ("Bananas", 1), ("Peanut Butter", 30), ("Chia Seeds", 10)
        ]
    },
    {
        "name": "High-Protein Tofu Breakfast Scramble",
        "category": "Breakfast",
        "tags": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "High-Protein", "Halal"],
        "prep_time": 15,
        "ingredients": [
            ("Tofu", 180), ("Spinach", 60), ("Bell Peppers", 50), ("Olive Oil", 15), ("Onions", 40)
        ]
    },
    {
        "name": "Berry Chia Yogurt Parfait",
        "category": "Breakfast",
        "tags": ["Vegetarian", "Gluten-Free", "Halal"],
        "prep_time": 5,
        "ingredients": [
            ("Greek Yogurt", 180), ("Strawberries", 80), ("Chia Seeds", 15), ("Honey", 15), ("Walnuts", 20)
        ]
    },

    # LUNCH
    {
        "name": "Grilled Chicken & Quinoa Harvest Bowl",
        "category": "Lunch",
        "tags": ["Gluten-Free", "High-Protein", "Halal"],
        "prep_time": 25,
        "ingredients": [
            ("Chicken Breast", 180), ("Quinoa", 70), ("Broccoli", 100), ("Carrots", 60), ("Olive Oil", 15), ("Garlic", 10)
        ]
    },
    {
        "name": "Mediterranean Chickpea & Avocado Salad",
        "category": "Lunch",
        "tags": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Halal"],
        "prep_time": 12,
        "ingredients": [
            ("Chickpeas (Canned)", 150), ("Cucumber", 80), ("Tomatoes", 80), ("Avocado", 1), ("Olive Oil", 15), ("Lemons", 1)
        ]
    },
    {
        "name": "Tuna Salad Whole Wheat Wrap",
        "category": "Lunch",
        "tags": ["High-Protein", "Halal"],
        "prep_time": 10,
        "ingredients": [
            ("Tuna (Canned)", 130), ("Tortillas", 2), ("Lettuce", 40), ("Tomatoes", 50), ("Greek Yogurt", 30)
        ]
    },
    {
        "name": "Black Bean Burrito Bowl with Brown Rice",
        "category": "Lunch",
        "tags": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Halal"],
        "prep_time": 20,
        "ingredients": [
            ("Black Beans (Canned)", 160), ("Brown Rice", 80), ("Bell Peppers", 70), ("Onions", 50), ("Tomatoes", 60), ("Olive Oil", 10)
        ]
    },
    {
        "name": "Creamy Tomato & Mozzarella Penne",
        "category": "Lunch",
        "tags": ["Vegetarian", "Halal"],
        "prep_time": 20,
        "ingredients": [
            ("Pasta (Spaghetti/Penne)", 90), ("Tomato Sauce", 120), ("Mozzarella", 60), ("Garlic", 10), ("Olive Oil", 10), ("Spinach", 40)
        ]
    },
    {
        "name": "Turkey Avocado BLT Wrap",
        "category": "Lunch",
        "tags": ["High-Protein", "Halal"],
        "prep_time": 15,
        "ingredients": [
            ("Ground Turkey", 150), ("Tortillas", 2), ("Avocado", 1), ("Lettuce", 50), ("Tomatoes", 60), ("Olive Oil", 10)
        ]
    },

    # DINNER
    {
        "name": "Pan-Seared Salmon with Garlic Butter Broccoli & Sweet Potato",
        "category": "Dinner",
        "tags": ["Gluten-Free", "High-Protein", "Halal"],
        "prep_time": 30,
        "ingredients": [
            ("Salmon Fillet", 200), ("Sweet Potatoes", 180), ("Broccoli", 120), ("Butter", 20), ("Garlic", 15), ("Lemons", 1)
        ]
    },
    {
        "name": "Lean Ground Beef Stir-Fry with Brown Rice & Peppers",
        "category": "Dinner",
        "tags": ["Gluten-Free", "Dairy-Free", "High-Protein", "Halal"],
        "prep_time": 25,
        "ingredients": [
            ("Ground Beef", 180), ("Brown Rice", 80), ("Bell Peppers", 80), ("Onions", 60), ("Soy Sauce", 20), ("Garlic", 10)
        ]
    },
    {
        "name": "Creamy Garlic Parmesan Chicken Fettuccine",
        "category": "Dinner",
        "tags": ["High-Protein", "Halal"],
        "prep_time": 30,
        "ingredients": [
            ("Chicken Breast", 180), ("Pasta (Spaghetti/Penne)", 90), ("Heavy Cream", 60), ("Parmesan Cheese", 35), ("Garlic", 15), ("Butter", 15)
        ]
    },
    {
        "name": "Hearty Lentil & Vegetable Stew",
        "category": "Dinner",
        "tags": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Halal"],
        "prep_time": 35,
        "ingredients": [
            ("Lentils", 120), ("Carrots", 80), ("Potatoes", 120), ("Onions", 60), ("Tomatoes", 80), ("Garlic", 15), ("Olive Oil", 15)
        ]
    },
    {
        "name": "Garlic Butter Shrimp with Zucchini Noodles & Tomatoes",
        "category": "Dinner",
        "tags": ["Keto", "Gluten-Free", "High-Protein", "Low-Carb", "Halal"],
        "prep_time": 20,
        "ingredients": [
            ("Shrimp", 200), ("Zucchini", 180), ("Tomatoes", 80), ("Garlic", 15), ("Butter", 20), ("Parmesan Cheese", 25)
        ]
    },
    {
        "name": "Savory Tofu & Mushroom Teriyaki Bowl",
        "category": "Dinner",
        "tags": ["Vegan", "Vegetarian", "Dairy-Free", "Halal"],
        "prep_time": 25,
        "ingredients": [
            ("Tofu", 200), ("White Rice", 80), ("Mushrooms", 80), ("Broccoli", 100), ("Soy Sauce", 25), ("Honey", 15), ("Olive Oil", 10)
        ]
    },

    # SNACK
    {
        "name": "Apple Slices with Natural Peanut Butter",
        "category": "Snack",
        "tags": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Halal"],
        "prep_time": 3,
        "ingredients": [
            ("Apples", 1), ("Peanut Butter", 35)
        ]
    },
    {
        "name": "Banana Almond Protein Smoothie",
        "category": "Snack",
        "tags": ["Vegetarian", "Gluten-Free", "Halal"],
        "prep_time": 5,
        "ingredients": [
            ("Bananas", 1), ("Whole Milk", 180), ("Greek Yogurt", 80), ("Almonds", 20), ("Honey", 10)
        ]
    },
    {
        "name": "Cheddar Cheese & Boiled Egg Power Snack",
        "category": "Snack",
        "tags": ["Vegetarian", "Keto", "Gluten-Free", "High-Protein", "Halal"],
        "prep_time": 8,
        "ingredients": [
            ("Eggs", 1), ("Cheddar Cheese", 40), ("Cucumber", 60)
        ]
    },
    {
        "name": "Strawberries & Dark Chocolate Walnut Cup",
        "category": "Snack",
        "tags": ["Vegan", "Vegetarian", "Gluten-Free", "Halal"],
        "prep_time": 4,
        "ingredients": [
            ("Strawberries", 100), ("Walnuts", 30), ("Honey", 10)
        ]
    }
]

# Nutritional estimation coefficients (approx per 100g/unit)
NUTRIENT_PROFILE = {
    "Eggs": {"cal": 72, "p": 6.3, "c": 0.4, "f": 4.8},        # per egg
    "Chicken Breast": {"cal": 165, "p": 31.0, "c": 0.0, "f": 3.6}, # per 100g
    "Ground Turkey": {"cal": 170, "p": 27.0, "c": 0.0, "f": 7.0},
    "Ground Beef": {"cal": 250, "p": 26.0, "c": 0.0, "f": 17.0},
    "Salmon Fillet": {"cal": 208, "p": 20.0, "c": 0.0, "f": 13.0},
    "Tuna (Canned)": {"cal": 116, "p": 25.5, "c": 0.0, "f": 0.8},
    "Shrimp": {"cal": 99, "p": 24.0, "c": 0.2, "f": 0.3},
    "Tofu": {"cal": 76, "p": 8.0, "c": 1.9, "f": 4.8},
    "Greek Yogurt": {"cal": 97, "p": 10.0, "c": 3.6, "f": 5.0},
    "Whole Milk": {"cal": 61, "p": 3.2, "c": 4.8, "f": 3.3},     # per 100ml
    "Cheddar Cheese": {"cal": 402, "p": 25.0, "c": 1.3, "f": 33.0},
    "Mozzarella": {"cal": 280, "p": 22.0, "c": 2.2, "f": 21.0},
    "Parmesan Cheese": {"cal": 431, "p": 38.0, "c": 4.1, "f": 29.0},
    "Butter": {"cal": 717, "p": 0.9, "c": 0.1, "f": 81.0},
    "Heavy Cream": {"cal": 340, "p": 2.8, "c": 2.7, "f": 36.0},
    "Whole Wheat Bread": {"cal": 80, "p": 4.0, "c": 14.0, "f": 1.0}, # per slice
    "Tortillas": {"cal": 120, "p": 3.0, "c": 22.0, "f": 2.5},       # per tortilla
    "White Rice": {"cal": 130, "p": 2.7, "c": 28.0, "f": 0.3},     # cooked per 100g
    "Brown Rice": {"cal": 111, "p": 2.6, "c": 23.0, "f": 0.9},
    "Quinoa": {"cal": 120, "p": 4.4, "c": 21.3, "f": 1.9},
    "Rolled Oats": {"cal": 389, "p": 16.9, "c": 66.3, "f": 6.9},
    "Pasta (Spaghetti/Penne)": {"cal": 158, "p": 5.8, "c": 30.9, "f": 0.9},
    "Chickpeas (Canned)": {"cal": 120, "p": 7.0, "c": 20.0, "f": 2.0},
    "Black Beans (Canned)": {"cal": 114, "p": 7.6, "c": 20.4, "f": 0.5},
    "Lentils": {"cal": 116, "p": 9.0, "c": 20.0, "f": 0.4},
    "Spinach": {"cal": 23, "p": 2.9, "c": 3.6, "f": 0.4},
    "Broccoli": {"cal": 34, "p": 2.8, "c": 6.6, "f": 0.4},
    "Tomatoes": {"cal": 18, "p": 0.9, "c": 3.9, "f": 0.2},
    "Carrots": {"cal": 41, "p": 0.9, "c": 9.6, "f": 0.2},
    "Onions": {"cal": 40, "p": 1.1, "c": 9.3, "f": 0.1},
    "Garlic": {"cal": 149, "p": 6.4, "c": 33.1, "f": 0.5},
    "Bell Peppers": {"cal": 31, "p": 1.0, "c": 6.0, "f": 0.3},
    "Mushrooms": {"cal": 22, "p": 3.1, "c": 3.3, "f": 0.3},
    "Zucchini": {"cal": 17, "p": 1.2, "c": 3.1, "f": 0.3},
    "Avocado": {"cal": 160, "p": 2.0, "c": 8.5, "f": 14.7},     # per 100g
    "Potatoes": {"cal": 77, "p": 2.0, "c": 17.0, "f": 0.1},
    "Sweet Potatoes": {"cal": 86, "p": 1.6, "c": 20.1, "f": 0.1},
    "Lettuce": {"cal": 15, "p": 1.4, "c": 2.9, "f": 0.2},
    "Cucumber": {"cal": 15, "p": 0.7, "c": 3.6, "f": 0.1},
    "Bananas": {"cal": 89, "p": 1.1, "c": 22.8, "f": 0.3},     # per 100g (approx 1 med banana = 118g)
    "Apples": {"cal": 52, "p": 0.3, "c": 13.8, "f": 0.2},
    "Strawberries": {"cal": 32, "p": 0.7, "c": 7.7, "f": 0.3},
    "Blueberries": {"cal": 57, "p": 0.7, "c": 14.5, "f": 0.3},
    "Lemons": {"cal": 20, "p": 0.5, "c": 4.0, "f": 0.2},
    "Olive Oil": {"cal": 884, "p": 0.0, "c": 0.0, "f": 100.0},
    "Soy Sauce": {"cal": 53, "p": 8.0, "c": 4.9, "f": 0.6},
    "Peanut Butter": {"cal": 588, "p": 25.0, "c": 20.0, "f": 50.0},
    "Honey": {"cal": 304, "p": 0.3, "c": 82.4, "f": 0.0},
    "Tomato Sauce": {"cal": 40, "p": 1.6, "c": 8.0, "f": 0.5},
    "Almonds": {"cal": 579, "p": 21.2, "c": 21.6, "f": 49.9},
    "Walnuts": {"cal": 654, "p": 15.2, "c": 13.7, "f": 65.2},
    "Chia Seeds": {"cal": 486, "p": 16.5, "c": 42.1, "f": 30.7}
}

def calculate_recipe_nutrition_and_cost(ingredients_list):
    total_cal = 0.0
    total_p = 0.0
    total_c = 0.0
    total_f = 0.0
    total_cost = 0.0

    for name, qty in ingredients_list:
        ing_meta = INGREDIENT_MAP.get(name, {"unit_cost": 0.01, "unit": "g"})
        nutr = NUTRIENT_PROFILE.get(name, {"cal": 50, "p": 2, "c": 5, "f": 1})

        # Cost
        total_cost += qty * ing_meta["unit_cost"]

        # Nutrition
        if ing_meta["unit"] == "count":
            # Per unit item
            scale = qty
            if name == "Avocado":
                scale = qty * 1.5 # approx 150g edible
            elif name == "Bananas":
                scale = qty * 1.2 # approx 120g
            elif name == "Apples":
                scale = qty * 1.8 # approx 180g
            elif name == "Lemons":
                scale = qty * 0.6 # approx 60g
            total_cal += nutr["cal"] * scale
            total_p += nutr["p"] * scale
            total_c += nutr["c"] * scale
            total_f += nutr["f"] * scale
        else:
            # Per 100g/ml
            scale = qty / 100.0
            total_cal += nutr["cal"] * scale
            total_p += nutr["p"] * scale
            total_c += nutr["c"] * scale
            total_f += nutr["f"] * scale

    return {
        "calories": round(total_cal, 1),
        "protein": round(total_p, 1),
        "carbohydrates": round(total_c, 1),
        "fat": round(total_f, 1),
        "estimated_cost": round(total_cost, 2)
    }

def synthesize_dataset(num_recipes):
    recipes = []
    
    # 1. First include canonical template recipes
    recipe_id = 1
    for template in RECIPE_TEMPLATES:
        nutr = calculate_recipe_nutrition_and_cost(template["ingredients"])
        formatted_ingredients = [
            {"name": name, "quantity": qty, "unit": INGREDIENT_MAP[name]["unit"]}
            for name, qty in template["ingredients"]
        ]
        recipes.append({
            "recipe_id": recipe_id,
            "recipe_name": template["name"],
            "category": template["category"],
            "dietary_tags": template["tags"],
            "preparation_time_min": template["prep_time"],
            "calories": nutr["calories"],
            "protein_g": nutr["protein"],
            "carbohydrates_g": nutr["carbohydrates"],
            "fat_g": nutr["fat"],
            "estimated_cost_usd": nutr["estimated_cost"],
            "ingredients": formatted_ingredients
        })
        recipe_id += 1
        if recipe_id > num_recipes:
            return recipes

    # 2. Synthesize variations for benchmark scaling
    categories = ["Breakfast", "Lunch", "Dinner", "Snack"]
    category_weights = [0.25, 0.30, 0.35, 0.10]
    
    adjectives = ["Zesty", "Savory", "Herb-Crusted", "Hearty", "Rustic", "Golden", "Crispy", "Spicy", "Roasted", "Fresh", "Fiesta", "Garden-Fresh", "Smoky"]
    
    while recipe_id <= num_recipes:
        base_template = random.choice(RECIPE_TEMPLATES)
        cat = base_template["category"]
        adj = random.choice(adjectives)
        name = f"{adj} {base_template['name']} Style {recipe_id}"
        
        # Perturb ingredients slightly
        perturbed_ingredients = []
        for ing_name, qty in base_template["ingredients"]:
            factor = random.uniform(0.75, 1.25)
            if INGREDIENT_MAP[ing_name]["unit"] == "count":
                new_qty = max(1, int(round(qty * factor)))
            else:
                new_qty = max(5, int(round(qty * factor / 5.0) * 5))
            perturbed_ingredients.append((ing_name, new_qty))
            
        # Maybe swap one ingredient with a compatible catalog item
        if random.random() < 0.35 and len(perturbed_ingredients) > 2:
            swap_idx = random.randint(0, len(perturbed_ingredients) - 1)
            target_ing = perturbed_ingredients[swap_idx][0]
            target_cat = INGREDIENT_MAP[target_ing]["category"]
            candidates = [c["name"] for c in INGREDIENT_CATALOG if c["category"] == target_cat and c["name"] != target_ing]
            if candidates:
                new_ing_name = random.choice(candidates)
                new_unit = INGREDIENT_MAP[new_ing_name]["unit"]
                new_qty = perturbed_ingredients[swap_idx][1] if new_unit != "count" else random.randint(1, 2)
                perturbed_ingredients[swap_idx] = (new_ing_name, new_qty)

        nutr = calculate_recipe_nutrition_and_cost(perturbed_ingredients)
        formatted_ingredients = [
            {"name": ing_name, "quantity": qty, "unit": INGREDIENT_MAP[ing_name]["unit"]}
            for ing_name, qty in perturbed_ingredients
        ]
        
        recipes.append({
            "recipe_id": recipe_id,
            "recipe_name": name,
            "category": cat,
            "dietary_tags": base_template["tags"],
            "preparation_time_min": base_template["prep_time"] + random.randint(-5, 10),
            "calories": nutr["calories"],
            "protein_g": nutr["protein"],
            "carbohydrates_g": nutr["carbohydrates"],
            "fat_g": nutr["fat"],
            "estimated_cost_usd": nutr["estimated_cost"],
            "ingredients": formatted_ingredients
        })
        recipe_id += 1

    return recipes

def generate_sample_pantry():
    """Generates realistic user pantry inventory with imminent expiry dates"""
    reference_date = datetime.now()
    pantry_items = [
        {"name": "Spinach", "quantity": 180, "unit": "g", "days_to_expiry": 1, "hazard": 5.0},
        {"name": "Mushrooms", "quantity": 200, "unit": "g", "days_to_expiry": 2, "hazard": 5.0},
        {"name": "Chicken Breast", "quantity": 400, "unit": "g", "days_to_expiry": 2, "hazard": 4.8},
        {"name": "Whole Milk", "quantity": 600, "unit": "ml", "days_to_expiry": 2, "hazard": 4.5},
        {"name": "Strawberries", "quantity": 250, "unit": "g", "days_to_expiry": 2, "hazard": 5.0},
        {"name": "Greek Yogurt", "quantity": 350, "unit": "g", "days_to_expiry": 3, "hazard": 4.0},
        {"name": "Avocado", "quantity": 3, "unit": "count", "days_to_expiry": 3, "hazard": 4.5},
        {"name": "Eggs", "quantity": 8, "unit": "count", "days_to_expiry": 4, "hazard": 3.5},
        {"name": "Bell Peppers", "quantity": 160, "unit": "g", "days_to_expiry": 4, "hazard": 4.0},
        {"name": "Tomatoes", "quantity": 300, "unit": "g", "days_to_expiry": 5, "hazard": 4.5},
        {"name": "Broccoli", "quantity": 250, "unit": "g", "days_to_expiry": 5, "hazard": 4.0},
        {"name": "Cheddar Cheese", "quantity": 150, "unit": "g", "days_to_expiry": 6, "hazard": 3.0},
        {"name": "Mozzarella", "quantity": 120, "unit": "g", "days_to_expiry": 6, "hazard": 4.0},
        {"name": "Whole Wheat Bread", "quantity": 6, "unit": "count", "days_to_expiry": 4, "hazard": 3.5},
        {"name": "Butter", "quantity": 100, "unit": "g", "days_to_expiry": 10, "hazard": 2.5},
        {"name": "Ground Beef", "quantity": 350, "unit": "g", "days_to_expiry": 3, "hazard": 4.8},
        {"name": "Carrots", "quantity": 200, "unit": "g", "days_to_expiry": 10, "hazard": 2.5},
        {"name": "Onions", "quantity": 300, "unit": "g", "days_to_expiry": 14, "hazard": 2.0},
        {"name": "Garlic", "quantity": 50, "unit": "g", "days_to_expiry": 14, "hazard": 2.0},
        {"name": "White Rice", "quantity": 500, "unit": "g", "days_to_expiry": 90, "hazard": 1.0},
        {"name": "Brown Rice", "quantity": 500, "unit": "g", "days_to_expiry": 90, "hazard": 1.0},
        {"name": "Rolled Oats", "quantity": 400, "unit": "g", "days_to_expiry": 60, "hazard": 1.0},
        {"name": "Pasta (Spaghetti/Penne)", "quantity": 500, "unit": "g", "days_to_expiry": 90, "hazard": 1.0},
        {"name": "Olive Oil", "quantity": 400, "unit": "ml", "days_to_expiry": 120, "hazard": 1.0},
        {"name": "Peanut Butter", "quantity": 250, "unit": "g", "days_to_expiry": 60, "hazard": 1.2},
        {"name": "Honey", "quantity": 200, "unit": "g", "days_to_expiry": 180, "hazard": 1.0},
        {"name": "Chickpeas (Canned)", "quantity": 400, "unit": "g", "days_to_expiry": 180, "hazard": 1.0},
        {"name": "Almonds", "quantity": 150, "unit": "g", "days_to_expiry": 60, "hazard": 1.5},
        {"name": "Chia Seeds", "quantity": 100, "unit": "g", "days_to_expiry": 90, "hazard": 1.0},
        {"name": "Soy Sauce", "quantity": 200, "unit": "ml", "days_to_expiry": 120, "hazard": 1.0}
    ]

    pantry_records = []
    for idx, item in enumerate(pantry_items, 1):
        expiry_date = (reference_date + timedelta(days=item["days_to_expiry"])).strftime("%Y-%m-%d")
        meta = INGREDIENT_MAP.get(item["name"], {"unit_cost": 0.01, "category": "Pantry"})
        pantry_records.append({
            "pantry_id": idx,
            "ingredient_name": item["name"],
            "quantity": item["quantity"],
            "unit": item["unit"],
            "days_to_expiry": item["days_to_expiry"],
            "expiry_date": expiry_date,
            "estimated_unit_cost": meta["unit_cost"],
            "category": meta["category"],
            "perishability_hazard": item["hazard"]
        })
    return pantry_records

def main():
    print("[*] Generating Multi-Tier Recipe Datasets...")
    
    # 1. Small dataset (60 recipes)
    small_recipes = synthesize_dataset(60)
    with open(os.path.join(RAW_DATA_DIR, "recipes_small.json"), "w", encoding="utf-8") as f:
        json.dump(small_recipes, f, indent=2)
    print(f"  [+] Saved data/raw/recipes_small.json ({len(small_recipes)} recipes)")

    # 2. Medium dataset (500 recipes)
    medium_recipes = synthesize_dataset(500)
    with open(os.path.join(RAW_DATA_DIR, "recipes_medium.json"), "w", encoding="utf-8") as f:
        json.dump(medium_recipes, f, indent=2)
    print(f"  [+] Saved data/raw/recipes_medium.json ({len(medium_recipes)} recipes)")

    # 3. Large dataset (2500 recipes)
    large_recipes = synthesize_dataset(2500)
    with open(os.path.join(RAW_DATA_DIR, "recipes_large.json"), "w", encoding="utf-8") as f:
        json.dump(large_recipes, f, indent=2)
    print(f"  [+] Saved data/raw/recipes_large.json ({len(large_recipes)} recipes)")

    # 4. Sample Pantry
    pantry = generate_sample_pantry()
    with open(os.path.join(PANTRY_DATA_DIR, "pantry_inventory.json"), "w", encoding="utf-8") as f:
        json.dump(pantry, f, indent=2)
    
    # Also save pantry as CSV
    import csv
    with open(os.path.join(PANTRY_DATA_DIR, "pantry_inventory.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=pantry[0].keys())
        writer.writeheader()
        writer.writerows(pantry)
    print(f"  [+] Saved data/sample_pantry/pantry_inventory.json & .csv ({len(pantry)} items)")

if __name__ == "__main__":
    main()
