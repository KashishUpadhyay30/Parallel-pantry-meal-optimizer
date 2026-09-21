/**
 * MPI Distributed-Memory Island Model Genetic Algorithm
 * Designed for multi-node High-Performance Computing (HPC) clusters.
 * Uses non-blocking / synchronized point-to-point MPI communication
 * for Ring Topology elite migration and MPI_Reduce for global reduction.
 */

#include <iostream>
#include <vector>
#include <random>
#include <chrono>
#include <algorithm>
#include "../models/types.hpp"
#include "../utils/data_loader.hpp"
#include "../fitness/fitness_evaluator.hpp"

#ifdef USE_MPI
#include <mpi.h>
#endif

using namespace meal_planner;

int main(int argc, char* argv[]) {
    int rank = 0;
    int num_procs = 1;

#ifdef USE_MPI
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &num_procs);
#endif

    std::string recipe_file = "data/processed/recipes_medium.dat";
    std::string pantry_file = "data/processed/pantry.dat";
    int pop_per_island = 50;
    int max_generations = 100;
    int migration_interval = 15;
    int migration_size = 2;
    unsigned int base_seed = 42;

    std::vector<Recipe> recipes;
    std::vector<std::vector<int>> category_map;
    if (!DataLoader::loadRecipes(recipe_file, recipes, category_map)) {
        if (rank == 0) std::cerr << "[Error] Failed to load recipes\n";
#ifdef USE_MPI
        MPI_Finalize();
#endif
        return 1;
    }

    std::vector<PantryItem> pantry;
    std::unordered_map<int, PantryItem> pantry_map;
    if (!DataLoader::loadPantry(pantry_file, pantry, pantry_map)) {
        if (rank == 0) std::cerr << "[Error] Failed to load pantry\n";
#ifdef USE_MPI
        MPI_Finalize();
#endif
        return 1;
    }

    TargetGoals targets;
    FitnessEvaluator evaluator(recipes, pantry, pantry_map, targets);
    std::mt19937 rng(base_seed + rank * 10007 + 1);

    if (rank == 0) {
        std::cout << "=======================================================\n";
        std::cout << " MPI Distributed Island Model Genetic Algorithm\n";
        std::cout << " Total MPI Processes / Nodes: " << num_procs << "\n";
        std::cout << " Population per Node: " << pop_per_island << "\n";
        std::cout << " Generations: " << max_generations << "\n";
        std::cout << "=======================================================\n";
    }

    // Local Population Initialization
    std::vector<Chromosome> local_pop(pop_per_island);
    for (int i = 0; i < pop_per_island; ++i) {
        local_pop[i].recipe_indices.resize(4);
        for (int s = 0; s < 4; ++s) {
            std::uniform_int_distribution<int> dist(0, static_cast<int>(category_map[s].size()) - 1);
            local_pop[i].recipe_indices[s] = category_map[s][dist(rng)];
        }
        evaluator.evaluate(local_pop[i]);
    }
    std::sort(local_pop.begin(), local_pop.end(), std::greater<Chromosome>());

    auto start_time = std::chrono::high_resolution_clock::now();

    for (int gen = 0; gen < max_generations; ++gen) {
        // Reproduction on local node
        std::vector<Chromosome> next_pop;
        next_pop.reserve(pop_per_island);
        next_pop.push_back(local_pop[0]); // Elitism
        next_pop.push_back(local_pop[1]);

        std::uniform_real_distribution<double> prob(0.0, 1.0);
        std::uniform_int_distribution<int> t_dist(0, pop_per_island - 1);

        while (static_cast<int>(next_pop.size()) < pop_per_island) {
            // Tournament selection
            int p1 = t_dist(rng);
            int p2 = t_dist(rng);

            Chromosome child;
            child.recipe_indices.resize(4);
            for (int s = 0; s < 4; ++s) {
                child.recipe_indices[s] = (prob(rng) < 0.5) ? local_pop[p1].recipe_indices[s] : local_pop[p2].recipe_indices[s];
                if (prob(rng) < 0.12) {
                    std::uniform_int_distribution<int> s_dist(0, static_cast<int>(category_map[s].size()) - 1);
                    child.recipe_indices[s] = category_map[s][s_dist(rng)];
                }
            }
            evaluator.evaluate(child);
            next_pop.push_back(child);
        }

        local_pop = std::move(next_pop);
        std::sort(local_pop.begin(), local_pop.end(), std::greater<Chromosome>());

#ifdef USE_MPI
        // Periodic Distributed Migration across MPI Ring Topology
        if (num_procs > 1 && (gen + 1) % migration_interval == 0) {
            int dest = (rank + 1) % num_procs;
            int src = (rank - 1 + num_procs) % num_procs;

            // Pack top elite recipe indices into buffer
            std::vector<int> send_buf(migration_size * 4);
            for (int e = 0; e < migration_size; ++e) {
                for (int s = 0; s < 4; ++s) {
                    send_buf[e * 4 + s] = local_pop[e].recipe_indices[s];
                }
            }

            std::vector<int> recv_buf(migration_size * 4);
            MPI_Sendrecv(
                send_buf.data(), migration_size * 4, MPI_INT, dest, 0,
                recv_buf.data(), migration_size * 4, MPI_INT, src, 0,
                MPI_COMM_WORLD, MPI_STATUS_IGNORE
            );

            // Unpack into worst positions
            int start_idx = pop_per_island - migration_size;
            for (int e = 0; e < migration_size; ++e) {
                Chromosome immigrant;
                immigrant.recipe_indices.resize(4);
                for (int s = 0; s < 4; ++s) {
                    immigrant.recipe_indices[s] = recv_buf[e * 4 + s];
                }
                evaluator.evaluate(immigrant);
                local_pop[start_idx + e] = immigrant;
            }
            std::sort(local_pop.begin(), local_pop.end(), std::greater<Chromosome>());
        }
#endif
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    double local_elapsed_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    if (rank == 0) {
        std::cout << "[MPI Simulation Complete] Rank 0 Best Fitness: " 
                  << local_pop[0].fitness << " | Time: " << local_elapsed_ms << " ms\n";
    }

#ifdef USE_MPI
    MPI_Finalize();
#endif
    return 0;
}
