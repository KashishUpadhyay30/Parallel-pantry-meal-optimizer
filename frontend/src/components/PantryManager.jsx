import React, { useState } from 'react';
import { Refrigerator, Plus, Trash2, AlertCircle, Sparkles, RefreshCw, Check, LayoutGrid, List, Flame, Zap, ShieldAlert } from 'lucide-react';

export default function PantryManager({ pantryItems, onAddItem, onDeleteItem, onUpdateItem, onSimulateChange, isLoading }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [newItem, setNewItem] = useState({
    ingredient_name: '',
    quantity: 200,
    unit: 'g',
    days_to_expiry: 3,
    estimated_unit_cost: 0.01,
    category: 'Produce',
    perishability_hazard: 4.0
  });

  const categories = ['All', 'Produce', 'Protein', 'Dairy', 'Grains', 'Pantry'];

  const filteredItems = selectedCategory === 'All'
    ? pantryItems
    : pantryItems.filter(item => item.category?.toLowerCase() === selectedCategory.toLowerCase());

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.ingredient_name.trim()) return;
    onAddItem(newItem);
    setNewItem({
      ingredient_name: '',
      quantity: 200,
      unit: 'g',
      days_to_expiry: 3,
      estimated_unit_cost: 0.01,
      category: 'Produce',
      perishability_hazard: 4.0
    });
    setShowAddModal(false);
  };

  const getExpiryStatus = (days) => {
    if (days <= 2) {
      return {
        label: days === 0 ? 'Expires Today' : `${days}d (Critical)`,
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Refrigerator className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Pantry & Refrigerator Inventory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracked perishable ingredients. Changes automatically trigger sub-second parallel re-optimization.
          </p>
        </div>

        {/* Action Controls & Simulation Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSimulateChange('spoil_warning', 'Spinach')}
            className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>⚡ Spoil Alert (Spinach)</span>
          </button>
          <button
            onClick={() => onSimulateChange('consume', 'Chicken Breast')}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ Consume Chicken</span>
          </button>
          <button
            onClick={() => onSimulateChange('reset')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
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
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden food-card-shadow transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
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
                        <span className="font-mono font-semibold text-slate-800">
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
                  <span className="text-[11px] font-mono text-slate-500">
                    ${item.estimated_unit_cost.toFixed(2)}/{item.unit}
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Shelf-Life</th>
                  <th className="py-3 px-4">Unit Cost</th>
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
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
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
                      <td className="py-3 px-4 font-mono text-slate-600">${item.estimated_unit_cost.toFixed(3)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add Pantry Ingredient</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baby Spinach"
                  value={newItem.ingredient_name}
                  onChange={(e) => setNewItem({ ...newItem, ingredient_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="count">Count (units)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Days to Expiry</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItem.days_to_expiry}
                    onChange={(e) => setNewItem({ ...newItem, days_to_expiry: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Protein">Protein</option>
                    <option value="Grains">Grains</option>
                    <option value="Pantry">Pantry / Spice</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

