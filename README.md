# High-Performance Parallel Multi-Objective Optimization for Real-Time Pantry-Aware Meal Planning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![C++](https://img.shields.io/badge/C++-17%20%2F%2020-blue.svg)](https://isocpp.org/)
[![OpenMP](https://img.shields.io/badge/Parallel-OpenMP%205.0-red.svg)](https://www.openmp.org/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)

A High Performance Computing (HPC) research-oriented project developing a **Zero-Waste AI Meal Planner** that simultaneously minimizes household food waste, out-of-pocket grocery purchases, and nutritional deviations using parallel multi-objective genetic algorithms.

---

## 📌 Project Overview & Objectives

Modern household meal management incurs substantial economic and environmental costs due to premature food spoilage and uncoordinated grocery purchasing. This project formulates daily meal generation as a constrained **Multi-Objective Optimization Problem (MOOP)** and implements high-throughput parallel evolutionary solvers:

- **Sequential Genetic Algorithm (GA)**: Baseline single-threaded evolutionary search.
- **OpenMP Parallel Island Model GA**: Shared-memory coarse-grained island architecture with periodic ring-topology elite migration.
- **Distributed MPI Island Model GA**: Distributed-memory multi-node island parallelization.
- **HPC Empirical Benchmarking Framework**: Strong and weak scaling evaluation across thread counts (1, 2, 4, 8, 16), measuring speedup, parallel efficiency, Amdahl fraction, and Karp-Flatt metric.
- **Real-Time Dynamic Pantry Engine**: Instant sub-second re-optimization triggered by pantry state alterations (consumption, expiry changes, new additions).
- **Full-Stack Research UI**: Interactive React dashboard paired with a FastAPI backend for real-time pantry inventory tracking and HPC speedup visualization.

---

## 🏛️ System Architecture

```
                                +---------------------------------------------+
                                |          React + Tailwind Frontend          |
                                |   (Pantry Manager & HPC Bench Dashboard)    |
                                +----------------------+----------------------+
                                                       | REST / JSON
                                        +--------------v--------------+
                                        |       FastAPI Backend       |
                                        | (SQLite DB & Re-optimizer)  |
                                        +--------------+--------------+
                                                       | Subprocess / C-API
                                        +--------------v--------------+
                                        |   C++ HPC Engine (OpenMP)   |
                                        +--------------+--------------+
                                                       |
                       +-------------------------------+-------------------------------+
                       |                               |                               |
          +------------v------------+     +------------v------------+     +------------v------------+
          |    Island 0 (Thread 0)  |     |    Island 1 (Thread 1)  |     |    Island K (Thread K)  |
          |  Pop: N/K Individuals   |     |  Pop: N/K Individuals   |     |  Pop: N/K Individuals   |
          |  - Tournament Selection |     |  - Tournament Selection |     |  - Tournament Selection |
          |  - Uniform Crossover    |     |  - Uniform Crossover    |     |  - Uniform Crossover    |
          |  - Mutation & Elitism   |     |  - Mutation & Elitism   |     |  - Mutation & Elitism   |
          +------------+------------+     +------------+------------+     +------------+------------+
                       |                               |                               |
                       +<====== Ring Migration =======>+<====== Ring Migration =======>+
                                     (Every M Generations: Top-E Elites)
```

---

## 🔬 Multi-Objective Formulation

A candidate solution chromosome is $\mathbf{x} = \langle r_1, r_2, \dots, r_k \rangle$ representing chosen recipe indices across meal slots.

$$\Phi(\mathbf{x}) = w_1 \cdot f_{\text{nutr}}(\mathbf{x}) + w_2 \cdot f_{\text{expiry}}(\mathbf{x}) - w_3 \cdot f_{\text{cost}}(\mathbf{x}) - w_4 \cdot f_{\text{waste}}(\mathbf{x}) - P_{\text{diet}}(\mathbf{x})$$

1. **Nutritional Satisfaction ($f_{\text{nutr}}$)**: Normalized inverse Manhattan distance against target daily Calories, Protein, Carbohydrates, and Fats.
2. **Perishable Expiry Utilization ($f_{\text{expiry}}$)**: Exponential decay urgency weight prioritizing consumption of ingredients nearing expiration ($0 \le \text{days} \le 3$).
3. **Out-of-Pocket Procurement Cost ($f_{\text{cost}}$)**: Monetary penalty for ingredients missing from pantry requiring retail purchase.
4. **Food Waste Penalty ($f_{\text{waste}}$)**: Spoilage hazard penalty for stocked perishables expiring within critical window ($E_i \le 2$ days) that remain unutilized.

Detailed mathematical derivations and objective proofs are provided in [`docs/problem_formulation.md`](docs/problem_formulation.md).

---

## 📂 Repository Structure

```
parallel-pantry-meal-optimizer/
├── data/
│   ├── raw/                  # Multi-tier raw recipe datasets (Small, Medium, Large)
│   ├── processed/            # Normalized JSON/CSV and compact C++ .dat files
│   └── sample_pantry/        # Realistic perishable pantry inventory
├── src/
│   ├── preprocessing/        # Data normalization and vocabulary builder
│   ├── optimization/         # Optimization core interfaces
│   ├── sequential_ga/        # C++ single-threaded Genetic Algorithm
│   ├── parallel_ga/          # C++ OpenMP Island Model GA
│   ├── island_model/         # Migration topologies & ring buffer exchange
│   ├── fitness/              # Multi-objective fitness evaluator
│   ├── models/               # Domain data structures (Recipe, Chromosome, Pantry)
│   └── utils/                # HPC timers, RNGs, and I/O parsers
├── experiments/              # Benchmark configurations & parameter grids
├── results/
│   ├── figures/              # Publication-ready charts (Speedup, Efficiency, Convergence)
│   ├── tables/               # CSV/LaTeX benchmark metric tables
│   └── logs/                 # Execution traces
├── backend/                  # FastAPI REST server & real-time re-optimization hook
├── frontend/                 # React + Vite + Tailwind CSS dashboard
├── docs/                     # Research paper drafts & problem formulation
├── scripts/                  # Data synthesis, automated benchmarking & plotting
├── tests/                    # Unit and integration test suites
├── requirements.txt          # Python dependencies
└── README.md
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **C++ Compiler**: GCC (`g++` 11+) or Clang with OpenMP support (`-fopenmp`)
- **Python**: 3.10+
- **Node.js**: v18+ (for frontend dashboard)

### 1. Clone & Set Up Environment
```bash
git clone https://github.com/KashishUpadhyay30/Parallel-pantry-meal-optimizer.git
cd Parallel-pantry-meal-optimizer

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Generate and Preprocess Datasets
```bash
python scripts/generate_datasets.py
python src/preprocessing/preprocess.py
```

### 3. Compile and Run
```powershell
# Build C++ Executables
powershell -ExecutionPolicy Bypass -File scripts/build_cpp.ps1

# Run Sequential Optimization
.\bin\sequential_ga.exe --verbose
```

### 4. Run Automated Tests
```bash
python -m unittest discover tests
```

---

## 📊 Roadmap & Project Phases

- [x] **Phase 1: Project Setup, Multi-Tier Dataset Pipeline & Problem Formulation**
- [x] **Phase 2: Sequential Genetic Algorithm (C++)**
- [x] **Phase 3: OpenMP Parallel Shared-Memory Island Model (C++)**
- [x] **Phase 4: Advanced Island Topologies & Elite Ring Migration**
- [x] **Phase 5: Distributed Memory MPI Architecture & Scalability Engine**
- [x] **Phase 6: HPC Benchmarking Suite (Speedup, Efficiency, Karp-Flatt Metric)**
- [ ] **Phase 7: Publication-Quality Result Visualizations & Plots**
- [ ] **Phase 8: Python FastAPI Backend & Dynamic Real-Time Re-Optimizer**
- [ ] **Phase 9: Interactive React + Vite + Tailwind Dashboard**
- [ ] **Phase 10: Research Paper Manuscript & IEEE/ACM LaTeX Draft**

---

## 📈 Empirical HPC Benchmark Results

Measured on 4-Core OpenMP Shared-Memory architecture across 4 scaling scenarios (5 statistical repetitions each):

| Scenario | Dataset / Load | Sequential Time ($T_1$) | Parallel 4-Threads ($T_4$) | Parallel Speedup ($S_4$) | 2-Thread Efficiency | Karp-Flatt ($e$) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Small Tier** | 60 Recipes, Pop=100 | 69.57 ms | 52.56 ms | **1.32x** | 53.0% | 0.6740 |
| **2. Medium Tier** | 500 Recipes, Pop=200 | 235.85 ms | 121.92 ms | **1.93x** | 65.6% | 0.3559 |
| **3. Large Tier** | 2500 Recipes, Pop=400 | 570.73 ms | 292.55 ms | **1.95x** | 81.9% | 0.3501 |
| **4. Stress Load** | 2500 Recipes, Pop=800 | 1668.14 ms | 685.17 ms | **2.43x** | **94.6%** | **0.0570** |

---

## 👥 Authors & Contributors

Developed as an HPC academic research project investigating parallel evolutionary multi-objective heuristics:

| Contributor | GitHub Profile | Role |
| :--- | :--- | :--- |
| **Kashish Upadhyay** | [@KashishUpadhyay30](https://github.com/KashishUpadhyay30) | Lead Author & Project Architect |
| **Animesh Labh** | [@animeshlabh57-rgb](https://github.com/animeshlabh57-rgb) | Research & HPC Co-Author |


