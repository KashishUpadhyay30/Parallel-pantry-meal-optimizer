import React from 'react';
import { SlidersHorizontal, Flame, Shield, Cpu, Sparkles, Target, Zap } from 'lucide-react';

export default function NutritionalTargets({ config, setConfig, onRunOptimizer, isOptimizing }) {
  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'High-Protein', 'Halal', 'Dairy-Free', 'Low-Carb'
  ];

  const handleTagToggle = (tag) => {
    const exists = config.required_dietary_tags.includes(tag);
    if (exists) {
      setConfig({
        ...config,
        required_dietary_tags: config.required_dietary_tags.filter((t) => t !== tag)
      });
    } else {
      setConfig({
        ...config,
        required_dietary_tags: [...config.required_dietary_tags, tag]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <SlidersHorizontal className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold text-slate-900">Nutrition Goals & Dietary Preferences</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Customize your daily macro constraints and evolutionary solver parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Macro Sliders Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>Daily Macro-Nutrient Targets</span>
          </h3>

          {/* Calories */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Total Energy Target</span>
              <span className="font-mono text-amber-600 font-bold">{config.target_calories} kcal</span>
            </div>
            <input
              type="range"
              min="1200"
              max="3500"
              step="50"
              value={config.target_calories}
              onChange={(e) => setConfig({ ...config, target_calories: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Protein */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Protein Target</span>
              <span className="font-mono text-emerald-700 font-bold">{config.target_protein} g</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="5"
              value={config.target_protein}
              onChange={(e) => setConfig({ ...config, target_protein: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Carbohydrates Target</span>
              <span className="font-mono text-cyan-700 font-bold">{config.target_carbs} g</span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={config.target_carbs}
              onChange={(e) => setConfig({ ...config, target_carbs: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Healthy Fats Target</span>
              <span className="font-mono text-pink-700 font-bold">{config.target_fat} g</span>
            </div>
            <input
              type="range"
              min="20"
              max="130"
              step="5"
              value={config.target_fat}
              onChange={(e) => setConfig({ ...config, target_fat: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Dietary Preferences & HPC Hyperparameters Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span>Dietary Restrictions & Filter Tags</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((tag) => {
              const active = config.required_dietary_tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {tag} {active ? '✓' : ''}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>HPC Algorithm Hyperparameters</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Solver Architecture</label>
                <select
                  value={config.algorithm}
                  onChange={(e) => setConfig({ ...config, algorithm: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="parallel">OpenMP Parallel Island GA</option>
                  <option value="sequential">Sequential GA</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Worker Threads ($p$)</label>
                <select
                  value={config.num_threads}
                  onChange={(e) => setConfig({ ...config, num_threads: parseInt(e.target.value) })}
                  disabled={config.algorithm === 'sequential'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-50"
                >
                  <option value={1}>1 Thread (Single Island)</option>
                  <option value={2}>2 Threads (2 Islands)</option>
                  <option value={4}>4 Threads (4 Islands)</option>
                  <option value={8}>8 Threads (8 Islands)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catalog Scale</label>
                <select
                  value={config.dataset_tier}
                  onChange={(e) => setConfig({ ...config, dataset_tier: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="small">Small (60 Recipes)</option>
                  <option value="medium">Medium (500 Recipes)</option>
                  <option value="large">Large (2500 Recipes)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Generations</label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={config.generations}
                  onChange={(e) => setConfig({ ...config, generations: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>
          </div>

          <button
            onClick={onRunOptimizer}
            disabled={isOptimizing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Executing C++ Optimization...' : 'Apply Goals & Recompute Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

