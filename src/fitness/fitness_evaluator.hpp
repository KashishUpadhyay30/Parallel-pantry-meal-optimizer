#ifndef FITNESS_EVALUATOR_HPP
#define FITNESS_EVALUATOR_HPP

#include "../models/types.hpp"
#include <vector>
#include <unordered_map>
#include <cmath>

namespace meal_planner {

class FitnessEvaluator {
public:
    FitnessEvaluator(
        const std::vector<Recipe>& recipes,
        const std::vector<PantryItem>& pantry,
        const std::unordered_map<int, PantryItem>& pantry_map,
        const TargetGoals& targets = TargetGoals(),
        const FitnessWeights& weights = FitnessWeights()
    );

    void evaluate(Chromosome& chromosome) const;

    const TargetGoals& getTargets() const { return m_targets; }
    const FitnessWeights& getWeights() const { return m_weights; }

    void setTargets(const TargetGoals& targets) { m_targets = targets; }
    void setWeights(const FitnessWeights& weights) { m_weights = weights; }

private:
    const std::vector<Recipe>& m_recipes;
    const std::vector<PantryItem>& m_pantry;
    const std::unordered_map<int, PantryItem>& m_pantry_map;
    TargetGoals m_targets;
    FitnessWeights m_weights;

    double m_total_pantry_urgency = 0.0;
    void precomputePantryUrgency();
};

} // namespace meal_planner

#endif // FITNESS_EVALUATOR_HPP
