# Empirical HPC Performance Evaluation & Benchmark Results

Evaluation of Sequential vs. OpenMP Parallel Island GA across 4 benchmark scenarios (5 repetitions per configuration with distinct random seeds).

### Scenario 1: Small Dataset (Small (60 recipes))
- **Population Size**: 100 | **Generations**: 100
- **Sequential Baseline ($T_1$)**: 69.57 ms (±5.00 ms)

| Configuration | Threads ($p$) | Execution Time ($T_p$, ms) | Speedup ($S_p$) | Efficiency ($E_p$) | Karp-Flatt ($e$) | Best Fitness |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sequential GA** | 1 | 69.57 ± 5.00 | 1.00x | 100.0% | 0.0000 | 0.1653 |
| **Island GA (Ring)** | 1 | 75.13 ± 2.97 | **0.93x** | 92.6% | 0.0000 | 0.1653 |
| **Island GA (Ring)** | 2 | 65.60 ± 2.90 | **1.06x** | 53.0% | 0.8857 | 0.1653 |
| **Island GA (Ring)** | 4 | 52.56 ± 1.71 | **1.32x** | 33.1% | 0.6740 | 0.1653 |
| **Island GA (Ring)** | 8 | 55.68 ± 2.77 | **1.25x** | 15.6% | 0.7718 | 0.1653 |

---

### Scenario 2: Medium Dataset (Medium (500 recipes))
- **Population Size**: 200 | **Generations**: 150
- **Sequential Baseline ($T_1$)**: 235.85 ms (±10.49 ms)

| Configuration | Threads ($p$) | Execution Time ($T_p$, ms) | Speedup ($S_p$) | Efficiency ($E_p$) | Karp-Flatt ($e$) | Best Fitness |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sequential GA** | 1 | 235.85 ± 10.49 | 1.00x | 100.0% | 0.0000 | 0.2010 |
| **Island GA (Ring)** | 1 | 236.85 ± 14.03 | **1.00x** | 99.6% | 0.0000 | 0.2079 |
| **Island GA (Ring)** | 2 | 179.68 ± 3.21 | **1.31x** | 65.6% | 0.5236 | 0.2062 |
| **Island GA (Ring)** | 4 | 121.92 ± 16.64 | **1.93x** | 48.4% | 0.3559 | 0.2079 |
| **Island GA (Ring)** | 8 | 191.23 ± 42.24 | **1.23x** | 15.4% | 0.7838 | 0.2062 |

---

### Scenario 3: Large Dataset (Large (2500 recipes))
- **Population Size**: 400 | **Generations**: 200
- **Sequential Baseline ($T_1$)**: 570.73 ms (±17.15 ms)

| Configuration | Threads ($p$) | Execution Time ($T_p$, ms) | Speedup ($S_p$) | Efficiency ($E_p$) | Karp-Flatt ($e$) | Best Fitness |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sequential GA** | 1 | 570.73 ± 17.15 | 1.00x | 100.0% | 0.0000 | 0.2752 |
| **Island GA (Ring)** | 1 | 544.58 ± 110.91 | **1.05x** | 104.8% | 0.0000 | 0.2752 |
| **Island GA (Ring)** | 2 | 348.36 ± 13.48 | **1.64x** | 81.9% | 0.2207 | 0.2752 |
| **Island GA (Ring)** | 4 | 292.55 ± 42.59 | **1.95x** | 48.8% | 0.3501 | 0.2752 |
| **Island GA (Ring)** | 8 | 330.19 ± 20.21 | **1.73x** | 21.6% | 0.5183 | 0.2752 |

---

### Scenario 4: High Optimization Load (Large (2500 recipes - Stress))
- **Population Size**: 800 | **Generations**: 300
- **Sequential Baseline ($T_1$)**: 1668.14 ms (±151.93 ms)

| Configuration | Threads ($p$) | Execution Time ($T_p$, ms) | Speedup ($S_p$) | Efficiency ($E_p$) | Karp-Flatt ($e$) | Best Fitness |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sequential GA** | 1 | 1668.14 ± 151.93 | 1.00x | 100.0% | 0.0000 | 0.2752 |
| **Island GA (Ring)** | 1 | 1702.82 ± 125.20 | **0.98x** | 98.0% | 0.0000 | 0.2752 |
| **Island GA (Ring)** | 2 | 881.59 ± 72.89 | **1.89x** | 94.6% | 0.0570 | 0.2752 |
| **Island GA (Ring)** | 4 | 685.17 ± 14.06 | **2.43x** | 60.9% | 0.2143 | 0.2752 |
| **Island GA (Ring)** | 8 | 812.92 ± 49.39 | **2.05x** | 25.7% | 0.4141 | 0.2752 |

---

