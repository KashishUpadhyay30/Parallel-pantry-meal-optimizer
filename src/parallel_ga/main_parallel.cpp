#include "../models/types.hpp"
#include "../utils/data_loader.hpp"
#include "../fitness/fitness_evaluator.hpp"
#include "parallel_island_ga.hpp"

#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <iomanip>
#include <omp.h>

using namespace meal_planner;

void printUsage(const char* prog) {
    std::cout << "Usage: " << prog << " [options]\n"
              << "Options:\n"
              << "  --threads <int>      Number of OpenMP worker threads / islands (default: auto max)\n"
              << "  --recipes <path>     Path to recipe .dat file (default: data/processed/recipes_medium.dat)\n"
              << "  --pantry <path>      Path to pantry .dat file (default: data/processed/pantry.dat)\n"
              << "  --pop <int>          Total population across all islands (default: 100)\n"
              << "  --gen <int>          Number of generations (default: 100)\n"
              << "  --seed <int>         Random seed (default: 42)\n"
              << "  --mig_interval <int> Migration interval in generations (default: 15)\n"
              << "  --mig_size <int>     Number of elite migrants per exchange (default: 2)\n"
              << "  --crossover <float>  Crossover probability (default: 0.85)\n"
              << "  --mutation <float>   Mutation probability (default: 0.12)\n"
              << "  --tournament <int>   Tournament size (default: 3)\n"
              << "  --elites <int>       Elitism count per island (default: 2)\n"
              << "  --cal <float>        Target daily calories (default: 2000.0)\n"
              << "  --prot <float>       Target daily protein (g) (default: 130.0)\n"
              << "  --carb <float>       Target daily carbs (g) (default: 220.0)\n"
              << "  --fat <float>        Target daily fat (g) (default: 65.0)\n"
              << "  --output_json <path> Path to export run JSON telemetry\n"
              << "  --verbose            Print generation progress\n"
              << "  --help               Show this message\n";
}

void writeParallelResultJson(
    const std::string& filepath,
    const ParallelGAResult& result,
    const GAConfig& config,
    const MigrationConfig& mig_config,
    const TargetGoals& targets,
    const std::vector<Recipe>& recipes
) {
    std::ofstream out(filepath);
    if (!out.is_open()) {
        std::cerr << "[Warning] Failed to write JSON results to: " << filepath << std::endl;
        return;
    }

    out << "{\n";
    out << "  \"algorithm\": \"OpenMP Parallel Island GA\",\n";
    out << "  \"num_threads\": " << result.num_threads << ",\n";
    out << "  \"num_islands\": " << result.num_islands << ",\n";
    out << "  \"population_per_island\": " << result.population_per_island << ",\n";
    out << "  \"total_population\": " << result.population_size << ",\n";
    out << "  \"total_generations\": " << result.total_generations << ",\n";
    out << "  \"migration_interval\": " << mig_config.migration_interval << ",\n";
    out << "  \"migration_size\": " << mig_config.migration_size << ",\n";
    out << "  \"total_migrations\": " << result.total_migrations << ",\n";
    out << "  \"execution_time_ms\": " << result.total_execution_time_ms << ",\n";
    out << "  \"random_seed\": " << config.random_seed << ",\n";
    out << "  \"targets\": {\n";
    out << "    \"calories\": " << targets.calories << ",\n";
    out << "    \"protein_g\": " << targets.protein_g << ",\n";
    out << "    \"carbohydrates_g\": " << targets.carbohydrates_g << ",\n";
    out << "    \"fat_g\": " << targets.fat_g << "\n";
    out << "  },\n";
    out << "  \"best_fitness\": " << result.best_solution.fitness << ",\n";
    out << "  \"best_scores\": {\n";
    out << "    \"f_nutr\": " << result.best_solution.scores.f_nutr << ",\n";
    out << "    \"f_expiry\": " << result.best_solution.scores.f_expiry << ",\n";
    out << "    \"f_cost\": " << result.best_solution.scores.f_cost << ",\n";
    out << "    \"f_waste\": " << result.best_solution.scores.f_waste << ",\n";
    out << "    \"total_calories\": " << result.best_solution.scores.total_calories << ",\n";
    out << "    \"total_protein\": " << result.best_solution.scores.total_protein << ",\n";
    out << "    \"total_carbs\": " << result.best_solution.scores.total_carbs << ",\n";
    out << "    \"total_fat\": " << result.best_solution.scores.total_fat << ",\n";
    out << "    \"out_of_pocket_cost\": " << result.best_solution.scores.out_of_pocket_cost << ",\n";
    out << "    \"expiring_items_rescued\": " << result.best_solution.scores.expiring_items_rescued << "\n";
    out << "  },\n";
    out << "  \"selected_recipes\": [";
    for (size_t i = 0; i < result.best_solution.recipe_indices.size(); ++i) {
        int r_idx = result.best_solution.recipe_indices[i];
        out << recipes[r_idx].id;
        if (i + 1 < result.best_solution.recipe_indices.size()) out << ", ";
    }
    out << "],\n";
    out << "  \"island_best_fitnesses\": [";
    for (size_t i = 0; i < result.island_best_solutions.size(); ++i) {
        out << result.island_best_solutions[i].fitness;
        if (i + 1 < result.island_best_solutions.size()) out << ", ";
    }
    out << "],\n";
    out << "  \"history\": [\n";
    for (size_t i = 0; i < result.history.size(); ++i) {
        const auto& log = result.history[i];
        out << "    {\"gen\": " << log.generation
            << ", \"best_fit\": " << log.best_fitness
            << ", \"avg_fit\": " << log.avg_fitness
            << ", \"nutr\": " << log.best_nutr_score
            << ", \"expiry\": " << log.best_expiry_score
            << ", \"cost\": " << log.best_cost_score
            << ", \"time_ms\": " << log.execution_time_ms << "}";
        if (i + 1 < result.history.size()) out << ",";
        out << "\n";
    }
    out << "  ]\n";
    out << "}\n";
    out.close();
}

int main(int argc, char* argv[]) {
    std::string recipe_file = "data/processed/recipes_medium.dat";
    std::string pantry_file = "data/processed/pantry.dat";
    std::string output_json = "";
    int num_threads = omp_get_max_threads();
    bool verbose = false;

    GAConfig config;
    MigrationConfig mig_config;
    TargetGoals targets;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--threads" && i + 1 < argc) num_threads = std::stoi(argv[++i]);
        else if (arg == "--recipes" && i + 1 < argc) recipe_file = argv[++i];
        else if (arg == "--pantry" && i + 1 < argc) pantry_file = argv[++i];
        else if (arg == "--pop" && i + 1 < argc) config.population_size = std::stoi(argv[++i]);
        else if (arg == "--gen" && i + 1 < argc) config.max_generations = std::stoi(argv[++i]);
        else if (arg == "--seed" && i + 1 < argc) config.random_seed = static_cast<unsigned int>(std::stoul(argv[++i]));
        else if (arg == "--mig_interval" && i + 1 < argc) mig_config.migration_interval = std::stoi(argv[++i]);
        else if (arg == "--mig_size" && i + 1 < argc) mig_config.migration_size = std::stoi(argv[++i]);
        else if (arg == "--crossover" && i + 1 < argc) config.crossover_rate = std::stod(argv[++i]);
        else if (arg == "--mutation" && i + 1 < argc) config.mutation_rate = std::stod(argv[++i]);
        else if (arg == "--tournament" && i + 1 < argc) config.tournament_size = std::stoi(argv[++i]);
        else if (arg == "--elites" && i + 1 < argc) config.elitism_count = std::stoi(argv[++i]);
        else if (arg == "--cal" && i + 1 < argc) targets.calories = std::stod(argv[++i]);
        else if (arg == "--prot" && i + 1 < argc) targets.protein_g = std::stod(argv[++i]);
        else if (arg == "--carb" && i + 1 < argc) targets.carbohydrates_g = std::stod(argv[++i]);
        else if (arg == "--fat" && i + 1 < argc) targets.fat_g = std::stod(argv[++i]);
        else if (arg == "--output_json" && i + 1 < argc) output_json = argv[++i];
        else if (arg == "--verbose") verbose = true;
        else if (arg == "--help") {
            printUsage(argv[0]);
            return 0;
        }
    }

    std::vector<Recipe> recipes;
    std::vector<std::vector<int>> category_map;
    if (!DataLoader::loadRecipes(recipe_file, recipes, category_map)) {
        std::cerr << "[Error] Failed to load recipes from " << recipe_file << std::endl;
        return 1;
    }

    std::vector<PantryItem> pantry;
    std::unordered_map<int, PantryItem> pantry_map;
    if (!DataLoader::loadPantry(pantry_file, pantry, pantry_map)) {
        std::cerr << "[Error] Failed to load pantry from " << pantry_file << std::endl;
        return 1;
    }

    FitnessEvaluator evaluator(recipes, pantry, pantry_map, targets);
    ParallelIslandGA pga(recipes, category_map, evaluator, config, mig_config, num_threads);

    ParallelGAResult result = pga.run(verbose);

    if (!output_json.empty()) {
        writeParallelResultJson(output_json, result, config, mig_config, targets, recipes);
        if (verbose) {
            std::cout << "[+] Saved telemetry JSON to: " << output_json << std::endl;
        }
    }

    // Standardized summary output
    std::cout << "SUMMARY: threads=" << result.num_threads
              << " time_ms=" << result.total_execution_time_ms
              << " best_fitness=" << result.best_solution.fitness
              << " nutr=" << result.best_solution.scores.f_nutr
              << " expiry=" << result.best_solution.scores.f_expiry
              << " cost=" << result.best_solution.scores.out_of_pocket_cost
              << " migrations=" << result.total_migrations
              << std::endl;

    return 0;
}
