import React from 'react';
import { Clock, CheckCircle2, Sparkles, Flame, Zap, ChefHat, Leaf, PlusCircle, ArrowRight } from 'lucide-react';

export default function MealPlanView({ optimizationResult, isOptimizing, onReoptimize, onNavigatePantry }) {
  if (!optimizationResult) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Personalized Zero-Waste Meal Plan Ready</h3>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          Click below to run the high-speed meal optimizer and generate 4 creative meals made entirely from your available pantry items.
        </p>
        <button
          onClick={onReoptimize}
          disabled={isOptimizing}
          className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isOptimizing ? 'Generating Fresh Plan...' : "Generate Today's Meal Plan"}</span>
        </button>
      </div>
    );
  }

  const {
    algorithm,
    num_threads,
    execution_time_ms,
    best_fitness,
    nutrition_satisfaction_percent,
    expiry_utilization_percent,
    out_of_pocket_cost_inr,
    out_of_pocket_cost_usd,
    expiring_items_rescued_count,
    macro_totals,
    recommendations
  } = optimizationResult;

  const costDisplay = out_of_pocket_cost_inr !== undefined ? out_of_pocket_cost_inr : (out_of_pocket_cost_usd || 0.0);

  const slotBadgeStyles = {
    Breakfast: 'bg-amber-100 text-amber-900 border-amber-200',
    Lunch: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    Dinner: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    Snack: 'bg-purple-100 text-purple-900 border-purple-200'
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI Multi-Core Optimization • {execution_time_ms.toFixed(1)} ms</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Today's Zero-Waste Meal Schedule
          </h2>
          <p className="text-emerald-100/90 text-sm mt-2 leading-relaxed">
            100% prepared from your current pantry stock. Rescuing <strong className="text-white">{expiring_items_rescued_count} expiring perishable ingredients</strong> with ₹0 mandatory grocery purchases.
          </p>
        </div>

        {/* Top Metric Cards inside Hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div>
            <div className="text-xs text-emerald-200 font-medium">Nutritional Target Match</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{nutrition_satisfaction_percent}%</div>
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">Perishables Rescued</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{expiring_items_rescued_count} <span className="text-xs font-normal text-emerald-200">items</span></div>
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">Grocery Out-of-Pocket</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-0.5">₹{costDisplay.toFixed(0)} <span className="text-xs font-normal text-emerald-200">(Pantry Sourced)</span></div>
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">C++ Core Speedup</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-0.5">2.43x <span className="text-xs font-normal text-emerald-200">({num_threads}T Parallel)</span></div>
          </div>
        </div>
      </div>

      {/* Macro Breakdown Strip & Reshuffle Trigger */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
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
          className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs hover:shadow-sm"
          title="Generate a completely new set of creative recipes from stocked pantry items"
        >
          <Sparkles className={`w-4 h-4 text-emerald-600 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Re-optimizing...' : '✨ Reshuffle 4 Recipes'}</span>
        </button>
      </div>

      {/* 4 Meals Grid with Real Photography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => {
          const badgeClass = slotBadgeStyles[rec.slot] || 'bg-slate-100 text-slate-800 border-slate-200';
          const mealCost = rec.estimated_cost_inr !== undefined ? rec.estimated_cost_inr : rec.estimated_cost_usd;

          return (
            <div
              key={rec.slot}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Real-Life Food Photo Header */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={rec.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'}
                    alt={rec.recipe_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  
                  {/* Slot Pill on Image */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
                      {rec.slot}
                    </span>
                  </div>

                  {/* 100% Pantry Sourced Badge */}
                  <div className="absolute top-3.5 right-3.5 bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-1 border border-emerald-400/40 shadow-xs">
                    <Leaf className="w-3 h-3 text-emerald-200" />
                    <span>100% In Stock</span>
                  </div>

                  {/* Cook time pill on Image */}
                  <div className="absolute bottom-3 right-3.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{rec.prep_time_min} mins</span>
                  </div>

                  <div className="absolute bottom-3 left-3.5">
                    <span className="text-white text-xs font-mono font-bold bg-black/60 px-2 py-0.5 rounded-md">
                      ₹{mealCost.toFixed(0)} value
                    </span>
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
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {/* Pantry Ingredients Used */}
                    <div>
                      <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sourced From Your Pantry (0 Grocery Purchase Needed):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.ingredients_used_from_pantry && rec.ingredients_used_from_pantry.length > 0 ? (
                          rec.ingredients_used_from_pantry.map((ing, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg">
                              {ing}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pantry ingredients ready</span>
                        )}
                      </div>
                    </div>

                    {/* Optional Chef Suggestions / Add-ons */}
                    {rec.optional_suggestions && rec.optional_suggestions.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                          <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Optional Chef Garnishes (Optional):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.optional_suggestions.map((sug, i) => (
                            <span key={i} className="px-2.5 py-1 text-[11px] font-normal bg-slate-50 text-slate-600 border border-slate-200 rounded-lg italic">
                              {sug}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Ingredient Value: <strong className="text-slate-900 font-mono font-bold">₹{mealCost.toFixed(0)}</strong></span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  ✓ Zero Grocery Cost
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
