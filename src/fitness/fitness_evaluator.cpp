#include "fitness_evaluator.hpp"
#include <algorithm>
#include <iostream>

namespace meal_planner {

FitnessEvaluator::FitnessEvaluator(
    const std::vector<Recipe>& recipes,
    const std::vector<PantryItem>& pantry,
    const std::unordered_map<int, PantryItem>& pantry_map,
    const TargetGoals& targets,
    const FitnessWeights& weights
) : m_recipes(recipes),
    m_pantry(pantry),
    m_pantry_map(pantry_map),
    m_targets(targets),
    m_weights(weights)
{
    precomputePantryUrgency();
}

void FitnessEvaluator::precomputePantryUrgency() {
    m_total_pantry_urgency = 0.0;
    for (const auto& item : m_pantry) {
        double urgency = item.perishability_hazard * std::exp(-static_cast<double>(item.days_to_expiry) / m_weights.expiry_tau);
        m_total_pantry_urgency += urgency;
    }
}

void FitnessEvaluator::evaluate(Chromosome& chromosome) const {
    ObjectiveScores scores;
    scores.is_dietary_valid = true;

    // 1. Calculate Aggregate Macronutrients and Check Dietary Restrictions
    for (int recipe_idx : chromosome.recipe_indices) {
        if (recipe_idx < 0 || recipe_idx >= static_cast<int>(m_recipes.size())) {
            chromosome.fitness = -1e9;
            return;
        }

        const Recipe& r = m_recipes[recipe_idx];
        scores.total_calories += r.calories;
        scores.total_protein += r.protein_g;
        scores.total_carbs += r.carbohydrates_g;
        scores.total_fat += r.fat_g;

        // Check dietary tags
        if (!m_targets.required_dietary_tags.empty()) {
            for (int req_tag : m_targets.required_dietary_tags) {
                bool found = false;
                for (int tag : r.dietary_tag_ids) {
                    if (tag == req_tag) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    scores.is_dietary_valid = false;
                }
            }
        }
    }

    // 2. Objective 1: Nutritional Goal Satisfaction (Normalized Inverse Manhattan Distance)
    double delta_cal = std::abs(scores.total_calories - m_targets.calories) / (m_targets.calories + 1e-6);
    double delta_prot = std::abs(scores.total_protein - m_targets.protein_g) / (m_targets.protein_g + 1e-6);
    double delta_carb = std::abs(scores.total_carbs - m_targets.carbohydrates_g) / (m_targets.carbohydrates_g + 1e-6);
    double delta_fat = std::abs(scores.total_fat - m_targets.fat_g) / (m_targets.fat_g + 1e-6);

    double macro_error = 0.25 * (delta_cal + delta_prot + delta_carb + delta_fat);
    scores.f_nutr = std::max(0.0, 1.0 - macro_error);

    // 3. Aggregate Required Ingredients Across Chromosome
    std::unordered_map<int, double> required_quantities;
    for (int recipe_idx : chromosome.recipe_indices) {
        const Recipe& r = m_recipes[recipe_idx];
        for (const auto& ing : r.ingredients) {
            required_quantities[ing.ingredient_id] += ing.quantity;
        }
    }

    // 4. Objective 2: Expiry Urgency Utilization Score
    double weighted_utilized_urgency = 0.0;
    int rescued_count = 0;

    for (const auto& item : m_pantry) {
        double req = 0.0;
        auto it = required_quantities.find(item.ingredient_id);
        if (it != required_quantities.end()) {
            req = it->second;
        }

        double util_ratio = std::min(1.0, req / (item.quantity + 1e-6));
        double urgency = item.perishability_hazard * std::exp(-static_cast<double>(item.days_to_expiry) / m_weights.expiry_tau);
        weighted_utilized_urgency += util_ratio * urgency;

        if (item.days_to_expiry <= m_weights.critical_expiry_days && req > 0.0) {
            rescued_count++;
        }
    }
    scores.f_expiry = (m_total_pantry_urgency > 1e-6) ? (weighted_utilized_urgency / m_total_pantry_urgency) : 0.0;
    scores.expiring_items_rescued = rescued_count;

    // 5. Objective 3: Out-of-Pocket Grocery Additional Cost
    double total_extra_cost = 0.0;
    for (const auto& pair : required_quantities) {
        int ing_id = pair.first;
        double req_qty = pair.second;

        double avail_qty = 0.0;
        double unit_cost = 0.01; // default fallback

        auto it = m_pantry_map.find(ing_id);
        if (it != m_pantry_map.end()) {
            avail_qty = it->second.quantity;
            unit_cost = it->second.unit_cost;
        }

        double shortage = std::max(0.0, req_qty - avail_qty);
        total_extra_cost += shortage * unit_cost;
    }
    scores.out_of_pocket_cost = total_extra_cost;
    scores.f_cost = total_extra_cost / m_weights.cost_scale;

    // 6. Objective 4: Food Waste Spoilage Penalty (for unutilized critical items)
    double raw_waste_penalty = 0.0;
    for (const auto& item : m_pantry) {
        if (item.days_to_expiry <= m_weights.critical_expiry_days) {
            double req = 0.0;
            auto it = required_quantities.find(item.ingredient_id);
            if (it != required_quantities.end()) {
                req = it->second;
            }

            double unused_qty = std::max(0.0, item.quantity - req);
            raw_waste_penalty += item.perishability_hazard * item.unit_cost * unused_qty;
        }
    }
    scores.waste_penalty_raw = raw_waste_penalty;
    scores.f_waste = raw_waste_penalty / m_weights.cost_scale;

    // 7. Composite Fitness Function
    double diet_penalty = scores.is_dietary_valid ? 0.0 : 5.0;
    scores.f_composite = (m_weights.w_nutr * scores.f_nutr)
                       + (m_weights.w_expiry * scores.f_expiry)
                       - (m_weights.w_cost * scores.f_cost)
                       - (m_weights.w_waste * scores.f_waste)
                       - diet_penalty;

    chromosome.scores = scores;
    chromosome.fitness = scores.f_composite;
}

} // namespace meal_planner
