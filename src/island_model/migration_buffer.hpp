#ifndef MIGRATION_BUFFER_HPP
#define MIGRATION_BUFFER_HPP

#include "../models/types.hpp"
#include <vector>
#include <string>

namespace meal_planner {

enum class MigrationTopology {
    RING,               // Ring topology: Island i -> Island (i+1) % K
    BI_DIRECTIONAL_RING,// Bi-directional: Island i -> i-1 and i+1
    RANDOM_NEIGHBOR     // Randomly selected peer island
};

enum class ReplacementPolicy {
    BEST_REPLACES_WORST,
    RANDOM_REPLACES_WORST
};

struct MigrationConfig {
    int migration_interval = 15;     // Generations between migration events
    int migration_size = 2;          // Number of elite individuals migrating
    MigrationTopology topology = MigrationTopology::RING;
    ReplacementPolicy policy = ReplacementPolicy::BEST_REPLACES_WORST;
};

// Double-buffered migration packet container for thread-safe exchange
struct IslandMigrationBuffer {
    int num_islands;
    int migration_size;
    std::vector<std::vector<Chromosome>> outbound_buffers;

    IslandMigrationBuffer(int islands = 4, int size = 2) 
        : num_islands(islands), migration_size(size), outbound_buffers(islands) 
    {
        for (int i = 0; i < islands; ++i) {
            outbound_buffers[i].reserve(size);
        }
    }

    void prepareSend(int island_id, const std::vector<Chromosome>& population, int count) {
        outbound_buffers[island_id].clear();
        int to_copy = std::min(count, static_cast<int>(population.size()));
        for (int i = 0; i < to_copy; ++i) {
            outbound_buffers[island_id].push_back(population[i]); // Top individuals
        }
    }

    const std::vector<Chromosome>& receiveFromNeighbor(int island_id, MigrationTopology topology) const {
        if (topology == MigrationTopology::RING) {
            // Read from predecessor: (island_id - 1 + num_islands) % num_islands
            int source_island = (island_id - 1 + num_islands) % num_islands;
            return outbound_buffers[source_island];
        }
        // Default to ring
        int source_island = (island_id - 1 + num_islands) % num_islands;
        return outbound_buffers[source_island];
    }
};

} // namespace meal_planner

#endif // MIGRATION_BUFFER_HPP
