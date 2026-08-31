# Mathematical Formulation: High-Performance Multi-Objective Pantry-Aware Meal Planning

## 1. Problem Overview
The Pantry-Aware Meal Planning problem is formulated as a combinatorial **Multi-Objective Optimization Problem (MOOP)**. Given a set of available pantry ingredients with varying quantities and expiration timelines, along with a comprehensive recipe database $\mathcal{R}$, the goal is to construct a daily/multi-meal schedule $\mathcal{M}$ that simultaneously maximizes nutritional adherence and pantry depletion (prioritizing expiring items), while minimizing out-of-pocket grocery procurement costs and food spoilage penalties.

---

## 2. Mathematical Modeling & Sets

### 2.1 Sets and Indices
- $\mathcal{R} = \{1, 2, \dots, N\}$: The universe of $N$ candidate recipes.
- $\mathcal{I} = \{1, 2, \dots, M\}$: The universe of $M$ distinct ingredient types.
- $\mathcal{P} \subseteq \mathcal{I}$: The subset of ingredients currently stocked in the user's pantry.
- $\mathcal{S} = \{\text{Breakfast}, \text{Lunch}, \text{Dinner}, \text{Snack}\}$: The set of meal slots for a daily plan ($k = |\mathcal{S}| = 4$).

### 2.2 Parameters
- **Nutritional Targets**:
  - $T_{\text{cal}}$: Target Daily Energy (kcal)
  - $T_{\text{prot}}$: Target Daily Protein (g)
  - $T_{\text{carb}}$: Target Daily Carbohydrates (g)
  - $T_{\text{fat}}$: Target Daily Fats (g)
- **Recipe Attributes** $\forall r \in \mathcal{R}$:
  - $C_r, P_r, K_r, F_r$: Calories, Protein, Carbs, and Fats of recipe $r$.
  - $q_{r, i}$: Quantity of ingredient $i \in \mathcal{I}$ required by recipe $r$.
  - $\text{Cost}_r$: Base estimated preparation cost.
  - $\text{Category}_r \in \{\text{Breakfast}, \text{Lunch}, \text{Dinner}, \text{Snack}, \text{All}\}$.
  - $\text{DietaryTags}_r \subseteq \{\text{Vegan}, \text{Vegetarian}, \text{Keto}, \text{Gluten-Free}, \text{Halal}, \dots\}$.
- **Pantry Inventory Attributes** $\forall i \in \mathcal{P}$:
  - $Q_i^{\text{avail}}$: Available stock quantity of ingredient $i$.
  - $E_i$: Days remaining until expiration ($E_i \ge 0$).
  - $U_i$: Unit replacement purchase cost.
  - $W_i$: Perishability hazard weight ($W_i \in [1.0, 5.0]$).

---

## 3. Decision Variables & Chromosome Representation

A candidate solution (chromosome) is encoded as an integer vector of length $k$:
$$\mathbf{x} = \langle r_1, r_2, \dots, r_k \rangle, \quad r_s \in \mathcal{R}$$
where $r_s$ designates the recipe selected for meal slot $s \in \mathcal{S}$.

Total ingredient requirements for solution $\mathbf{x}$:
$$Q_i^{\text{req}}(\mathbf{x}) = \sum_{s=1}^k q_{r_s, i}, \quad \forall i \in \mathcal{I}$$

---

## 4. Multi-Objective Functions

### Objective 1: Nutritional Goal Satisfaction ($f_{\text{nutr}}(\mathbf{x})$)
We formulate the nutritional objective as maximizing the normalized inverse Manhattan macro-nutrient distance:

$$\Delta_{\text{cal}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^k C_{r_s} - T_{\text{cal}}}{T_{\text{cal}}} \right|$$
$$\Delta_{\text{prot}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^k P_{r_s} - T_{\text{prot}}}{T_{\text{prot}}} \right|$$
$$\Delta_{\text{carb}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^k K_{r_s} - T_{\text{carb}}}{T_{\text{carb}}} \right|$$
$$\Delta_{\text{fat}}(\mathbf{x}) = \left| \frac{\sum_{s=1}^k F_{r_s} - T_{\text{fat}}}{T_{\text{fat}}} \right|$$

$$f_{\text{nutr}}(\mathbf{x}) = \max\left(0, 1.0 - \frac{1}{4}\left(\Delta_{\text{cal}}(\mathbf{x}) + \Delta_{\text{prot}}(\mathbf{x}) + \Delta_{\text{carb}}(\mathbf{x}) + \Delta_{\text{fat}}(\mathbf{x})\right)\right)$$

$f_{\text{nutr}}(\mathbf{x}) \in [0.0, 1.0]$, where $1.0$ indicates perfect macro fulfillment.

---

### Objective 2: Perishable Expiry Utilization Score ($f_{\text{expiry}}(\mathbf{x})$)
Ingredients with imminent expiration deadlines ($E_i \to 0$) receive higher utilization bonuses through an exponential urgency decay kernel:

$$u_i(\mathbf{x}) = \min\left(1.0, \frac{Q_i^{\text{req}}(\mathbf{x})}{Q_i^{\text{avail}}}\right), \quad \forall i \in \mathcal{P}$$

$$\text{Urgency}(i) = W_i \cdot \exp\left(-\frac{E_i}{\tau}\right), \quad \tau = 3.0 \text{ days}$$

$$f_{\text{expiry}}(\mathbf{x}) = \frac{\sum_{i \in \mathcal{P}} u_i(\mathbf{x}) \cdot \text{Urgency}(i)}{\sum_{i \in \mathcal{P}} \text{Urgency}(i) + \epsilon}$$

$f_{\text{expiry}}(\mathbf{x}) \in [0.0, 1.0]$, maximizing rescue of items nearing spoilage.

---

### Objective 3: Out-of-Pocket Additional Procurement Cost ($f_{\text{cost}}(\mathbf{x})$)
Penalizes the total monetary expenditure required to buy ingredients not in the pantry or exceeding stocked amounts:

$$\text{Shortage}_i(\mathbf{x}) = \max\left(0, Q_i^{\text{req}}(\mathbf{x}) - Q_i^{\text{avail}}\right)$$

$$\text{Cost}_{\text{extra}}(\mathbf{x}) = \sum_{i \in \mathcal{I}} U_i \cdot \text{Shortage}_i(\mathbf{x})$$

We normalize this cost using a reference baseline scaling factor $C_{\text{scale}}$:
$$f_{\text{cost}}(\mathbf{x}) = \frac{\text{Cost}_{\text{extra}}(\mathbf{x})}{C_{\text{scale}}}$$

---

### Objective 4: Food Waste Spoilage Penalty ($f_{\text{waste}}(\mathbf{x})$)
Ingredients expiring within critical window ($E_i \le E_{\text{crit}} = 2$ days) that remain unconsumed incur a direct spoilage penalty:

$$f_{\text{waste}}(\mathbf{x}) = \sum_{i \in \mathcal{P}, E_i \le E_{\text{crit}}} W_i \cdot U_i \cdot \max\left(0, Q_i^{\text{avail}} - Q_i^{\text{req}}(\mathbf{x})\right) \cdot \frac{1}{C_{\text{scale}}}$$

---

## 5. Composite Fitness Function
The multi-objective fitness function aggregates the normalized objectives via weighted sum:

$$\Phi(\mathbf{x}) = w_1 \cdot f_{\text{nutr}}(\mathbf{x}) + w_2 \cdot f_{\text{expiry}}(\mathbf{x}) - w_3 \cdot f_{\text{cost}}(\mathbf{x}) - w_4 \cdot f_{\text{waste}}(\mathbf{x}) - P_{\text{diet}}(\mathbf{x})$$

where:
- $\sum_{j=1}^4 w_j = 1.0$, default configuration: $w_1 = 0.35, w_2 = 0.35, w_3 = 0.15, w_4 = 0.15$.
- $P_{\text{diet}}(\mathbf{x})$ is a heavy hard-constraint penalty if a chosen recipe violates user-specified dietary exclusions (e.g. non-vegan recipe for vegan user).

---

## 6. Genetic Algorithm Operators & Parallel Island Model

1. **Selection**: Tournament Selection with tournament size $k_{\text{tour}} = 3$.
2. **Crossover**: Uniform Crossover with probability $p_c \in [0.8, 0.95]$ and One-point Crossover.
3. **Mutation**: Slot-specific Random Recipe Replacement with probability $p_m \in [0.05, 0.20]$.
4. **Elitism**: Preservation of top $E \ge 2$ elite chromosomes per island across generations.
5. **Island Topology**: Ring Topology with periodic synchronous/asynchronous migration of the top $M_{\text{mig}}$ elites replacing the bottom individuals of the neighbor island every $G_{\text{mig}}$ generations.
