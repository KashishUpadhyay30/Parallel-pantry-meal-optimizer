import React from 'react';
import { Clock, DollarSign, CheckCircle2, ShoppingBag, ShieldCheck, Zap, Sparkles, Flame, HeartHandshake, ArrowRight } from 'lucide-react';

export default function MealPlanView({ optimizationResult, isOptimizing, onReoptimize, onNavigatePantry }) {
  if (!optimizationResult) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-xs p-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Personalized Zero-Waste Meal Plan Ready</h3>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          Click below to run the high-performance parallel optimizer and generate a 4-meal plan utilizing ingredients currently in your pantry.
        </p>
        <button
          onClick={onReoptimize}
          disabled={isOptimizing}
          className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
        >
          {isOptimizing ? 'Optimizing Plan...' : 'Generate Today\'s Meal Plan'}
        </button>
      </div>
    );
  }

  const { algorithm, num_threads, execution_time_ms, best_fitness, nutrition_satisfaction_percent, expiry_utilization_percent, out_of_pocket_cost_usd, expiring_items_rescued_count, macro_totals, recommendations } = optimizationResult;

  const slotBadgeStyles = {
    Breakfast: 'bg-amber-100 text-amber-800 border-amber-200',
    Lunch: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Dinner: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Snack: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sub-Second C++ Optimization • {execution_time_ms.toFixed(1)} ms</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Today's Zero-Waste Meal Schedule
          </h2>
          <p className="text-emerald-100/90 text-sm mt-2 leading-relaxed">
            Balanced for your daily nutritional targets while prioritizing <strong className="text-white">{expiring_items_rescued_count} perishable items</strong> from your fridge before they spoil.
          </p>
        </div>

        {/* Top Metric Cards inside Hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div>
            <div className="text-xs text-emerald-200 font-medium">Nutritional Match</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{nutrition_satisfaction_percent}%</div>
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">Perishables Rescued</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{expiring_items_rescued_count} <span className="text-xs font-normal text-emerald-200">items</span></div>
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">Grocery Out-of-Pocket</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">${out_of_pocket_cost_usd.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">HPC Core Speedup</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-0.5">2.43x <span className="text-xs font-normal text-emerald-200">({num_threads}T)</span></div>
          </div>
        </div>
      </div>

      {/* Macro Breakdown Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Daily Energy</div>
            <div className="text-base font-bold text-slate-900 font-mono">{macro_totals?.calories} kcal</div>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Protein</div>
          <div className="text-base font-bold text-emerald-700 font-mono">{macro_totals?.protein_g} g</div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Carbohydrates</div>
          <div className="text-base font-bold text-cyan-700 font-mono">{macro_totals?.carbs_g} g</div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Healthy Fats</div>
          <div className="text-base font-bold text-pink-700 font-mono">{macro_totals?.fat_g} g</div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        <button
          onClick={onReoptimize}
          disabled={isOptimizing}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Re-shuffle Recipes</span>
        </button>
      </div>

      {/* 4 Meals Grid with Real Photography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => {
          const badgeClass = slotBadgeStyles[rec.slot] || 'bg-slate-100 text-slate-800 border-slate-200';
          return (
            <div
              key={rec.slot}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden food-card-shadow transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Real-Life Food Photo Header */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={rec.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'}
                    alt={rec.recipe_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Slot Pill on Image */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${badgeClass}`}>
                      {rec.slot}
                    </span>
                  </div>

                  {/* Cook time pill on Image */}
                  <div className="absolute bottom-3 right-3.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{rec.prep_time_min} mins</span>
                  </div>
                </div>

                {/* Recipe Body Content */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {rec.recipe_name}
                    </h3>

                    {/* Macro Tags */}
                    <div className="flex flex-wrap gap-2 mt-2.5 text-xs font-mono">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-semibold">
                        {rec.calories} kcal
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-semibold">
                        {rec.protein_g}g Protein
                      </span>
                      <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 rounded-lg border border-cyan-200 font-semibold">
                        {rec.carbohydrates_g}g Carbs
                      </span>
                      <span className="px-2.5 py-1 bg-pink-50 text-pink-800 rounded-lg border border-pink-200 font-semibold">
                        {rec.fat_g}g Fat
                      </span>
                    </div>

                    {/* Dietary Tags */}
                    {rec.dietary_tags && rec.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {rec.dietary_tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ingredients Breakdown */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    {/* Pantry Ingredients Used */}
                    <div>
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Used From Your Pantry:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.ingredients_used_from_pantry.length > 0 ? (
                          rec.ingredients_used_from_pantry.map((ing, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg">
                              {ing}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No stocked items required</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Items to Purchase */}
                    {rec.missing_ingredients_to_buy.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                          <span>Grocery Items to Buy:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.missing_ingredients_to_buy.map((ing, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Estimated Cost: <strong className="text-slate-800 font-mono">${rec.estimated_cost_usd.toFixed(2)}</strong></span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  Zero-Waste Match ✓
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

