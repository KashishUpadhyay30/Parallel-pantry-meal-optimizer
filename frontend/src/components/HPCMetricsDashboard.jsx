import React, { useState } from 'react';
import { Cpu, Zap, Activity, Award, Layers, RefreshCw, BarChart2, TrendingUp, Info } from 'lucide-react';

export default function HPCMetricsDashboard({ performanceData, onRefresh }) {
  const [selectedScenario, setSelectedScenario] = useState(3); // Default to Stress Load (Scenario 4)

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <Activity className="w-8 h-8 text-emerald-600 mx-auto animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading empirical HPC benchmark metrics...</p>
      </div>
    );
  }

  const currentSc = performanceData[selectedScenario] || performanceData[0];
  const seqTime = currentSc.sequential.mean_time_ms;
  const bestParallel = currentSc.parallel_runs.reduce((prev, curr) => (curr.speedup > prev.speedup ? curr : prev), currentSc.parallel_runs[0]);

  return (
    <div className="space-y-6">
      {/* Header & Scenario Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">HPC Scalability & Benchmark Telemetry</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical experimental evaluation: Sequential Genetic Algorithm vs. OpenMP Coarse-Grained Island Model.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-600 font-semibold">Scenario Scale:</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(parseInt(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            {performanceData.map((sc, idx) => (
              <option key={idx} value={idx}>
                {sc.scenario} ({sc.dataset})
              </option>
            ))}
          </select>
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="Refresh Benchmarks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Sequential Baseline ($T_1$)</div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">{seqTime.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-xs text-slate-500 mt-1">1 OpenMP Thread</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Peak Parallel Speedup ($S_p$)</div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1">{bestParallel.speedup.toFixed(2)}x</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">at {bestParallel.num_threads} OpenMP Threads</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">2-Thread Parallel Efficiency</div>
          <div className="text-2xl font-black font-mono text-indigo-600 mt-1">{currentSc.parallel_runs[1]?.efficiency_percent.toFixed(1)}%</div>
          <div className="text-xs text-indigo-700 font-medium mt-1">High CPU core scaling</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Karp-Flatt Serial Fraction ($e$)</div>
          <div className="text-2xl font-black font-mono text-amber-600 mt-1">{bestParallel.karp_flatt_serial_fraction.toFixed(4)}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">Minimal barrier overhead</div>
        </div>
      </div>

      {/* Speedup and Thread Scaling Visualizer */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Speedup & Execution Time vs. Thread Scaling ({currentSc.dataset})</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500 font-mono">5 Statistical Runs Averaged</span>
        </div>

        <div className="space-y-3.5 pt-2">
          {/* Sequential Baseline Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-700 mb-1 font-semibold">
              <span>Sequential Baseline (1 Thread)</span>
              <span>{seqTime.toFixed(1)} ms (1.00x)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
              <div className="bg-slate-400 h-full rounded-full w-full"></div>
            </div>
          </div>

          {/* Parallel Thread Bars */}
          {currentSc.parallel_runs.map((pr) => {
            const widthPct = Math.min(100, Math.max(10, (pr.mean_time_ms / seqTime) * 100));
            const barColors = {
              1: 'bg-blue-500',
              2: 'bg-teal-500',
              4: 'bg-emerald-500',
              8: 'bg-indigo-500'
            };
            return (
              <div key={pr.num_threads}>
                <div className="flex justify-between text-xs font-mono text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className={`w-2.5 h-2.5 rounded-full ${barColors[pr.num_threads] || 'bg-emerald-500'}`}></span>
                    Island Model ({pr.num_threads} Threads / Islands)
                  </span>
                  <span>
                    <strong className="text-emerald-700 font-bold">{pr.speedup.toFixed(2)}x Speedup</strong> • {pr.mean_time_ms.toFixed(1)} ms ({pr.efficiency_percent.toFixed(0)}% eff)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Coarse-Grained Island Model with Ring Topology Migration</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[0, 1, 2, 3].map((islandId) => (
            <div
              key={islandId}
              className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl flex flex-col items-center text-center transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 text-xs font-black font-mono mb-2">
                Core {islandId}
              </div>
              <div className="text-xs font-bold text-slate-900">Island Sub-Pop #{islandId}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Pop: {Math.round(currentSc.pop_size / 4)} Chromosomes</div>
              <div className="text-[11px] text-emerald-700 font-semibold font-mono mt-1">Ring → Island {(islandId + 1) % 4}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 text-center mt-4">
          Periodic Ring Migration every 15 generations transfers top 2 elite chromosomes to neighboring islands, maintaining genetic diversity and preventing premature local stagnation.
        </p>
      </div>

      {/* Experimental Summary Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Empirical Performance Metrics Table ({currentSc.scenario})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">Configuration</th>
                <th className="py-3 px-4">Threads</th>
                <th className="py-3 px-4">Mean Time (ms)</th>
                <th className="py-3 px-4">Speedup</th>
                <th className="py-3 px-4">Efficiency</th>
                <th className="py-3 px-4">Karp-Flatt ($e$)</th>
                <th className="py-3 px-4">Best Fitness $\Phi(x)$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Sequential GA (Baseline)</td>
                <td className="py-3 px-4">1</td>
                <td className="py-3 px-4">{currentSc.sequential.mean_time_ms.toFixed(2)} ± {currentSc.sequential.std_time_ms.toFixed(2)}</td>
                <td className="py-3 px-4">1.00x</td>
                <td className="py-3 px-4">100.0%</td>
                <td className="py-3 px-4">0.0000</td>
                <td className="py-3 px-4 text-emerald-700 font-bold">{currentSc.sequential.mean_best_fitness.toFixed(4)}</td>
              </tr>
              {currentSc.parallel_runs.map((pr) => (
                <tr key={pr.num_threads} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-emerald-800">OpenMP Island Model GA</td>
                  <td className="py-3 px-4">{pr.num_threads}</td>
                  <td className="py-3 px-4">{pr.mean_time_ms.toFixed(2)} ± {pr.std_time_ms.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{pr.speedup.toFixed(2)}x</td>
                  <td className="py-3 px-4">{pr.efficiency_percent.toFixed(1)}%</td>
                  <td className="py-3 px-4">{pr.karp_flatt_serial_fraction.toFixed(4)}</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">{pr.mean_best_fitness.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

