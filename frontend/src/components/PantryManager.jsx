import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit3, AlertCircle, Sparkles, RefreshCw, Check } from 'lucide-react';

export default function PantryManager({ pantryItems, onAddItem, onDeleteItem, onUpdateItem, onSimulateChange, isLoading }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    ingredient_name: '',
    quantity: 200,
    unit: 'g',
    days_to_expiry: 3,
    estimated_unit_cost: 0.01,
    category: 'Produce',
    perishability_hazard: 4.0
  });

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

  const getExpiryBadge = (days) => {
    if (days <= 2) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    } else if (days <= 5) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 backdrop-blur border border-slate-700/80 p-5 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Pantry Inventory Management</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracked ingredients with expiration timelines and perishability weights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSimulateChange('spoil_warning', 'Spinach')}
            className="px-3 py-1.5 text-xs font-medium bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 rounded-lg transition-all"
          >
            ⚡ Spoil Alert (Spinach)
          </button>
          <button
            onClick={() => onSimulateChange('consume', 'Chicken Breast')}
            className="px-3 py-1.5 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition-all"
          >
            ⚡ Consume Chicken
          </button>
          <button
            onClick={() => onSimulateChange('reset')}
            className="px-3 py-1.5 text-xs font-medium bg-slate-700/60 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg transition-all"
          >
            🔄 Reset Pantry
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Pantry Items Table */}
      <div className="bg-slate-800/40 backdrop-blur border border-slate-700/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Ingredient</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Stock Quantity</th>
                <th className="py-3.5 px-4">Expiry Timeline</th>
                <th className="py-3.5 px-4">Unit Cost</th>
                <th className="py-3.5 px-4">Hazard Score</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {pantryItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-100">{item.ingredient_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-xs rounded bg-slate-700/50 text-slate-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getExpiryBadge(item.days_to_expiry)}`}>
                      {item.days_to_expiry === 0 ? 'Expires Today' : `${item.days_to_expiry} days left`}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    ${item.estimated_unit_cost.toFixed(3)}/{item.unit}
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-400">
                    {item.perishability_hazard.toFixed(1)} / 5.0
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete ingredient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100">Add Pantry Ingredient</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baby Spinach"
                  value={newItem.ingredient_name}
                  onChange={(e) => setNewItem({ ...newItem, ingredient_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="count">Count (units)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Days to Expiry</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItem.days_to_expiry}
                    onChange={(e) => setNewItem({ ...newItem, days_to_expiry: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Protein">Protein</option>
                    <option value="Grains">Grains</option>
                    <option value="Pantry">Pantry / Spice</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
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
