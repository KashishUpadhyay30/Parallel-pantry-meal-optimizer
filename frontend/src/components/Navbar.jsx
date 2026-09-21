import React from 'react';
import { UtensilsCrossed, Refrigerator, BarChart2, SlidersHorizontal, Sparkles, Zap, Leaf } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onQuickOptimize, isOptimizing, pantryCount = 30 }) {
  const navItems = [
    { id: 'meals', label: 'Daily Meal Plan', icon: UtensilsCrossed },
    { id: 'pantry', label: 'Pantry Inventory', icon: Refrigerator, count: pantryCount },
    { id: 'hpc', label: 'HPC Performance', icon: BarChart2 },
    { id: 'nutrition', label: 'Nutrition & Diets', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('meals')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">Pantry<span className="text-emerald-600">Wise</span></span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  OpenMP Island GA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Zero-Waste AI Meal Optimization</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onQuickOptimize}
              disabled={isOptimizing}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Optimizing...' : 'Generate Plan'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

