#ifndef DATA_LOADER_HPP
#define DATA_LOADER_HPP

#include "../models/types.hpp"
#include <string>
#include <vector>
#include <unordered_map>

namespace meal_planner {

class DataLoader {
public:
    static bool loadRecipes(
        const std::string& filepath,
        std::vector<Recipe>& recipes,
        std::vector<std::vector<int>>& category_recipe_map
    );

    static bool loadPantry(
        const std::string& filepath,
        std::vector<PantryItem>& pantry,
        std::unordered_map<int, PantryItem>& pantry_map
    );
};

} // namespace meal_planner

#endif // DATA_LOADER_HPP
