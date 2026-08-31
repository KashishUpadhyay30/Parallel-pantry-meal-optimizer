#include "data_loader.hpp"
#include <fstream>
#include <sstream>
#include <iostream>

namespace meal_planner {

bool DataLoader::loadRecipes(
    const std::string& filepath,
    std::vector<Recipe>& recipes,
    std::vector<std::vector<int>>& category_recipe_map
) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        std::cerr << "[Error] Cannot open recipe dat file: " << filepath << std::endl;
        return false;
    }

    int count = 0;
    if (!(file >> count)) {
        return false;
    }

    recipes.clear();
    recipes.reserve(count);
    category_recipe_map.assign(4, std::vector<int>()); // 0: Breakfast, 1: Lunch, 2: Dinner, 3: Snack

    for (int i = 0; i < count; ++i) {
        Recipe r;
        int num_tags = 0;
        int num_ings = 0;

        if (!(file >> r.id >> r.category_id >> r.prep_time_min
                   >> r.calories >> r.protein_g >> r.carbohydrates_g >> r.fat_g
                   >> r.estimated_cost_usd >> num_tags)) {
            break;
        }

        r.dietary_tag_ids.resize(num_tags);
        for (int t = 0; t < num_tags; ++t) {
            file >> r.dietary_tag_ids[t];
        }

        if (!(file >> num_ings)) {
            break;
        }

        r.ingredients.resize(num_ings);
        for (int ing = 0; ing < num_ings; ++ing) {
            file >> r.ingredients[ing].ingredient_id >> r.ingredients[ing].quantity;
        }

        recipes.push_back(r);

        int index = static_cast<int>(recipes.size()) - 1;
        if (r.category_id >= 0 && r.category_id < 4) {
            category_recipe_map[r.category_id].push_back(index);
        } else {
            // Default to lunch if category out of range
            category_recipe_map[1].push_back(index);
        }
    }

    file.close();
    return true;
}

bool DataLoader::loadPantry(
    const std::string& filepath,
    std::vector<PantryItem>& pantry,
    std::unordered_map<int, PantryItem>& pantry_map
) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        std::cerr << "[Error] Cannot open pantry dat file: " << filepath << std::endl;
        return false;
    }

    int count = 0;
    if (!(file >> count)) {
        return false;
    }

    pantry.clear();
    pantry.reserve(count);
    pantry_map.clear();

    for (int i = 0; i < count; ++i) {
        PantryItem item;
        if (!(file >> item.pantry_id >> item.ingredient_id >> item.quantity
                   >> item.days_to_expiry >> item.unit_cost >> item.perishability_hazard)) {
            break;
        }
        pantry.push_back(item);
        pantry_map[item.ingredient_id] = item;
    }

    file.close();
    return true;
}

} // namespace meal_planner
