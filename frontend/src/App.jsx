import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MealPlanView from './components/MealPlanView';
import PantryManager from './components/PantryManager';
import HPCMetricsDashboard from './components/HPCMetricsDashboard';
import NutritionalTargets from './components/NutritionalTargets';
import {
  getLocalPantry,
  saveLocalPantry,
  runClientOptimization,
  DEFAULT_PANTRY_ITEMS,
  getIngredientImageUrl
} from './services/clientOptimizer';

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

  const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000' : '');

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial pantry and performance data
  const fetchPantry = async () => {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/pantry`);
        if (res.ok) {
          const data = await res.json();
          setPantryItems(data);
          saveLocalPantry(data);
          return data;
        }
      } catch (err) {
        console.warn('Backend unavailable, using client-side pantry store:', err);
      }
    }
    const local = getLocalPantry();
    setPantryItems(local);
    return local;
  };

  const fetchPerformance = async () => {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/performance`);
        if (res.ok) {
          const data = await res.json();
          setPerformanceData(data);
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, fetching local benchmark dataset:', err);
      }
    }
    try {
      const res = await fetch('/data/benchmark_results_summary.json');
      if (res.ok) {
        const data = await res.json();
        setPerformanceData(data);
      }
    } catch (e) {
      console.warn('Could not load static benchmark data:', e);
    }
  };

  const handleRunOptimizer = async (customConfig = null, currentPantry = null) => {
    setIsOptimizing(true);
    const payload = customConfig || optConfig;
    const activePantry = currentPantry || (pantryItems.length > 0 ? pantryItems : getLocalPantry());

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          setOptimizationResult(data);
          showToast(`✨ Generated meal plan in ${data.execution_time_ms.toFixed(1)} ms (${data.algorithm}, ${data.num_threads}T)`);
          setIsOptimizing(false);
          return;
        }
      } catch (err) {
        console.warn('Live backend offline, running client-side GA optimizer:', err);
      }
    }

    // Client-side execution fallback
    try {
      const clientRes = await runClientOptimization(payload, activePantry);
      setOptimizationResult(clientRes);
      showToast(`✨ Generated meal plan in ${clientRes.execution_time_ms.toFixed(1)} ms (${clientRes.algorithm})`);
    } catch (e) {
      console.error('Client optimizer error:', e);
      showToast('Optimization failed. Please try again.', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Reshuffle generates brand new random seeds each time for high recipe diversity
  const handleReshuffle = async () => {
    const freshSeed = Math.floor(Math.random() * 1000000) + 1;
    const freshConfig = { ...optConfig, random_seed: freshSeed };
    setOptConfig(freshConfig);
    await handleRunOptimizer(freshConfig);
  };

  const handleAddPantryItem = async (item) => {
    const newItem = {
      ...item,
      id: Date.now(),
      image_url: getIngredientImageUrl(item.ingredient_name)
    };

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/pantry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) {
          await fetchPantry();
          showToast(`Added ${item.ingredient_name} to pantry`);
          handleReshuffle();
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, adding locally:', err);
      }
    }

    const updated = [newItem, ...pantryItems];
    setPantryItems(updated);
    saveLocalPantry(updated);
    showToast(`Added ${item.ingredient_name} to pantry`);
    handleRunOptimizer(null, updated);
  };

  const handleDeletePantryItem = async (id) => {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/pantry/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchPantry();
          showToast('Removed item from pantry');
          handleReshuffle();
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, deleting locally:', err);
      }
    }

    const updated = pantryItems.filter(p => p.id !== id);
    setPantryItems(updated);
    saveLocalPantry(updated);
    showToast('Removed item from pantry');
    handleRunOptimizer(null, updated);
  };

  const handleSimulateChange = async (action, ingredient_name) => {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/simulate-pantry-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ingredient_name })
        });
        if (res.ok) {
          const data = await res.json();
          await fetchPantry();
          if (data.dynamic_reoptimization) {
            setOptimizationResult(data.dynamic_reoptimization);
          } else if (data.optimization_result) {
            setOptimizationResult(data.optimization_result);
          }
          showToast(`⚡ Real-Time Event: ${data.action}`);
          setActiveTab('meals');
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, simulating locally:', err);
      }
    }

    // Client-side simulation
    let updated = [...pantryItems];
    let actionDesc = '';
    if (action === 'consume' && ingredient_name) {
      const idx = updated.findIndex(p => p.ingredient_name.toLowerCase() === ingredient_name.toLowerCase());
      if (idx !== -1) {
        const newQty = Math.max(0, updated[idx].quantity - 100);
        if (newQty === 0) {
          updated.splice(idx, 1);
          actionDesc = `Consumed all of ${ingredient_name}`;
        } else {
          updated[idx] = { ...updated[idx], quantity: newQty };
          actionDesc = `Consumed 100g of ${ingredient_name} (left: ${newQty}g)`;
        }
      }
    } else if (action === 'spoil_warning' && ingredient_name) {
      const idx = updated.findIndex(p => p.ingredient_name.toLowerCase() === ingredient_name.toLowerCase());
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], days_to_expiry: 1 };
        actionDesc = `Urgent 24h expiration warning for ${ingredient_name}`;
      }
    } else if (action === 'reset') {
      updated = DEFAULT_PANTRY_ITEMS.map(i => ({ ...i, image_url: getIngredientImageUrl(i.ingredient_name) }));
      actionDesc = 'Reset pantry to default perishable state';
    }

    setPantryItems(updated);
    saveLocalPantry(updated);
    showToast(`⚡ Real-Time Event: ${actionDesc}`);
    await handleRunOptimizer(null, updated);
    setActiveTab('meals');
  };

  useEffect(() => {
    async function init() {
      const pantry = await fetchPantry();
      await fetchPerformance();
      await handleRunOptimizer(null, pantry);
    }
    init();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2.5 ${
            notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-white border-emerald-200 text-emerald-800 shadow-emerald-500/10'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickOptimize={handleReshuffle}
        isOptimizing={isOptimizing}
        pantryCount={pantryItems.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'meals' && (
          <MealPlanView
            optimizationResult={optimizationResult}
            isOptimizing={isOptimizing}
            onReoptimize={handleReshuffle}
            onNavigatePantry={() => setActiveTab('pantry')}
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
            onRunOptimizer={() => handleRunOptimizer()}
            isOptimizing={isOptimizing}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">
          PantryWise • High-Performance Parallel Multi-Objective Optimization for Real-Time Meal Planning
        </p>
        <p>
          OpenMP Shared-Memory Coarse-Grained Island Model • Authors: Kashish Upadhyay & Animesh Labh
        </p>
      </footer>
    </div>
  );
}
