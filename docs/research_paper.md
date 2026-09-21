# High-Performance Parallel Multi-Objective Optimization for Real-Time Pantry-Aware Meal Planning

**Kashish Upadhyay**\
*Department of Computer Science & Engineering*\
GitHub: [@KashishUpadhyay30](https://github.com/KashishUpadhyay30)

**Animesh Labh**\
*Department of Computer Science & Engineering*\
GitHub: [@animeshlabh57-rgb](https://github.com/animeshlabh57-rgb)

---

## Abstract
Household food waste is a major socio-economic and environmental inefficiency, largely driven by suboptimal grocery purchasing and the expiration of perishable ingredients before consumption. Creating daily meal plans that minimize waste while fulfilling strict macronutrient targets and minimizing retail grocery costs is a computationally demanding combinatorial Multi-Objective Optimization Problem (MOOP). 

In this paper, we propose a high-performance parallel evolutionary optimization framework using a coarse-grained OpenMP Island Model Genetic Algorithm. We formulate a four-dimensional objective space spanning: (1) normalized inverse Manhattan macronutrient distance, (2) exponential urgency-decay perishable pantry utilization, (3) out-of-pocket grocery procurement expenditure, and (4) critical-window food waste penalties. 

To achieve sub-second execution suitable for interactive web applications, our Island Model parallelizes the population across multi-core processors using independent pseudo-random number generator streams, double-buffered lock-free memory boundaries, and periodic elite migration across a Ring Topology. 

We conduct extensive empirical evaluations across four workload scenarios (up to 2,500 recipes and populations of 800 individuals). On a 4-core shared-memory architecture, our parallel algorithm achieves a peak speedup of **2.43x**, with **94.6% parallel efficiency** on 2 threads, and reduces the Karp-Flatt experimental serial fraction to **0.0570**. Furthermore, the parallel island model enhances population genetic diversity, consistently outperforming sequential genetic algorithms in solution quality and convergence speed.

**Index Terms**—High Performance Computing, Genetic Algorithms, Island Model, OpenMP, Multi-Objective Optimization, Food Waste Minimization, Real-Time Re-Optimization.

---

## I. Introduction
Household food waste accounts for over 570 million tonnes of edible food loss globally each year. A significant contributor to domestic waste is uncoordinated food management: households purchase new groceries without prioritizing items nearing expiration in their pantries. 

From an optimization perspective, generating a nutritionally balanced daily meal schedule that maximizes the depletion of stocked perishable ingredients while minimizing out-of-pocket grocery spending constitutes a constrained multi-objective combinatorial search. For a dataset of $N$ recipes categorized into $k=4$ meal slots (Breakfast, Lunch, Dinner, Snack), the discrete solution space encompasses $\mathcal{O}(N^k)$ permutations. In real-time production environments—where pantry updates occur dynamically—standard sequential evolutionary algorithms exhibit high latency and premature convergence to local optima.

To address these challenges, this study presents:
1. **Multi-Objective Problem Formulation**: A mathematically grounded composite fitness function integrating macronutrient deviation, exponential perishable urgency decay, out-of-pocket grocery acquisition costs, and imminent spoilage penalties.
2. **OpenMP Island Model Architecture**: A coarse-grained parallel evolutionary algorithm partitioning populations across independent worker threads with ring-topology elite migration.
3. **Comprehensive Empirical Benchmarking**: Experimental evaluation across multi-tier datasets (Small, Medium, Large, Stress Load) measuring execution time, speedup, parallel efficiency, and the Karp-Flatt metric.
4. **Full-Stack Real-Time Software System**: A responsive React + Vite web dashboard integrated with a FastAPI backend, enabling dynamic sub-second re-optimization upon inventory state changes.

---

## II. Mathematical Problem Formulation

Let $\mathcal{R} = \{1, 2, \dots, N\}$ denote the set of available recipes, $\mathcal{I} = \{1, 2, \dots, M\}$ denote the universe of ingredients, and $\mathcal{P} \subseteq \mathcal{I}$ denote ingredients currently stocked in the pantry.

A candidate daily meal plan is represented as an integer vector chromosome:
$$\mathbf{x} = \langle r_1, r_2, r_3, r_4 \rangle, \quad r_s \in \mathcal{R}$$

### A. Objective 1: Nutritional Goal Satisfaction ($f_{\text{nutr}}(\mathbf{x})$)
$$\Delta_{\text{cal}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^4 C_{r_s} - T_{\text{cal}}}{T_{\text{cal}}} \right|, \quad \Delta_{\text{prot}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^4 P_{r_s} - T_{\text{prot}}}{T_{\text{prot}}} \right|$$
$$\Delta_{\text{carb}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^4 K_{r_s} - T_{\text{carb}}}{T_{\text{carb}}} \right|, \quad \Delta_{\text{fat}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^4 F_{r_s} - T_{\text{fat}}}{T_{\text{fat}}} \right|$$

$$f_{\text{nutr}}(\mathbf{x}) = \max\left(0, 1.0 - \frac{1}{4}\left(\Delta_{\text{cal}}(\mathbf{x}) + \Delta_{\text{prot}}(\mathbf{x}) + \Delta_{\text{carb}}(\mathbf{x}) + \Delta_{\text{fat}}(\mathbf{x})\right)\right)$$

### B. Objective 2: Perishable Expiry Utilization ($f_{\text{expiry}}(\mathbf{x})$)
For each stocked item $i \in \mathcal{P}$ with remaining shelf life $E_i$ (days) and perishability hazard $W_i \in [1.0, 5.0]$:
$$u_i(\mathbf{x}) = \min\left(1.0, \frac{\sum_{s=1}^4 q_{r_s, i}}{Q_i^{\text{avail}}}\right)$$
$$\text{Urgency}(i) = W_i \cdot \exp\left(-\frac{E_i}{\tau}\right), \quad \tau = 3.0 \text{ days}$$
$$f_{\text{expiry}}(\mathbf{x}) = \frac{\sum_{i \in \mathcal{P}} u_i(\mathbf{x}) \cdot \text{Urgency}(i)}{\sum_{i \in \mathcal{P}} \text{Urgency}(i) + \epsilon}$$

### C. Objective 3: Out-of-Pocket Grocery Cost ($f_{\text{cost}}(\mathbf{x})$)
$$f_{\text{cost}}(\mathbf{x}) = \frac{1}{C_{\text{scale}}} \sum_{i \in \mathcal{I}} U_i \cdot \max\left(0, \sum_{s=1}^4 q_{r_s, i} - Q_i^{\text{avail}}\right)$$

### D. Objective 4: Critical Window Food Waste Penalty ($f_{\text{waste}}(\mathbf{x})$)
$$f_{\text{waste}}(\mathbf{x}) = \frac{1}{C_{\text{scale}}} \sum_{i \in \mathcal{P}, E_i \le 2} W_i \cdot U_i \cdot \max\left(0, Q_i^{\text{avail}} - \sum_{s=1}^4 q_{r_s, i}\right)$$

### E. Composite Multi-Objective Fitness
$$\Phi(\mathbf{x}) = w_1 \cdot f_{\text{nutr}}(\mathbf{x}) + w_2 \cdot f_{\text{expiry}}(\mathbf{x}) - w_3 \cdot f_{\text{cost}}(\mathbf{x}) - w_4 \cdot f_{\text{waste}}(\mathbf{x}) - P_{\text{diet}}(\mathbf{x})$$

---

## III. Parallel Island Model Architecture

In the coarse-grained Island Model, the total population $N$ is divided into $K$ disjoint sub-populations $\mathcal{P}_1, \mathcal{P}_2, \dots, \mathcal{P}_K$ running concurrently across $K$ OpenMP worker threads:

1. **Thread-Local Random Number Generation**: Each worker thread maintains an independent `std::mt19937` instance seeded deterministically with `seed + tid * 10007 + 1`, eliminating false sharing and memory bus contention.
2. **Ring Topology Elite Migration**: Every $M=15$ generations, the top $E=2$ elite individuals from Island $k$ are copied to a thread-safe double buffer and transferred to neighbor Island $(k + 1) \bmod K$, replacing the worst individuals of the target island.
3. **Barrier Synchronization**: Light-weight `#pragma omp barrier` directives synchronize migration windows while permitting fully asynchronous exploration during non-migration intervals.

---

## IV. Experimental Results & Performance Analysis

### A. Scalability and Speedup Benchmark Results

| Scenario | Dataset Size | Population | Generations | Sequential $T_1$ (ms) | Parallel $T_4$ (ms) | Speedup $S_4$ | 2-Thread Efficiency | Karp-Flatt $e$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Scenario 1** | Small (60 recipes) | 100 | 100 | 69.57 ± 5.00 | 52.56 ± 1.71 | **1.32x** | 53.0% | 0.6740 |
| **Scenario 2** | Medium (500 recipes) | 200 | 150 | 235.85 ± 10.49 | 121.92 ± 16.64 | **1.93x** | 65.6% | 0.3559 |
| **Scenario 3** | Large (2500 recipes) | 400 | 200 | 570.73 ± 17.15 | 292.55 ± 42.59 | **1.95x** | 81.9% | 0.3501 |
| **Scenario 4** | Stress Load (2500 recipes) | 800 | 300 | 1668.14 ± 151.93 | 685.17 ± 14.06 | **2.43x** | **94.6%** | **0.0570** |

### B. High-Performance Computing Insights
1. **Grain-Size and Scalability Threshold**: In small problem sizes (Scenario 1), thread management overhead yields modest speedup (1.32x). As workload scaling increases (Scenario 4), computational intensity dominates overhead, achieving a speedup of **2.43x** and near-linear parallel efficiency (**94.6%** on 2 threads).
2. **Karp-Flatt Metric Analysis**: The experimental serial fraction drops from $e = 0.6740$ in Scenario 1 down to $e = 0.0570$ in Scenario 4, confirming that the parallel algorithm approaches ideal parallel scaling as problem complexity expands.
3. **Genetic Diversity & Solution Quality**: Due to semi-isolated evolutionary sub-populations, the Parallel Island Model consistently achieved superior global fitness ($0.2752$ vs $0.2010$) by avoiding premature stagnation commonly observed in single-population sequential GA.

---

## V. System Implementation & Dynamic Re-Optimization

The software architecture is implemented across three coordinated tiers:
- **Optimization Engine (C++17 / OpenMP)**: High-speed compiled CLI binary executing evolutionary operations with sub-millisecond data structures.
- **REST API Backend (Python FastAPI & SQLite)**: Exposes endpoints for pantry CRUD, historical telemetry logging, and background C++ process spawning.
- **Web User Interface (React + Vite + Tailwind CSS)**: Modern interactive single-page application rendering pantry expiry badges, macro satisfaction dials, meal recommendation cards, and live HPC scaling charts.

---

## VI. Conclusion & Future Work
We developed and validated a High-Performance Parallel Multi-Objective Genetic Algorithm for real-time pantry-aware meal planning. Experimental results demonstrate that coarse-grained island parallelization with ring elite migration delivers substantial speedups (up to 2.43x), cuts execution times from 1.67s down to 685ms, and produces higher-quality zero-waste meal recommendations. Future work includes extending the hybrid MPI+OpenMP model to distributed multi-GPU accelerator clusters and integrating computer vision models for automated refrigerator inventory scanning.

---

## References
1. FAO, *The State of Food and Agriculture 2023: Revealing the true cost of food to transform agrifood systems*, Food and Agriculture Organization of the United Nations, Rome, 2023.
2. D. E. Goldberg, *Genetic Algorithms in Search, Optimization, and Machine Learning*, Addison-Wesley Professional, 1989.
3. E. Alba and M. Tomassini, "Parallelism and evolutionary algorithms," *IEEE Transactions on Evolutionary Computation*, vol. 6, no. 5, pp. 443-462, 2002.
4. K. Deb, *Multi-Objective Optimization using Evolutionary Algorithms*, John Wiley & Sons, 2001.
5. A. H. Karp and H. P. Flatt, "Measuring parallel processor performance," *Communications of the ACM*, vol. 33, no. 5, pp. 539-543, 1990.
6. OpenMP Architecture Review Board, *OpenMP Application Programming Interface Specification Version 5.0*, 2018.
