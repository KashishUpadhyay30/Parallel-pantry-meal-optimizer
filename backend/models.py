"""
Pydantic API Schemas for Requests and Responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional

class PantryItemCreate(BaseModel):
    ingredient_name: str
    quantity: float
    unit: str
    days_to_expiry: int
    expiry_date: Optional[str] = None
    estimated_unit_cost: float = 0.01
    category: str = "General"
    perishability_hazard: float = 3.0
    image_url: Optional[str] = None

class PantryItemUpdate(BaseModel):
    quantity: Optional[float] = None
    days_to_expiry: Optional[int] = None
    expiry_date: Optional[str] = None
    estimated_unit_cost: Optional[float] = None
    image_url: Optional[str] = None

class PantryItemResponse(PantryItemCreate):
    id: int

class OptimizeRequest(BaseModel):
    algorithm: str = "parallel" # "parallel" or "sequential"
    num_threads: int = 4
    dataset_tier: str = "medium" # "small", "medium", "large"
    population_size: int = 100
    generations: int = 100
    random_seed: int = 42
    target_calories: float = 2000.0
    target_protein: float = 130.0
    target_carbs: float = 220.0
    target_fat: float = 65.0
    required_dietary_tags: List[str] = []

class RecipeRecommendation(BaseModel):
    slot: str # "Breakfast", "Lunch", "Dinner", "Snack"
    recipe_id: int
    recipe_name: str
    calories: float
    protein_g: float
    carbohydrates_g: float
    fat_g: float
    prep_time_min: int
    cook_time_min: Optional[int] = 15
    estimated_cost_usd: float
    estimated_cost_inr: Optional[float] = None
    dietary_tags: List[str]
    ingredients_used_from_pantry: List[str]
    missing_ingredients_to_buy: List[str] = []
    optional_suggestions: Optional[List[str]] = []
    instructions: Optional[List[str]] = []
    chef_tips: Optional[str] = None
    image_url: Optional[str] = None


class OptimizationResponse(BaseModel):
    algorithm: str
    num_threads: int
    execution_time_ms: float
    best_fitness: float
    nutrition_satisfaction_percent: float
    expiry_utilization_percent: float
    out_of_pocket_cost_usd: float
    out_of_pocket_cost_inr: Optional[float] = None
    expiring_items_rescued_count: int
    macro_totals: dict
    recommendations: List[RecipeRecommendation]

class SimulatePantryChangeRequest(BaseModel):
    action: str # "consume", "add", "spoil_warning", "reset"
    ingredient_name: Optional[str] = None
    quantity_delta: Optional[float] = None
    days_to_expiry: Optional[int] = None
