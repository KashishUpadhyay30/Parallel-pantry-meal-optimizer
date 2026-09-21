#include "parallel_island_ga.hpp"
#include <omp.h>
#include <algorithm>
#include <chrono>
#include <iostream>
#include <iomanip>

namespace meal_planner {

ParallelIslandGA::ParallelIslandGA(
    const std::vector<Recipe>& recipes,
    const std::vector<std::vector<int>>& category_recipe_map,
    const FitnessEvaluator& evaluator,
    const GAConfig& config,
    const MigrationConfig& migration_config,
    int num_threads
) : m_recipes(recipes),
    m_category_recipe_map(category_recipe_map),
    m_evaluator(evaluator),
    m_config(config),
    m_migration_config(migration_config),
    m_num_threads(num_threads > 0 ? num_threads : omp_get_max_threads())
{
}

int ParallelIslandGA::getRandomRecipeForSlot(int slot, std::mt19937& rng) {
    if (slot >= 0 && slot < static_cast<int>(m_category_recipe_map.size()) && !m_category_recipe_map[slot].empty()) {
        std::uniform_int_distribution<int> dist(0, static_cast<int>(m_category_recipe_map[slot].size()) - 1);
        return m_category_recipe_map[slot][dist(rng)];
    }
    std::uniform_int_distribution<int> dist(0, static_cast<int>(m_recipes.size()) - 1);
    return dist(rng);
}

void ParallelIslandGA::initializeIslandPopulation(std::vector<Chromosome>& population, int pop_size, std::mt19937& rng) {
    population.resize(pop_size);
    for (int i = 0; i < pop_size; ++i) {
        population[i].recipe_indices.resize(m_config.meal_slots);
        for (int s = 0; s < m_config.meal_slots; ++s) {
            population[i].recipe_indices[s] = getRandomRecipeForSlot(s, rng);
        }
    }
}

void ParallelIslandGA::evaluateIslandPopulation(std::vector<Chromosome>& population) {
    for (auto& individual : population) {
        m_evaluator.evaluate(individual);
    }
}

int ParallelIslandGA::tournamentSelect(const std::vector<Chromosome>& population, std::mt19937& rng) {
    std::uniform_int_distribution<int> dist(0, static_cast<int>(population.size()) - 1);
    int best_idx = dist(rng);
    double best_fit = population[best_idx].fitness;

    for (int i = 1; i < m_config.tournament_size; ++i) {
        int candidate_idx = dist(rng);
        if (population[candidate_idx].fitness > best_fit) {
            best_idx = candidate_idx;
            best_fit = population[candidate_idx].fitness;
        }
    }
    return best_idx;
}

Chromosome ParallelIslandGA::crossover(const Chromosome& p1, const Chromosome& p2, std::mt19937& rng) {
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    Chromosome child;
    child.recipe_indices.resize(m_config.meal_slots);

    if (prob(rng) < m_config.crossover_rate) {
        for (int s = 0; s < m_config.meal_slots; ++s) {
            if (prob(rng) < 0.5) {
                child.recipe_indices[s] = p1.recipe_indices[s];
            } else {
                child.recipe_indices[s] = p2.recipe_indices[s];
            }
        }
    } else {
        child.recipe_indices = p1.recipe_indices;
    }
    return child;
}

void ParallelIslandGA::mutate(Chromosome& individual, std::mt19937& rng) {
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    for (int s = 0; s < m_config.meal_slots; ++s) {
        if (prob(rng) < m_config.mutation_rate) {
            individual.recipe_indices[s] = getRandomRecipeForSlot(s, rng);
        }
    }
}

ParallelGAResult ParallelIslandGA::run(bool verbose) {
    auto start_time = std::chrono::high_resolution_clock::now();

    ParallelGAResult result;
    result.num_threads = m_num_threads;
    result.num_islands = m_num_threads;
    result.total_generations = m_config.max_generations;
    result.history.reserve(m_config.max_generations);
    result.island_best_solutions.resize(m_num_threads);

    int pop_per_island = std::max(4, m_config.population_size / m_num_threads);
    result.population_per_island = pop_per_island;
    result.population_size = pop_per_island * m_num_threads;

    IslandMigrationBuffer migration_buffer(m_num_threads, m_migration_config.migration_size);
    std::vector<std::vector<Chromosome>> all_islands(m_num_threads);

    if (verbose) {
        std::cout << "\n=======================================================\n";
        std::cout << " Starting OpenMP Parallel Island Model Genetic Algorithm\n";
        std::cout << " Threads/Islands: " << m_num_threads 
                  << " | Pop/Island: " << pop_per_island
                  << " | Total Pop: " << result.population_size 
                  << " | Generations: " << m_config.max_generations << "\n";
        std::cout << " Migration Interval: " << m_migration_config.migration_interval 
                  << " | Migration Size: " << m_migration_config.migration_size 
                  << " | Topology: Ring\n";
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

    #pragma omp parallel num_threads(m_num_threads)
    {
        int tid = omp_get_thread_num();
        // Independent thread-local RNG with unique deterministic seed
        std::mt19937 thread_rng(m_config.random_seed + tid * 10007 + 1);

        std::vector<Chromosome>& local_pop = all_islands[tid];
        initializeIslandPopulation(local_pop, pop_per_island, thread_rng);
        evaluateIslandPopulation(local_pop);
        std::sort(local_pop.begin(), local_pop.end(), std::greater<Chromosome>());

        #pragma omp barrier

        for (int gen = 0; gen < m_config.max_generations; ++gen) {
            // Master thread handles telemetry logging at start of generation
            #pragma omp master
            {
                double global_sum_fit = 0.0;
                Chromosome global_best = all_islands[0][0];

                for (int i = 0; i < m_num_threads; ++i) {
                    for (const auto& ind : all_islands[i]) {
                        global_sum_fit += ind.fitness;
                    }
                    if (all_islands[i][0].fitness > global_best.fitness) {
                        global_best = all_islands[i][0];
                    }
                }

                double avg_fitness = global_sum_fit / result.population_size;
                auto now = std::chrono::high_resolution_clock::now();
                double elapsed_ms = std::chrono::duration<double, std::milli>(now - start_time).count();

                GenerationLog log;
                log.generation = gen + 1;
                log.best_fitness = global_best.fitness;
                log.avg_fitness = avg_fitness;
                log.worst_fitness = all_islands[0].back().fitness;
                log.best_nutr_score = global_best.scores.f_nutr;
                log.best_expiry_score = global_best.scores.f_expiry;
                log.best_cost_score = global_best.scores.out_of_pocket_cost;
                log.best_waste_score = global_best.scores.f_waste;
                log.best_cal = global_best.scores.total_calories;
                log.best_prot = global_best.scores.total_protein;
                log.best_carb = global_best.scores.total_carbs;
                log.best_fat = global_best.scores.total_fat;
                log.execution_time_ms = elapsed_ms;
                result.history.push_back(log);

                if (verbose && ((gen + 1) % 10 == 0 || gen == 0 || gen == m_config.max_generations - 1)) {
                    std::cout << std::setw(6) << (gen + 1)
                              << std::setw(12) << std::fixed << std::setprecision(4) << global_best.fitness
                              << std::setw(12) << std::fixed << std::setprecision(4) << avg_fitness
                              << std::setw(10) << std::fixed << std::setprecision(3) << global_best.scores.f_nutr
                              << std::setw(10) << std::fixed << std::setprecision(3) << global_best.scores.f_expiry
                              << std::setw(10) << std::fixed << std::setprecision(2) << global_best.scores.out_of_pocket_cost
                              << std::setw(10) << std::fixed << std::setprecision(1) << elapsed_ms << "\n";
                }
            }

            #pragma omp barrier

            // 1. Next Generation on Local Island
            std::vector<Chromosome> next_pop;
            next_pop.reserve(pop_per_island);

            // Local Elitism
            int elites = std::min(m_config.elitism_count, pop_per_island);
            for (int e = 0; e < elites; ++e) {
                next_pop.push_back(local_pop[e]);
            }

            // Reproduction
            while (static_cast<int>(next_pop.size()) < pop_per_island) {
                int p1 = tournamentSelect(local_pop, thread_rng);
                int p2 = tournamentSelect(local_pop, thread_rng);

                Chromosome child = crossover(local_pop[p1], local_pop[p2], thread_rng);
                mutate(child, thread_rng);
                next_pop.push_back(child);
            }

            local_pop = std::move(next_pop);
            evaluateIslandPopulation(local_pop);
            std::sort(local_pop.begin(), local_pop.end(), std::greater<Chromosome>());

            // 2. Periodic Migration Event across Ring Topology
            if (m_num_threads > 1 && (gen + 1) % m_migration_config.migration_interval == 0) {
                // Step A: Write top elites to outbound buffer
                migration_buffer.prepareSend(tid, local_pop, m_migration_config.migration_size);

                #pragma omp barrier

                // Step B: Receive migrants from predecessor island
                const auto& incoming = migration_buffer.receiveFromNeighbor(tid, m_migration_config.topology);
                int replace_start = pop_per_island - static_cast<int>(incoming.size());
                for (size_t k = 0; k < incoming.size(); ++k) {
                    if (replace_start + static_cast<int>(k) < pop_per_island) {
                        local_pop[replace_start + k] = incoming[k];
                    }
                }

                // Re-sort local population with newly absorbed immigrants
                std::sort(local_pop.begin(), local_pop.end(), std::greater<Chromosome>());

                #pragma omp single
                {
                    result.total_migrations += m_num_threads * m_migration_config.migration_size;
                }
            }

            // Ensure all threads complete local evolution and migration before next iteration's master telemetry
            #pragma omp barrier
        }

        // Store each island's best solution
        result.island_best_solutions[tid] = local_pop[0];
    } // End of OpenMP parallel region

    // Global best reduction
    result.best_solution = result.island_best_solutions[0];
    for (int i = 1; i < m_num_threads; ++i) {
        if (result.island_best_solutions[i].fitness > result.best_solution.fitness) {
            result.best_solution = result.island_best_solutions[i];
        }
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    result.total_execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    if (verbose) {
        std::cout << "=======================================================\n";
        std::cout << " [Parallel Optimization Complete]\n";
        std::cout << " Active Threads: " << m_num_threads << "\n";
        std::cout << " Total Time: " << result.total_execution_time_ms << " ms\n";
        std::cout << " Total Migrations: " << result.total_migrations << "\n";
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
