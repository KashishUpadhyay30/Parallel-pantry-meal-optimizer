#ifndef SEQUENTIAL_GA_HPP
#define SEQUENTIAL_GA_HPP

#include "../models/types.hpp"
#include "../fitness/fitness_evaluator.hpp"
#include <vector>
#include <random>

namespace meal_planner {

class SequentialGA {
public:
    SequentialGA(
        const std::vector<Recipe>& recipes,
        const std::vector<std::vector<int>>& category_recipe_map,
        const FitnessEvaluator& evaluator,
        const GAConfig& config = GAConfig()
    );

    GAResult run(bool verbose = false);

private:
    const std::vector<Recipe>& m_recipes;
    const std::vector<std::vector<int>>& m_category_recipe_map;
    const FitnessEvaluator& m_evaluator;
    GAConfig m_config;
    std::mt19937 m_rng;

    void initializePopulation(std::vector<Chromosome>& population);
    void evaluatePopulation(std::vector<Chromosome>& population);
    int tournamentSelect(const std::vector<Chromosome>& population);
    Chromosome crossover(const Chromosome& parent1, const Chromosome& parent2);
    void mutate(Chromosome& individual);
    int getRandomRecipeForSlot(int slot);
};

} // namespace meal_planner

#endif // SEQUENTIAL_GA_HPP
