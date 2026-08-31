#ifndef PARALLEL_ISLAND_GA_HPP
#define PARALLEL_ISLAND_GA_HPP

#include "../models/types.hpp"
#include "../fitness/fitness_evaluator.hpp"
#include "../island_model/migration_buffer.hpp"
#include <vector>
#include <random>

namespace meal_planner {

struct ParallelGAResult : public GAResult {
    int num_threads = 1;
    int num_islands = 1;
    int population_per_island = 0;
    int total_migrations = 0;
    std::vector<Chromosome> island_best_solutions;
};

class ParallelIslandGA {
public:
    ParallelIslandGA(
        const std::vector<Recipe>& recipes,
        const std::vector<std::vector<int>>& category_recipe_map,
        const FitnessEvaluator& evaluator,
        const GAConfig& config = GAConfig(),
        const MigrationConfig& migration_config = MigrationConfig(),
        int num_threads = 4
    );

    ParallelGAResult run(bool verbose = false);

private:
    const std::vector<Recipe>& m_recipes;
    const std::vector<std::vector<int>>& m_category_recipe_map;
    const FitnessEvaluator& m_evaluator;
    GAConfig m_config;
    MigrationConfig m_migration_config;
    int m_num_threads;

    int getRandomRecipeForSlot(int slot, std::mt19937& rng);
    void initializeIslandPopulation(std::vector<Chromosome>& population, int pop_size, std::mt19937& rng);
    void evaluateIslandPopulation(std::vector<Chromosome>& population);
    int tournamentSelect(const std::vector<Chromosome>& population, std::mt19937& rng);
    Chromosome crossover(const Chromosome& p1, const Chromosome& p2, std::mt19937& rng);
    void mutate(Chromosome& individual, std::mt19937& rng);
};

} // namespace meal_planner

#endif // PARALLEL_ISLAND_GA_HPP
