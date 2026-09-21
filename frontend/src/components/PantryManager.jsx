import React, { useState } from 'react';
import { Refrigerator, Plus, Trash2, AlertCircle, Sparkles, RefreshCw, Check, LayoutGrid, List, Flame, Zap, ShieldAlert, IndianRupee } from 'lucide-react';

export default function PantryManager({ pantryItems, onAddItem, onDeleteItem, onUpdateItem, onSimulateChange, isLoading }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [newItem, setNewItem] = useState({
    ingredient_name: '',
    quantity: 250,
    unit: 'g',
    days_to_expiry: 4,
    estimated_unit_cost: 0.20,
    category: 'Produce',
    perishability_hazard: 3.5
  });

  const categories = ['All', 'Produce', 'Protein', 'Dairy', 'Grains', 'Pantry'];

  const filteredItems = selectedCategory === 'All'
    ? pantryItems
    : pantryItems.filter(item => item.category?.toLowerCase() === selectedCategory.toLowerCase());

  const totalEstimatedValue = pantryItems.reduce((acc, it) => acc + (it.quantity * (it.estimated_unit_cost || 0)), 0);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.ingredient_name.trim()) return;
    onAddItem(newItem);
    setNewItem({
      ingredient_name: '',
      quantity: 250,
      unit: 'g',
      days_to_expiry: 4,
      estimated_unit_cost: 0.20,
      category: 'Produce',
      perishability_hazard: 3.5
    });
    setShowAddModal(false);
  };

  const getExpiryStatus = (days) => {
    if (days <= 2) {
      return {
        label: days === 0 ? 'Expires Today' : `${days}d (Urgent)`,
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        barColor: 'bg-red-500',
        percentage: 15
      };
    } else if (days <= 5) {
      return {
        label: `${days} days left`,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        barColor: 'bg-amber-500',
        percentage: 45
      };
    }
    return {
      label: `${days} days left`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      percentage: 85
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Simulation Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Refrigerator className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Pantry & Refrigerator Inventory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking {pantryItems.length} pantry items (Total Stock Value: <strong className="text-slate-800 font-mono">₹{totalEstimatedValue.toFixed(0)}</strong>). Adding or consuming ingredients automatically re-optimizes recipes.
          </p>
        </div>

        {/* Action Controls & Simulation Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSimulateChange('spoil_warning', 'Spinach')}
            className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition cursor-pointer flex items-center gap-1"
            title="Simulate Spinach nearing expiration"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>⚡ Spoil Alert (Spinach)</span>
          </button>
          <button
            onClick={() => onSimulateChange('consume', 'Chicken Breast')}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition cursor-pointer flex items-center gap-1"
            title="Simulate cooking with Chicken Breast"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ Consume Chicken</span>
          </button>
          <button
            onClick={() => onSimulateChange('reset')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1"
            title="Reset to default 30 inventory items"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>🔄 Reset Stock</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Filter Category Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1 self-end sm:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View: High-Res Real-Life Ingredient Cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const status = getExpiryStatus(item.days_to_expiry);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=80'}
                      alt={item.ingredient_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-3.5 space-y-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 truncate" title={item.ingredient_name}>
                        {item.ingredient_name}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">{item.category}</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Freshness Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${status.barColor}`}
                        style={{ width: `${status.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-slate-600">
                    ₹{item.estimated_unit_cost >= 1 ? item.estimated_unit_cost.toFixed(0) : item.estimated_unit_cost.toFixed(2)}/{item.unit}
                  </span>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Remove from pantry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Freshness</th>
                  <th className="py-3 px-4">Unit Cost (INR)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const status = getExpiryStatus(item.days_to_expiry);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=80'}
                          alt={item.ingredient_name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                        />
                        <span>{item.ingredient_name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        ₹{item.estimated_unit_cost >= 1 ? item.estimated_unit_cost.toFixed(0) : item.estimated_unit_cost.toFixed(2)} / {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Add Pantry Ingredient</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greek Yogurt, Tomatoes, Pasta"
                  value={newItem.ingredient_name}
                  onChange={(e) => setNewItem({ ...newItem, ingredient_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="g">grams (g)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="count">count (pcs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Protein">Protein</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Grains">Grains</option>
                    <option value="Pantry">Pantry</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Days Until Expiry</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newItem.days_to_expiry}
                    onChange={(e) => setNewItem({ ...newItem, days_to_expiry: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Unit Cost (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={newItem.estimated_unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, estimated_unit_cost: parseFloat(e.target.value) || 0.1 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
