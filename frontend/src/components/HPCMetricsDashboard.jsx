import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, ShieldAlert, Award, Layers, RefreshCw } from 'lucide-react';

export default function HPCMetricsDashboard({ performanceData, onRefresh }) {
  const [selectedScenario, setSelectedScenario] = useState(3); // Default to Stress Load (Scenario 4)

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700">
        <Activity className="w-8 h-8 text-emerald-400 mx-auto animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading empirical benchmark metrics...</p>
      </div>
    );
  }

  const currentSc = performanceData[selectedScenario] || performanceData[0];
  const seqTime = currentSc.sequential.mean_time_ms;
  const bestParallel = currentSc.parallel_runs.reduce((prev, curr) => (curr.speedup > prev.speedup ? curr : prev), currentSc.parallel_runs[0]);

  return (
    <div className="space-y-6">
      {/* Header & Scenario Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 backdrop-blur border border-slate-700/80 p-5 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>HPC Performance & Scalability Dashboard</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical comparison: Single-Thread Sequential GA vs. OpenMP Multi-Threaded Island Model.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-medium">Scenario:</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {performanceData.map((sc, idx) => (
              <option key={idx} value={idx}>
                {sc.scenario} ({sc.dataset})
              </option>
            ))}
          </select>
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title="Refresh Benchmarks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">Sequential Baseline ($T_1$)</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{seqTime.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-xs text-slate-400 mt-1">Single-threaded execution</div>
        </div>

        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">Peak Parallel Speedup</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{bestParallel.speedup.toFixed(2)}x</div>
          <div className="text-xs text-emerald-300 mt-1">at {bestParallel.num_threads} OpenMP Threads</div>
        </div>

        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">Parallel Efficiency</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{bestParallel.efficiency_percent.toFixed(1)}%</div>
          <div className="text-xs text-cyan-300 mt-1">High CPU Core Utilization</div>
        </div>

        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">Karp-Flatt Serial Fraction ($e$)</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{bestParallel.karp_flatt_serial_fraction.toFixed(4)}</div>
          <div className="text-xs text-amber-300 mt-1">Minimal barrier overhead</div>
        </div>
      </div>

      {/* Speedup and Thread Scaling Visualizer */}
      <div className="bg-slate-800/40 backdrop-blur border border-slate-700/80 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Speedup & Execution Time vs. Thread Count ({currentSc.dataset})</span>
        </h4>

        <div className="space-y-3">
          {/* Sequential Baseline Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Sequential Baseline (1 Thread)</span>
              <span>{seqTime.toFixed(1)} ms (1.00x)</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
              <div className="bg-slate-500 h-full rounded-full w-full"></div>
            </div>
          </div>

          {/* Parallel Thread Bars */}
          {currentSc.parallel_runs.map((pr) => {
            const widthPct = Math.min(100, Math.max(10, (pr.mean_time_ms / seqTime) * 100));
            const barColors = {
              1: 'bg-blue-500',
              2: 'bg-teal-500',
              4: 'bg-emerald-500',
              8: 'bg-purple-500'
            };
            return (
              <div key={pr.num_threads}>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${barColors[pr.num_threads] || 'bg-emerald-400'}`}></span>
                    Island Model ({pr.num_threads} Threads / Islands)
                  </span>
                  <span>
                    <strong className="text-emerald-400">{pr.speedup.toFixed(2)}x Speedup</strong> • {pr.mean_time_ms.toFixed(1)} ms ({pr.efficiency_percent.toFixed(0)}% eff)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                  <div
                    className={`${barColors[pr.num_threads] || 'bg-emerald-500'} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ring Topology Island Architecture Diagram */}
      <div className="bg-slate-800/40 backdrop-blur border border-slate-700/80 p-5 rounded-2xl">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Coarse-Grained OpenMP Island Model Architecture</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((islandId) => (
            <div
              key={islandId}
              className="p-3.5 bg-slate-900/80 border border-emerald-500/30 rounded-xl flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono mb-2">
                T{islandId}
              </div>
              <div className="text-xs font-bold text-slate-200">Island {islandId}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Pop: {Math.round(currentSc.pop_size / 4)} Chromosomes</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1">Ring → Island {(islandId + 1) % 4}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-3">
          Periodic Ring Migration every 15 generations transfers top 2 elite chromosomes to neighboring islands, maintaining genetic diversity and preventing premature convergence.
        </p>
      </div>

      {/* Experimental Summary Table */}
      <div className="bg-slate-800/40 backdrop-blur border border-slate-700/80 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-sm font-bold text-slate-200">Publication Benchmark Data Table ({currentSc.scenario})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4">Configuration</th>
                <th className="py-2.5 px-4">Threads</th>
                <th className="py-2.5 px-4">Mean Time (ms)</th>
                <th className="py-2.5 px-4">Speedup</th>
                <th className="py-2.5 px-4">Efficiency</th>
                <th className="py-2.5 px-4">Karp-Flatt</th>
                <th className="py-2.5 px-4">Best Fitness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-100">Sequential GA</td>
                <td className="py-2 px-4">1</td>
                <td className="py-2 px-4">{currentSc.sequential.mean_time_ms.toFixed(2)} ± {currentSc.sequential.std_time_ms.toFixed(2)}</td>
                <td className="py-2 px-4">1.00x</td>
                <td className="py-2 px-4">100.0%</td>
                <td className="py-2 px-4">0.0000</td>
                <td className="py-2 px-4 text-emerald-400">{currentSc.sequential.mean_best_fitness.toFixed(4)}</td>
              </tr>
              {currentSc.parallel_runs.map((pr) => (
                <tr key={pr.num_threads} className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-semibold text-emerald-300">Island Model GA</td>
                  <td className="py-2 px-4">{pr.num_threads}</td>
                  <td className="py-2 px-4">{pr.mean_time_ms.toFixed(2)} ± {pr.std_time_ms.toFixed(2)}</td>
                  <td className="py-2 px-4 font-bold text-emerald-400">{pr.speedup.toFixed(2)}x</td>
                  <td className="py-2 px-4">{pr.efficiency_percent.toFixed(1)}%</td>
                  <td className="py-2 px-4">{pr.karp_flatt_serial_fraction.toFixed(4)}</td>
                  <td className="py-2 px-4 text-emerald-400">{pr.mean_best_fitness.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
