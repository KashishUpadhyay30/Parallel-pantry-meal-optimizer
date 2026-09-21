import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MealPlanView from './components/MealPlanView';
import PantryManager from './components/PantryManager';
import HPCMetricsDashboard from './components/HPCMetricsDashboard';
import NutritionalTargets from './components/NutritionalTargets';

export default function App() {
  const [activeTab, setActiveTab] = useState('meals');
  const [pantryItems, setPantryItems] = useState([]);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [notification, setNotification] = useState(null);

  const [optConfig, setOptConfig] = useState({
    algorithm: 'parallel',
    num_threads: 4,
    dataset_tier: 'medium',
    population_size: 100,
    generations: 100,
    random_seed: 42,
    target_calories: 2000.0,
    target_protein: 130.0,
    target_carbs: 220.0,
    target_fat: 65.0,
    required_dietary_tags: []
  });

  const API_BASE = 'http://127.0.0.1:8000';

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial pantry and performance data
  const fetchPantry = async () => {
    try {
      const res = await fetch(`${API_BASE}/pantry`);
      if (res.ok) {
        const data = await res.json();
        setPantryItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch pantry:', err);
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetch(`${API_BASE}/performance`);
      if (res.ok) {
        const data = await res.json();
        setPerformanceData(data);
      }
    } catch (err) {
      console.error('Failed to fetch performance:', err);
    }
  };

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch(`${API_BASE}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setOptimizationResult(data);
        showToast(`Optimization complete in ${data.execution_time_ms.toFixed(1)} ms (${data.algorithm}, ${data.num_threads}T)`);
        setActiveTab('meals');
      } else {
        showToast('Optimization failed. Check server logs.', 'error');
      }
    } catch (err) {
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddPantryItem = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/pantry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        fetchPantry();
        showToast(`Added ${item.ingredient_name} to pantry`);
        // Trigger background dynamic re-optimization
        handleRunOptimizer();
      }
    } catch (err) {
      showToast('Failed to add ingredient', 'error');
    }
  };

  const handleDeletePantryItem = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/pantry/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPantry();
        showToast('Removed item from pantry');
        handleRunOptimizer();
      }
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  const handleSimulateChange = async (action, ingredient_name) => {
    try {
      const res = await fetch(`${API_BASE}/simulate-pantry-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ingredient_name })
      });
      if (res.ok) {
        const data = await res.json();
        fetchPantry();
        if (data.dynamic_reoptimization) {
          setOptimizationResult(data.dynamic_reoptimization);
        } else if (data.optimization_result) {
          setOptimizationResult(data.optimization_result);
        }
        showToast(`⚡ Real-Time Event: ${data.action}`);
        setActiveTab('meals');
      }
    } catch (err) {
      showToast('Simulation failed', 'error');
    }
  };

  useEffect(() => {
    fetchPantry();
    fetchPerformance();
    handleRunOptimizer();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-red-950 border-red-500/50 text-red-200'
              : 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
          }`}>
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickOptimize={handleRunOptimizer}
        isOptimizing={isOptimizing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'meals' && (
          <MealPlanView
            optimizationResult={optimizationResult}
            isOptimizing={isOptimizing}
            onReoptimize={handleRunOptimizer}
          />
        )}

        {activeTab === 'pantry' && (
          <PantryManager
            pantryItems={pantryItems}
            onAddItem={handleAddPantryItem}
            onDeleteItem={handleDeletePantryItem}
            onSimulateChange={handleSimulateChange}
            isLoading={isOptimizing}
          />
        )}

        {activeTab === 'hpc' && (
          <HPCMetricsDashboard
            performanceData={performanceData}
            onRefresh={fetchPerformance}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionalTargets
            config={optConfig}
            setConfig={setOptConfig}
            onRunOptimizer={handleRunOptimizer}
            isOptimizing={isOptimizing}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
        <p>
          High-Performance Parallel Multi-Objective Optimization for Real-Time Pantry-Aware Meal Planning • OpenMP & Genetic Algorithms
        </p>
        <p className="mt-1">
          Authors: Kashish Upadhyay & Animesh Labh • Academic Research Project
        </p>
      </footer>
    </div>
  );
}
