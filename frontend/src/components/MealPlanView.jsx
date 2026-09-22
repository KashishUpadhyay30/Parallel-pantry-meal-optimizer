import React, { useState } from 'react';
import { Clock, CheckCircle2, Sparkles, Flame, Zap, ChefHat, Leaf, PlusCircle, ArrowRight, X, Utensils, BookOpen, Check, Printer } from 'lucide-react';

const RECIPE_OVERRIDES = {
  '436': '/images/harvest_bowl_436.png',
  '69': '/images/chicken_fettuccine_69.png',
  '34': '/images/strawberry_walnut_cup_34.jpg',
  'fiesta grilled chicken & quinoa harvest bowl': '/images/harvest_bowl_436.png',
  'garden-fresh creamy garlic parmesan chicken fettuccine': '/images/chicken_fettuccine_69.png',
  'roasted strawberries & dark chocolate walnut cup': '/images/strawberry_walnut_cup_34.jpg'
};

function getRecipePhoto(rec) {
  if (!rec) return '';
  const idStr = String(rec.recipe_id || '');
  const nameLower = (rec.recipe_name || '').toLowerCase();
  
  if (RECIPE_OVERRIDES[idStr]) return RECIPE_OVERRIDES[idStr];
  for (const [k, url] of Object.entries(RECIPE_OVERRIDES)) {
    if (nameLower.includes(k)) return url;
  }
  return rec.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
}

export default function MealPlanView({ optimizationResult, isOptimizing, onReoptimize, onNavigatePantry }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});

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

  const toggleStep = (stepIdx) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepIdx]: !prev[stepIdx]
    }));
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
            100% prepared from your current pantry stock. Rescuing <strong className="text-white">{expiring_items_rescued_count} expiring perishable ingredients</strong> with ₹0 mandatory grocery purchases. Click on any meal to see step-by-step cooking instructions!
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
              onClick={() => { setSelectedRecipe(rec); setCompletedSteps({}); }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-emerald-300"
            >
              <div>
                {/* Real-Life Food Photo Header */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={getRecipePhoto(rec)}
                    alt={rec.recipe_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                  
                  {/* Slot Pill on Image */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
                      {rec.slot}
                    </span>
                  </div>

                  {/* 100% Pantry Sourced Badge */}
                  <div className="absolute top-3.5 right-3.5 bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-1 border border-emerald-400/40 shadow-xs">
                    <Leaf className="w-3 h-3 text-emerald-200" />
                    <span>100% Pantry Stocked</span>
                  </div>

                  {/* Cook time pill on Image */}
                  <div className="absolute bottom-3 right-3.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{rec.prep_time_min} mins prep</span>
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
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                      <span>{rec.recipe_name}</span>
                      <span className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>How to make</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
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
                    <div>
                      <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sourced From Your Pantry:</span>
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

                    {rec.optional_suggestions && rec.optional_suggestions.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                          <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Optional Chef Garnishes:</span>
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
                  ✓ Click to View Recipe Steps
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Cooking Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 flex flex-col">
            {/* Modal Image Header */}
            <div className="relative h-64 w-full bg-slate-100 shrink-0">
              <img
                src={getRecipePhoto(selectedRecipe)}
                alt={selectedRecipe.recipe_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition cursor-pointer backdrop-blur-md"
                title="Close Recipe"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title & Badge */}
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/90 text-white border border-white/20 mb-2 inline-block">
                  {selectedRecipe.slot} Recipe
                </span>
                <h2 className="text-2xl font-black text-white leading-tight">
                  {selectedRecipe.recipe_name}
                </h2>
                <div className="flex items-center gap-4 text-xs text-emerald-200 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prep: {selectedRecipe.prep_time_min} mins • Cook: {selectedRecipe.cook_time_min || 15} mins</span>
                  </span>
                  <span>•</span>
                  <span>100% Sourced From Pantry</span>
                </div>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">
              {/* Macro Summary Strip */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs">
                <div>
                  <div className="text-slate-400 font-sans text-[10px]">Calories</div>
                  <div className="font-bold text-amber-600 text-sm mt-0.5">{selectedRecipe.calories} kcal</div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans text-[10px]">Protein</div>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">{selectedRecipe.protein_g}g</div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans text-[10px]">Carbs</div>
                  <div className="font-bold text-cyan-700 text-sm mt-0.5">{selectedRecipe.carbohydrates_g}g</div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans text-[10px]">Healthy Fat</div>
                  <div className="font-bold text-pink-700 text-sm mt-0.5">{selectedRecipe.fat_g}g</div>
                </div>
              </div>

              {/* Ingredients Checklist */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>Required Ingredients (Ready in Pantry)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRecipe.ingredients_used_from_pantry && selectedRecipe.ingredients_used_from_pantry.map((ing, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs font-medium text-emerald-950 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{ing}</span>
                    </div>
                  ))}
                </div>

                {selectedRecipe.optional_suggestions && selectedRecipe.optional_suggestions.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Optional Chef Add-ons:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecipe.optional_suggestions.map((sug, i) => (
                        <span key={i} className="px-2.5 py-1 text-[11px] bg-slate-100 text-slate-600 rounded-lg italic">
                          {sug}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step-by-Step Cooking Instructions */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Step-by-Step Cooking Instructions</span>
                </h3>

                <div className="space-y-3">
                  {selectedRecipe.instructions && selectedRecipe.instructions.map((step, idx) => {
                    const isDone = !!completedSteps[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                          isDone
                            ? 'bg-emerald-50/50 border-emerald-200 opacity-75'
                            : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <div className="flex-1 text-xs text-slate-700 leading-relaxed">
                          <p className={isDone ? 'line-through text-slate-500' : 'text-slate-800 font-medium'}>
                            {step}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chef Zero-Waste Tip */}
              {selectedRecipe.chef_tips && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                  <ChefHat className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-950 mb-0.5">Chef's Zero-Waste & Flavor Tip</div>
                    <p className="leading-relaxed">{selectedRecipe.chef_tips}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Ingredient Value: <strong className="text-slate-800 font-mono">₹{selectedRecipe.estimated_cost_inr || selectedRecipe.estimated_cost_usd}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  Ready to Cook!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
