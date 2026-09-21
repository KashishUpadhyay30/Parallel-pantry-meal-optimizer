import React from 'react';
import { Cpu, Utensils, Database, BarChart3, Sliders, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onQuickOptimize, isOptimizing }) {
  const navItems = [
    { id: 'meals', label: 'Meal Plan', icon: Utensils },
    { id: 'pantry', label: 'Pantry Inventory', icon: Database },
    { id: 'hpc', label: 'HPC Performance', icon: BarChart3 },
    { id: 'nutrition', label: 'Nutrition Goals', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100">Zero-Waste AI</span>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  OpenMP Island GA
                </span>
              </div>
              <p className="text-xs text-slate-400">High-Performance Multi-Objective Meal Optimizer</p>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={onQuickOptimize}
              disabled={isOptimizing}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Optimizing...' : 'Run C++ GA'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
