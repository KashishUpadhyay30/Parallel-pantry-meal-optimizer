"""
HPC Performance & Scalability Benchmarking Framework
Runs automated multi-scenario experiments comparing Sequential GA and 
OpenMP Parallel Island GA across 1, 2, 4, and 8 threads with statistical replication.
Computes Execution Time, Speedup, Efficiency, and Karp-Flatt Serial Fraction.
"""

import os
import sys
import json
import csv
import subprocess
import math
import numpy as np
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIN_SEQ = os.path.join(BASE_DIR, "bin", "sequential_ga.exe")
BIN_PAR = os.path.join(BASE_DIR, "bin", "parallel_ga.exe")
RECIPES_SMALL = os.path.join(BASE_DIR, "data", "processed", "recipes_small.dat")
RECIPES_MED = os.path.join(BASE_DIR, "data", "processed", "recipes_medium.dat")
RECIPES_LARGE = os.path.join(BASE_DIR, "data", "processed", "recipes_large.dat")
PANTRY_DAT = os.path.join(BASE_DIR, "data", "processed", "pantry.dat")

TABLES_DIR = os.path.join(BASE_DIR, "results", "tables")
LOGS_DIR = os.path.join(BASE_DIR, "results", "logs")
os.makedirs(TABLES_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

REPETITIONS = 5
SEEDS = [42, 101, 2023, 777, 9999]

BENCHMARK_SCENARIOS = [
    {
        "name": "Scenario 1: Small Dataset",
        "dataset_name": "Small (60 recipes)",
        "recipe_file": RECIPES_SMALL,
        "pop_size": 100,
        "generations": 100
    },
    {
        "name": "Scenario 2: Medium Dataset",
        "dataset_name": "Medium (500 recipes)",
        "recipe_file": RECIPES_MED,
        "pop_size": 200,
        "generations": 150
    },
    {
        "name": "Scenario 3: Large Dataset",
        "dataset_name": "Large (2500 recipes)",
        "recipe_file": RECIPES_LARGE,
        "pop_size": 400,
        "generations": 200
    },
    {
        "name": "Scenario 4: High Optimization Load",
        "dataset_name": "Large (2500 recipes - Stress)",
        "recipe_file": RECIPES_LARGE,
        "pop_size": 800,
        "generations": 300
    }
]

THREAD_CONFIGS = [1, 2, 4, 8]

def parse_summary_output(stdout_str):
    for line in stdout_str.splitlines():
        if line.startswith("SUMMARY:"):
            parts = line.strip().split()[1:]
            kv = {}
            for p in parts:
                if "=" in p:
                    k, v = p.split("=", 1)
                    try:
                        kv[k] = float(v)
                    except ValueError:
                        kv[k] = v
            return kv
    return {}

def run_single_benchmark(bin_path, args):
    cmd = [bin_path] + args
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=BASE_DIR)
    if res.returncode != 0:
        print(f"[!] Benchmark execution error: {res.stderr}")
        return None
    return parse_summary_output(res.stdout)

def main():
    print("=" * 75)
    print(" HIGH-PERFORMANCE COMPUTING (HPC) EMPIRICAL BENCHMARKING SUITE")
    print(f" Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" Repetitions per Configuration: {REPETITIONS}")
    print("=" * 75)

    all_results = []

    for scenario in BENCHMARK_SCENARIOS:
        print(f"\n>>> Running {scenario['name']} [{scenario['dataset_name']}]")
        print(f"    Parameters: Population={scenario['pop_size']}, Generations={scenario['generations']}")
        print("-" * 75)

        # 1. Run Sequential Baseline
        seq_times = []
        seq_fits = []
        seq_nutrs = []
        seq_expiries = []
        seq_costs = []

        for rep in range(REPETITIONS):
            seed = SEEDS[rep % len(SEEDS)]
            out = run_single_benchmark(BIN_SEQ, [
                "--recipes", scenario["recipe_file"],
                "--pantry", PANTRY_DAT,
                "--pop", str(scenario["pop_size"]),
                "--gen", str(scenario["generations"]),
                "--seed", str(seed)
            ])
            if out and "time_ms" in out:
                seq_times.append(out["time_ms"])
                seq_fits.append(out.get("best_fitness", 0.0))
                seq_nutrs.append(out.get("nutr", 0.0))
                seq_expiries.append(out.get("expiry", 0.0))
                seq_costs.append(out.get("cost", 0.0))

        mean_t1 = float(np.mean(seq_times))
        std_t1 = float(np.std(seq_times))
        mean_fit_seq = float(np.mean(seq_fits))

        print(f"    [Sequential Baseline] Mean Time: {mean_t1:.2f} ms (±{std_t1:.2f} ms) | Best Fit: {mean_fit_seq:.4f}")

        scenario_record = {
            "scenario": scenario["name"],
            "dataset": scenario["dataset_name"],
            "pop_size": scenario["pop_size"],
            "generations": scenario["generations"],
            "sequential": {
                "mean_time_ms": mean_t1,
                "std_time_ms": std_t1,
                "mean_best_fitness": mean_fit_seq,
                "mean_nutr": float(np.mean(seq_nutrs)),
                "mean_expiry": float(np.mean(seq_expiries)),
                "mean_cost": float(np.mean(seq_costs))
            },
            "parallel_runs": []
        }

        # 2. Run Parallel Island GA configurations
        for num_threads in THREAD_CONFIGS:
            par_times = []
            par_fits = []
            par_nutrs = []
            par_expiries = []
            par_costs = []
            par_migrations = []

            for rep in range(REPETITIONS):
                seed = SEEDS[rep % len(SEEDS)]
                out = run_single_benchmark(BIN_PAR, [
                    "--threads", str(num_threads),
                    "--recipes", scenario["recipe_file"],
                    "--pantry", PANTRY_DAT,
                    "--pop", str(scenario["pop_size"]),
                    "--gen", str(scenario["generations"]),
                    "--seed", str(seed),
                    "--mig_interval", "15",
                    "--mig_size", "2"
                ])
                if out and "time_ms" in out:
                    par_times.append(out["time_ms"])
                    par_fits.append(out.get("best_fitness", 0.0))
                    par_nutrs.append(out.get("nutr", 0.0))
                    par_expiries.append(out.get("expiry", 0.0))
                    par_costs.append(out.get("cost", 0.0))
                    par_migrations.append(out.get("migrations", 0))

            mean_tp = float(np.mean(par_times))
            std_tp = float(np.std(par_times))
            speedup = mean_t1 / mean_tp if mean_tp > 0 else 1.0
            efficiency = (speedup / num_threads) * 100.0
            
            # Karp-Flatt Serial Fraction
            if num_threads > 1:
                karp_flatt = ((1.0 / speedup) - (1.0 / num_threads)) / (1.0 - (1.0 / num_threads))
                karp_flatt = max(0.0, karp_flatt)
            else:
                karp_flatt = 0.0

            mean_fit_par = float(np.mean(par_fits))

            print(f"    [Threads: {num_threads:2d}] Mean Time: {mean_tp:7.2f} ms (±{std_tp:5.2f}) | "
                  f"Speedup: {speedup:5.2f}x | Efficiency: {efficiency:5.1f}% | Karp-Flatt: {karp_flatt:.4f} | Fit: {mean_fit_par:.4f}")

            scenario_record["parallel_runs"].append({
                "num_threads": num_threads,
                "mean_time_ms": mean_tp,
                "std_time_ms": std_tp,
                "speedup": speedup,
                "efficiency_percent": efficiency,
                "karp_flatt_serial_fraction": karp_flatt,
                "mean_best_fitness": mean_fit_par,
                "mean_nutr": float(np.mean(par_nutrs)),
                "mean_expiry": float(np.mean(par_expiries)),
                "mean_cost": float(np.mean(par_costs)),
                "mean_migrations": float(np.mean(par_migrations)) if par_migrations else 0
            })

        all_results.append(scenario_record)

    # 3. Export JSON summary
    json_path = os.path.join(TABLES_DIR, "benchmark_results_summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)
    print(f"\n[+] Saved complete telemetry summary to: {json_path}")

    # 4. Export CSV Table
    csv_path = os.path.join(TABLES_DIR, "benchmark_results_summary.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Scenario", "Dataset", "Population", "Generations", "Threads",
            "Execution_Time_ms", "Std_Dev_ms", "Speedup", "Parallel_Efficiency_Pct",
            "Karp_Flatt_Metric", "Best_Fitness", "Nutrition_Satisfaction", "Expiry_Score", "Additional_Cost_USD"
        ])
        for sc in all_results:
            # Sequential row
            writer.writerow([
                sc["scenario"], sc["dataset"], sc["pop_size"], sc["generations"], 1,
                round(sc["sequential"]["mean_time_ms"], 2),
                round(sc["sequential"]["std_time_ms"], 2),
                1.00, 100.0, 0.0000,
                round(sc["sequential"]["mean_best_fitness"], 4),
                round(sc["sequential"]["mean_nutr"], 4),
                round(sc["sequential"]["mean_expiry"], 4),
                round(sc["sequential"]["mean_cost"], 2)
            ])
            # Parallel rows
            for pr in sc["parallel_runs"]:
                writer.writerow([
                    sc["scenario"], sc["dataset"], sc["pop_size"], sc["generations"], pr["num_threads"],
                    round(pr["mean_time_ms"], 2),
                    round(pr["std_time_ms"], 2),
                    round(pr["speedup"], 2),
                    round(pr["efficiency_percent"], 1),
                    round(pr["karp_flatt_serial_fraction"], 4),
                    round(pr["mean_best_fitness"], 4),
                    round(pr["mean_nutr"], 4),
                    round(pr["mean_expiry"], 4),
                    round(pr["mean_cost"], 2)
                ])
    print(f"[+] Saved CSV benchmark metrics to: {csv_path}")

    # 5. Export Publication-Ready Markdown Table
    md_path = os.path.join(TABLES_DIR, "benchmark_results_table.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Empirical HPC Performance Evaluation & Benchmark Results\n\n")
        f.write("Evaluation of Sequential vs. OpenMP Parallel Island GA across 4 benchmark scenarios (5 repetitions per configuration with distinct random seeds).\n\n")
        
        for sc in all_results:
            f.write(f"### {sc['scenario']} ({sc['dataset']})\n")
            f.write(f"- **Population Size**: {sc['pop_size']} | **Generations**: {sc['generations']}\n")
            f.write(f"- **Sequential Baseline ($T_1$)**: {sc['sequential']['mean_time_ms']:.2f} ms (±{sc['sequential']['std_time_ms']:.2f} ms)\n\n")
            f.write("| Configuration | Threads ($p$) | Execution Time ($T_p$, ms) | Speedup ($S_p$) | Efficiency ($E_p$) | Karp-Flatt ($e$) | Best Fitness |\n")
            f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n")
            f.write(f"| **Sequential GA** | 1 | {sc['sequential']['mean_time_ms']:.2f} ± {sc['sequential']['std_time_ms']:.2f} | 1.00x | 100.0% | 0.0000 | {sc['sequential']['mean_best_fitness']:.4f} |\n")
            for pr in sc["parallel_runs"]:
                f.write(f"| **Island GA (Ring)** | {pr['num_threads']} | {pr['mean_time_ms']:.2f} ± {pr['std_time_ms']:.2f} | **{pr['speedup']:.2f}x** | {pr['efficiency_percent']:.1f}% | {pr['karp_flatt_serial_fraction']:.4f} | {pr['mean_best_fitness']:.4f} |\n")
            f.write("\n---\n\n")
    print(f"[+] Saved publication-ready Markdown table to: {md_path}")
    print("\n[+] HPC Benchmarking Suite Completed Successfully!")

if __name__ == "__main__":
    main()
