#ifndef TYPES_HPP
#define TYPES_HPP

#include <vector>
#include <string>
#include <unordered_map>
#include <iostream>

namespace meal_planner {

// Ingredient requirement in a recipe
struct IngredientRequirement {
    int ingredient_id;
    double quantity;
};

// Recipe entity
struct Recipe {
    int id;
    int category_id;            // 0: Breakfast, 1: Lunch, 2: Dinner, 3: Snack
    int prep_time_min;
    double calories;
    double protein_g;
    double carbohydrates_g;
    double fat_g;
    double estimated_cost_usd;
    std::vector<int> dietary_tag_ids;
    std::vector<IngredientRequirement> ingredients;
};

// Stocked pantry item
struct PantryItem {
    int pantry_id;
    int ingredient_id;
    double quantity;
    int days_to_expiry;
    double unit_cost;
    double perishability_hazard; // 1.0 to 5.0
};

// Nutritional target profile
struct TargetGoals {
    double calories = 2000.0;
    double protein_g = 130.0;
    double carbohydrates_g = 220.0;
    double fat_g = 65.0;
    std::vector<int> required_dietary_tags; // Must satisfy all required tags
};

// Multi-Objective Fitness Weights
struct FitnessWeights {
    double w_nutr = 0.35;
    double w_expiry = 0.35;
    double w_cost = 0.15;
    double w_waste = 0.15;
    double cost_scale = 30.0;       // Scale factor for normalizing grocery expenditure
    double expiry_tau = 3.0;        // Expiry decay constant (days)
    int critical_expiry_days = 2;   // Critical window for food waste penalty
};

// Objective scores decomposition
struct ObjectiveScores {
    double f_nutr = 0.0;
    double f_expiry = 0.0;
    double f_cost = 0.0;
    double f_waste = 0.0;
    double f_composite = 0.0;

    double total_calories = 0.0;
    double total_protein = 0.0;
    double total_carbs = 0.0;
    double total_fat = 0.0;

    double out_of_pocket_cost = 0.0;
    double waste_penalty_raw = 0.0;
    int expiring_items_rescued = 0;
    bool is_dietary_valid = true;
};

// Chromosome representing candidate 4-meal daily plan
struct Chromosome {
    std::vector<int> recipe_indices; // [Breakfast, Lunch, Dinner, Snack] (0-indexed into category-filtered recipe list)
    ObjectiveScores scores;
    double fitness = -1e9;

    bool operator<(const Chromosome& other) const {
        return fitness < other.fitness; // For sorting ascending (worst to best)
    }

    bool operator>(const Chromosome& other) const {
        return fitness > other.fitness; // For sorting descending (best to worst)
    }
};

// GA Configuration Hyperparameters
struct GAConfig {
    int population_size = 100;
    int max_generations = 100;
    double crossover_rate = 0.85;
    double mutation_rate = 0.12;
    int tournament_size = 3;
    int elitism_count = 2;
    unsigned int random_seed = 42;
    int meal_slots = 4; // Breakfast, Lunch, Dinner, Snack
};

// Generation Telemetry Log
struct GenerationLog {
    int generation;
    double best_fitness;
    double avg_fitness;
    double worst_fitness;
    double best_nutr_score;
    double best_expiry_score;
    double best_cost_score;
    double best_waste_score;
    double best_cal;
    double best_prot;
    double best_carb;
    double best_fat;
    double execution_time_ms;
};

// GA Execution Result
struct GAResult {
    Chromosome best_solution;
    std::vector<GenerationLog> history;
    double total_execution_time_ms = 0.0;
    int total_generations = 0;
    int population_size = 0;
};

} // namespace meal_planner

#endif // TYPES_HPP
