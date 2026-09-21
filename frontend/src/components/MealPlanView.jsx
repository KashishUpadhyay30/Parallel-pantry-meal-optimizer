import React from 'react';
import { Utensils, Clock, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, Flame, Zap } from 'lucide-react';

export default function MealPlanView({ optimizationResult, isOptimizing, onReoptimize }) {
  if (!optimizationResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-emerald-400 mb-4 animate-pulse">
          <Utensils className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">No Meal Plan Generated Yet</h3>
        <p className="text-sm text-slate-400 max-w-md mt-1">
          Click the "Run C++ GA" button to execute the High-Performance Multi-Objective evolutionary algorithm.
        </p>
        <button
          onClick={onReoptimize}
          disabled={isOptimizing}
          className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
        >
          Generate Optimal Meal Plan
        </button>
      </div>
    );
  }

  const { algorithm, num_threads, execution_time_ms, best_fitness, nutrition_satisfaction_percent, expiry_utilization_percent, out_of_pocket_cost_usd, expiring_items_rescued_count, macro_totals, recommendations } = optimizationResult;

  const slotColors = {
    Breakfast: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
    Lunch: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
    Dinner: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300',
    Snack: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: HPC Run Telemetry Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Optimization Speed</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{execution_time_ms.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>{algorithm}</span> • {num_threads}T
          </div>
        </div>

        <div className="p-4 bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Macro Satisfaction</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{nutrition_satisfaction_percent}%</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {macro_totals?.calories} kcal | {macro_totals?.protein_g}g P
          </div>
        </div>

        <div className="p-4 bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Perishables Rescued</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{expiring_items_rescued_count} <span className="text-xs text-slate-400 font-normal">items</span></div>
          <div className="text-xs text-teal-300 mt-1 font-mono">
            {expiry_utilization_percent}% urgency weight utilized
          </div>
        </div>

        <div className="p-4 bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Extra Grocery Cost</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">${out_of_pocket_cost_usd.toFixed(2)}</div>
          <div className="text-xs text-emerald-400 mt-1">
            Zero-Waste Optimized
          </div>
        </div>
      </div>

      {/* Recommended Meal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {recommendations.map((rec) => {
          const colorClass = slotColors[rec.slot] || 'from-slate-800 to-slate-900 border-slate-700 text-slate-300';
          return (
            <div
              key={rec.slot}
              className="bg-slate-800/40 backdrop-blur border border-slate-700/70 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${colorClass} border`}>
                    {rec.slot}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{rec.prep_time_min} mins</span>
                  </div>
                </div>

                <h4 className="text-base font-semibold text-slate-100 mt-1">{rec.recipe_name}</h4>

                {/* Macro Badges */}
                <div className="flex flex-wrap gap-2 mt-3 text-xs font-mono">
                  <span className="px-2 py-0.5 bg-slate-900/80 rounded border border-slate-700 text-amber-300">
                    {rec.calories} kcal
                  </span>
                  <span className="px-2 py-0.5 bg-slate-900/80 rounded border border-slate-700 text-emerald-300">
                    {rec.protein_g}g Prot
                  </span>
                  <span className="px-2 py-0.5 bg-slate-900/80 rounded border border-slate-700 text-cyan-300">
                    {rec.carbohydrates_g}g Carb
                  </span>
                  <span className="px-2 py-0.5 bg-slate-900/80 rounded border border-slate-700 text-pink-300">
                    {rec.fat_g}g Fat
                  </span>
                </div>

                {/* Dietary Tags */}
                {rec.dietary_tags && rec.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {rec.dietary_tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] font-medium bg-slate-700/50 text-slate-300 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingredients Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
                <div>
                  <div className="text-xs font-medium text-emerald-400 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pantry Ingredients Utilized:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.ingredients_used_from_pantry.length > 0 ? (
                      rec.ingredients_used_from_pantry.map((ing, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md">
                          {ing}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">None from current stock</span>
                    )}
                  </div>
                </div>

                {rec.missing_ingredients_to_buy.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-amber-400 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Items to Purchase:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.missing_ingredients_to_buy.map((ing, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
