#include "sequential_ga.hpp"
#include <algorithm>
#include <chrono>
#include <iostream>
#include <iomanip>

namespace meal_planner {

SequentialGA::SequentialGA(
    const std::vector<Recipe>& recipes,
    const std::vector<std::vector<int>>& category_recipe_map,
    const FitnessEvaluator& evaluator,
    const GAConfig& config
) : m_recipes(recipes),
    m_category_recipe_map(category_recipe_map),
    m_evaluator(evaluator),
    m_config(config),
    m_rng(config.random_seed)
{
}

int SequentialGA::getRandomRecipeForSlot(int slot) {
    if (slot >= 0 && slot < static_cast<int>(m_category_recipe_map.size()) && !m_category_recipe_map[slot].empty()) {
        std::uniform_int_distribution<int> dist(0, static_cast<int>(m_category_recipe_map[slot].size()) - 1);
        return m_category_recipe_map[slot][dist(m_rng)];
    }
    std::uniform_int_distribution<int> dist(0, static_cast<int>(m_recipes.size()) - 1);
    return dist(m_rng);
}

void SequentialGA::initializePopulation(std::vector<Chromosome>& population) {
    population.resize(m_config.population_size);
    for (int i = 0; i < m_config.population_size; ++i) {
        population[i].recipe_indices.resize(m_config.meal_slots);
        for (int s = 0; s < m_config.meal_slots; ++s) {
            population[i].recipe_indices[s] = getRandomRecipeForSlot(s);
        }
    }
}

void SequentialGA::evaluatePopulation(std::vector<Chromosome>& population) {
    for (auto& individual : population) {
        m_evaluator.evaluate(individual);
    }
}

int SequentialGA::tournamentSelect(const std::vector<Chromosome>& population) {
    std::uniform_int_distribution<int> dist(0, static_cast<int>(population.size()) - 1);
    int best_idx = dist(m_rng);
    double best_fit = population[best_idx].fitness;

    for (int i = 1; i < m_config.tournament_size; ++i) {
        int candidate_idx = dist(m_rng);
        if (population[candidate_idx].fitness > best_fit) {
            best_idx = candidate_idx;
            best_fit = population[candidate_idx].fitness;
        }
    }
    return best_idx;
}

Chromosome SequentialGA::crossover(const Chromosome& parent1, const Chromosome& parent2) {
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    Chromosome child;
    child.recipe_indices.resize(m_config.meal_slots);

    if (prob(m_rng) < m_config.crossover_rate) {
        // Uniform Crossover per meal slot
        for (int s = 0; s < m_config.meal_slots; ++s) {
            if (prob(m_rng) < 0.5) {
                child.recipe_indices[s] = parent1.recipe_indices[s];
            } else {
                child.recipe_indices[s] = parent2.recipe_indices[s];
            }
        }
    } else {
        // Direct clone of parent 1
        child.recipe_indices = parent1.recipe_indices;
    }
    return child;
}

void SequentialGA::mutate(Chromosome& individual) {
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    for (int s = 0; s < m_config.meal_slots; ++s) {
        if (prob(m_rng) < m_config.mutation_rate) {
            individual.recipe_indices[s] = getRandomRecipeForSlot(s);
        }
    }
}

GAResult SequentialGA::run(bool verbose) {
    auto start_time = std::chrono::high_resolution_clock::now();

    GAResult result;
    result.population_size = m_config.population_size;
    result.total_generations = m_config.max_generations;
    result.history.reserve(m_config.max_generations);

    std::vector<Chromosome> population;
    initializePopulation(population);
    evaluatePopulation(population);

    // Sort descending by fitness
    std::sort(population.begin(), population.end(), std::greater<Chromosome>());
    result.best_solution = population[0];

    if (verbose) {
        std::cout << "\n=======================================================\n";
        std::cout << " Starting Sequential Multi-Objective Genetic Algorithm\n";
        std::cout << " Population: " << m_config.population_size 
                  << " | Generations: " << m_config.max_generations 
                  << " | Seed: " << m_config.random_seed << "\n";
        std::cout << "=======================================================\n";
        std::cout << std::setw(6) << "Gen" 
                  << std::setw(12) << "Best Fit" 
                  << std::setw(12) << "Avg Fit" 
                  << std::setw(10) << "Nutr" 
                  << std::setw(10) << "Expiry" 
                  << std::setw(10) << "Cost($)" 
                  << std::setw(10) << "Time(ms)" << "\n";
        std::cout << "-------------------------------------------------------\n";
    }

    for (int gen = 0; gen < m_config.max_generations; ++gen) {
        // 1. Telemetry and Logging
        double sum_fitness = 0.0;
        for (const auto& ind : population) {
            sum_fitness += ind.fitness;
        }
        double avg_fitness = sum_fitness / m_config.population_size;

        if (population[0].fitness > result.best_solution.fitness) {
            result.best_solution = population[0];
        }

        auto gen_now = std::chrono::high_resolution_clock::now();
        double elapsed_ms = std::chrono::duration<double, std::milli>(gen_now - start_time).count();

        GenerationLog log;
        log.generation = gen + 1;
        log.best_fitness = population[0].fitness;
        log.avg_fitness = avg_fitness;
        log.worst_fitness = population.back().fitness;
        log.best_nutr_score = population[0].scores.f_nutr;
        log.best_expiry_score = population[0].scores.f_expiry;
        log.best_cost_score = population[0].scores.out_of_pocket_cost;
        log.best_waste_score = population[0].scores.f_waste;
        log.best_cal = population[0].scores.total_calories;
        log.best_prot = population[0].scores.total_protein;
        log.best_carb = population[0].scores.total_carbs;
        log.best_fat = population[0].scores.total_fat;
        log.execution_time_ms = elapsed_ms;
        result.history.push_back(log);

        if (verbose && ((gen + 1) % 10 == 0 || gen == 0 || gen == m_config.max_generations - 1)) {
            std::cout << std::setw(6) << (gen + 1)
                      << std::setw(12) << std::fixed << std::setprecision(4) << population[0].fitness
                      << std::setw(12) << std::fixed << std::setprecision(4) << avg_fitness
                      << std::setw(10) << std::fixed << std::setprecision(3) << population[0].scores.f_nutr
                      << std::setw(10) << std::fixed << std::setprecision(3) << population[0].scores.f_expiry
                      << std::setw(10) << std::fixed << std::setprecision(2) << population[0].scores.out_of_pocket_cost
                      << std::setw(10) << std::fixed << std::setprecision(1) << elapsed_ms << "\n";
        }

        // 2. Next Generation Creation
        std::vector<Chromosome> next_population;
        next_population.reserve(m_config.population_size);

        // Elitism: Preserve top E individuals
        int elites = std::min(m_config.elitism_count, m_config.population_size);
        for (int e = 0; e < elites; ++e) {
            next_population.push_back(population[e]);
        }

        // Reproduction & Variation
        while (static_cast<int>(next_population.size()) < m_config.population_size) {
            int p1_idx = tournamentSelect(population);
            int p2_idx = tournamentSelect(population);

            Chromosome child = crossover(population[p1_idx], population[p2_idx]);
            mutate(child);
            next_population.push_back(child);
        }

        // Evaluate and Sort
        population = std::move(next_population);
        evaluatePopulation(population);
        std::sort(population.begin(), population.end(), std::greater<Chromosome>());
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    result.total_execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    if (verbose) {
        std::cout << "=======================================================\n";
        std::cout << " [Optimization Complete]\n";
        std::cout << " Total Time: " << result.total_execution_time_ms << " ms\n";
        std::cout << " Global Best Fitness: " << result.best_solution.fitness << "\n";
        std::cout << " - Nutrition Satisfaction: " << result.best_solution.scores.f_nutr * 100.0 << "%\n";
        std::cout << " - Expiry Utilization Score: " << result.best_solution.scores.f_expiry * 100.0 << "%\n";
        std::cout << " - Out-of-Pocket Cost: $" << result.best_solution.scores.out_of_pocket_cost << "\n";
        std::cout << " - Calories: " << result.best_solution.scores.total_calories 
                  << " kcal (Target: " << m_evaluator.getTargets().calories << ")\n";
        std::cout << " - Protein: " << result.best_solution.scores.total_protein 
                  << " g (Target: " << m_evaluator.getTargets().protein_g << ")\n";
        std::cout << " - Carbs: " << result.best_solution.scores.total_carbs 
                  << " g (Target: " << m_evaluator.getTargets().carbohydrates_g << ")\n";
        std::cout << " - Fat: " << result.best_solution.scores.total_fat 
                  << " g (Target: " << m_evaluator.getTargets().fat_g << ")\n";
        std::cout << "=======================================================\n\n";
    }

    return result;
}

} // namespace meal_planner
