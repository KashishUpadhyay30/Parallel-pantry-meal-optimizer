import React from 'react';
import { Sliders, Flame, Shield, Award, Cpu, Sparkles } from 'lucide-react';

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
      <div className="bg-slate-800/40 backdrop-blur border border-slate-700/80 p-5 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <span>Nutritional Macro Targets & Dietary Preferences</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure daily caloric and macro-nutrient constraints for the multi-objective optimization engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Macro Sliders */}
        <div className="bg-slate-800/40 backdrop-blur border border-slate-700/80 p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Daily Macro-Nutrient Goals</span>
          </h4>

          {/* Calories */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Daily Energy Target</span>
              <span className="font-mono text-amber-400 font-bold">{config.target_calories} kcal</span>
            </div>
            <input
              type="range"
              min="1200"
              max="3500"
              step="50"
              value={config.target_calories}
              onChange={(e) => setConfig({ ...config, target_calories: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Protein */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Protein Target</span>
              <span className="font-mono text-emerald-400 font-bold">{config.target_protein} g</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="5"
              value={config.target_protein}
              onChange={(e) => setConfig({ ...config, target_protein: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Carbs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Carbohydrates Target</span>
              <span className="font-mono text-cyan-400 font-bold">{config.target_carbs} g</span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={config.target_carbs}
              onChange={(e) => setConfig({ ...config, target_carbs: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Fat */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Fats Target</span>
              <span className="font-mono text-pink-400 font-bold">{config.target_fat} g</span>
            </div>
            <input
              type="range"
              min="20"
              max="130"
              step="5"
              value={config.target_fat}
              onChange={(e) => setConfig({ ...config, target_fat: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Dietary Restrictions & HPC Solver Parameters */}
        <div className="bg-slate-800/40 backdrop-blur border border-slate-700/80 p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Dietary Restrictions & Filter Tags</span>
          </h4>

          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((tag) => {
              const active = config.required_dietary_tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {tag} {active ? '✓' : ''}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-700/70 space-y-3">
            <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>HPC Algorithm Hyperparameters</span>
            </h5>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Architecture</label>
                <select
                  value={config.algorithm}
                  onChange={(e) => setConfig({ ...config, algorithm: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="parallel">OpenMP Parallel Island GA</option>
                  <option value="sequential">Sequential GA</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">OpenMP Worker Threads</label>
                <select
                  value={config.num_threads}
                  onChange={(e) => setConfig({ ...config, num_threads: parseInt(e.target.value) })}
                  disabled={config.algorithm === 'sequential'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium disabled:opacity-50"
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
                <label className="block text-[11px] text-slate-400 mb-1">Dataset Tier</label>
                <select
                  value={config.dataset_tier}
                  onChange={(e) => setConfig({ ...config, dataset_tier: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="small">Small (60 Recipes)</option>
                  <option value="medium">Medium (500 Recipes)</option>
                  <option value="large">Large (2500 Recipes)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Generations</label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={config.generations}
                  onChange={(e) => setConfig({ ...config, generations: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
          </div>

          <button
            onClick={onRunOptimizer}
            disabled={isOptimizing}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Executing C++ Optimization...' : 'Apply & Recompute Meal Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
