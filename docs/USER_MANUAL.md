# LoadBench - Comprehensive User Manual & Technical Reference

Welcome to **LoadBench**, a state-of-the-art interior ballistics simulation suite and reloading laboratory engineered for competitive precision shooters, reloaders, and wildcat cartridge designers.

---

## Table of Contents
1. [Quick Start & Basic Workflow](#1-quick-start--basic-workflow)
2. [Interior Ballistics Thermodynamic Theory](#2-interior-ballistics-thermodynamic-theory)
3. [Interpreting the Pressure & Velocity Curves](#3-interpreting-the-pressure--velocity-curves)
4. [Primer Brisance Dynamics & Shot Start Pressure](#4-primer-brisance-dynamics--shot-start-pressure)
5. [Propellant Thermodynamic Characteristics](#5-propellant-thermodynamic-characteristics)
6. [Chronograph Velocity Truing & Ba Calibration](#6-chronograph-velocity-truing--ba-calibration)
7. [Optimal Barrel Time (OBT) Harmonics](#7-optimal-barrel-time-obt-harmonics)
8. [Downrange Exterior Trajectory Engine](#8-downrange-exterior-trajectory-engine)
9. [Free Recoil Laboratory & Muzzle Brake Physics](#9-free-recoil-laboratory--muzzle-brake-physics)
10. [Wildcat Design & Wildcat Studio Interchange](#10-wildcat-design--wildcat-studio-interchange)
11. [ArmoryVault Reloading Inventory Sync](#11-armoryvault-reloading-inventory-sync)

---

## 1. Quick Start & Basic Workflow

1. **Open Cartridge**: Click `File -> Open Cartridge...` (or the active cartridge badge in the header) to search and select your cartridge from the 385 verified reloadable centerfire catalog.
2. **Select Projectile**: Under Deck 2 (*Projectile & Seating Setup*), select your bullet from over 1,120 verified factory presets or click **Bullet DB** to search by caliber, manufacturer, or weight. Adjust bullet seating depth into the case neck.
3. **Select Propellant & Charge Weight**: Under Deck 3 (*Propellant Charge*), choose your powder from the 180+ propellant catalog. Enter your charge weight in grains (or grams).
4. **Observe the Results**:
   - The dual-axis Canvas chart dynamically computes the pressure curve $P(x)$ and bullet velocity curve $V(x)$ down the entire length of the barrel.
   - Diagnostic tiles display peak pressure, muzzle velocity, burn efficiency percentage, filling ratio, recoil energy, and gyroscopic stability factor ($S_g$).

---

## 2. Interior Ballistics Thermodynamic Theory

LoadBench solves the fundamental differential equations of interior ballistics using the **Noble-Abel Real-Gas Equation of State**:

$$P \cdot (V - \eta \cdot m_g) = m_g \cdot \frac{R}{M} \cdot T_g$$

Where:
- $P$: Chamber gas pressure
- $V$: Instantaneous chamber volume behind the advancing bullet base
- $\eta$: Gas covolume ($\approx 0.85 - 1.05\text{ cm}^3/\text{g}$), accounting for finite molecular volume at extreme pressures
- $m_g$: Mass of propellant burned into gas
- $T_g$: Adiabatic flame temperature of the gas

### Vieille's Rate of Burning Law
Propellant regression is modeled according to Vieille's empirical law:

$$r = \beta \cdot P^\alpha$$

Where $\alpha$ is the burn pressure exponent and $\beta$ is the burn coefficient, calibrated to closed-bomb relative quickness ($Ba$).

### Lagrange Gas Inertia Correction
Gas inside the barrel is not static; it accelerates from the breech ($v=0$) to the bullet base ($v=v_{\text{proj}}$). LoadBench incorporates the classical **Lagrange correction factor** ($C/3$):

$$P_{\text{base}} = \frac{P_{\text{breech}}}{1 + \frac{1}{3} \frac{m_{\text{powder}}}{m_{\text{bullet}}}}$$

---

## 3. Interpreting the Pressure & Velocity Curves

The interactive Canvas renders two simultaneous curves along the length of the barrel:
1. **Pressure Curve (Red/Amber/Purple)**:
   - Starts at initial shot start pressure $P_0$.
   - Rises sharply as propellant deflagrates faster than bullet acceleration expands chamber volume.
   - Reaches **Peak Pressure ($P_{\text{max}}$)** typically within $1.0 - 2.5''$ of bullet travel.
   - Decays asymptotically as expanding volume overcomes gas production.
2. **Velocity Curve (Cyan)**:
   - Starts at $0\text{ fps}$ at the chamber throat.
   - Accelerates rapidly across peak pressure travel.
   - Gradually flattens out toward the muzzle as pressure drops.

### Safety Diagnostic Color Codes:
- 🟢 **Safe / Optimal**: Peak pressure is below 95% of SAAMI/CIP Maximum Average Pressure (MAP).
- 🟡 **Near Maximum (Caution)**: Peak pressure is between 95% and 100% of MAP.
- 🔴 **Overpressure Danger**: Peak pressure exceeds SAAMI/CIP proof/working limits. Reduce charge immediately!

---

## 4. Primer Brisance Dynamics & Shot Start Pressure

LoadBench provides realistic modeling of 8 primer classes:
- `small_pistol` (SP): Baseline $\approx 140\text{ bar}$
- `small_pistol_magnum` (SPM): Baseline $\approx 185\text{ bar}$
- `large_pistol` (LP): Baseline $\approx 160\text{ bar}$
- `large_pistol_magnum` (LPM): Baseline $\approx 210\text{ bar}$
- `small_rifle` (SR): Baseline $\approx 220\text{ bar}$
- `small_rifle_magnum` (SRM): Baseline $\approx 280\text{ bar}$
- `large_rifle` (LR): Baseline $\approx 250\text{ bar}$
- `large_rifle_magnum` (LRM): Baseline $\approx 330\text{ bar}$

### Touching the Lands ($+150\text{ bar}$):
Seating a bullet so that the ogive touches or jams into the rifling leade eliminates initial bullet freebore jump, creating an engraving pressure spike modeled by checking **Touching Lands**.

---

## 5. Propellant Thermodynamic Characteristics

Each propellant in the closed-bomb database is parameterized by:
- **$Ba$ (Relative Quickness)**: Rate of burn relative to standard reference powder. Higher values indicate faster powders (e.g. Bullseye, Red Dot, Trail Boss), lower values indicate slow magnum powders (e.g. Retumbo, H1000, US869).
- **$Q_{ex}$ (Heat of Explosion)**: Specific chemical energy per unit mass ($\text{J/g}$).
- **$\eta$ (Covolume)**: Incompressible molecular volume of combustion gases.
- **$k$ (Ratio of Specific Heats $C_p / C_v$)**: Gas expansion index ($\approx 1.22 - 1.25$).

---

## 6. Chronograph Velocity Truing & Ba Calibration

When physical chronograph measurements at the range differ slightly from simulation due to barrel bore friction, temperature, or propellant lot variance:
1. Open `Calculators & Tools -> Chronograph Truing & Ba Calibration`.
2. Enter your real measured muzzle velocity from your LabRadar, Garmin Xero, or optical chronograph.
3. LoadBench reverse-solves the exact $\Delta Ba$ burn rate offset required to match your barrel.
4. Click **Apply Calibrated Ba** to lock the calibration into your workstation.

---

## 7. Optimal Barrel Time (OBT) Harmonics

Developed by Chris Long, **Optimal Barrel Time** calculates the transit time of longitudinal stress acoustic waves traveling back and forth along the barrel steel:
- When a wave reflects at the muzzle crown, the bore diameter fluctuates minutely.
- If the bullet exits while the crown is expanding or contracting, dispersion increases.
- If the bullet exits during a **quiescent node** (when the crown is at rest between reflections), group sizes shrink dramatically.
- Open `Calculators & Tools -> Optimal Barrel Time (OBT)` to see your load's current barrel time compared to the nearest harmonic nodes!

---

## 8. Downrange Exterior Trajectory Engine

Open `Calculators -> Downrange Exterior Trajectory Table` to calculate full 1,000-yard point-mass ballistic trajectories:
- Supports both **G1** and **G7** drag functions.
- Models drop in inches, cm, MOA, and MIL come-ups.
- Computes crosswind deflection based on wind speed and angle.
- Calculates remaining kinetic energy ($\text{ft-lbs}$ / $\text{J}$) and time of flight.

---

## 9. Free Recoil Laboratory & Muzzle Brake Physics

Open `Calculators & Tools -> Free Recoil Laboratory` to compute:
- **Free Recoil Energy** ($\text{ft-lbs}$ / $\text{J}$)
- **Recoil Velocity** ($\text{fps}$ / $\text{m/s}$)
- **Recoil Impulse** ($\text{lb-sec}$ / $\text{N-s}$)
- Incorporates firearm weight, propellant gas exit velocity ($4,000\text{ fps}$ standard ejecta), and adjustable muzzle brake gas deflection efficiency (0% to 70%).

---

## 10. Wildcat Design & Wildcat Studio Interchange

LoadBench is fully integrated with **Wildcat Studio** (`Quick_Design`):
- Click `File -> Import Chamber / Wildcat` to import `.qdf`, `.vol`, or `.json` chambers.
- Click `Ecosystem -> Wildcat Studio Interchange` to export load chamber volumetrics directly into Wildcat Studio format.

---

## 11. ArmoryVault Reloading Inventory Sync

LoadBench directly bridges into the **ArmoryVault** ecosystem:
- Click `File -> Export to ArmoryVault Load Card`.
- Select your target firearm, enter batch round count, and generate an `.avr`, `.json`, or `.csv` Handload Card.
- In ArmoryVault Desktop or Companion, open `CsvImportModal` and import the card to immediately add your handload into your Armory ammo inventory!

---

## 12. Primer Database & Detailed Brisance Physics

Open `Databases -> Primer Database` (or the **Primer DB** button on Deck 1) to browse the catalog of **109 centerfire primers across 15 global manufacturers**:
- **Manufacturers Covered**: CCI, Federal, Winchester, Remington, Sellier & Bellot, Fiocchi, Unis Ginex, Murom / Wolf / Tula, RWS, Magtech, Cheddite, Norma, Aguila, Barnaul, and Eley.
- **Strictly Centerfire Scope**: Covers Small Pistol, Small Pistol Magnum, Large Pistol, Large Pistol Magnum, Small Rifle, Small Rifle Magnum / Match, Large Rifle, and Large Rifle Magnum / Match. (Shotgun / 209 primers are intentionally excluded per centerfire handloading standard).
- **Physics Gauges & Metrics**:
  - **Brisance Index**: Relative energetic ignition intensity.
  - **Pre-Impulse Pressure ($P_0$)**: Pressure spike generated in the chamber before main propellant deflagration ($\text{bar}$ / $\text{psi}$).
  - **Flame Temperature ($T_{\text{flame}}$)**: Core chemical temperature of the primer plume (Kelvin).
  - **Gas Volume ($V_{\text{gas}}$)**: Gas volume produced per pellet ($cm^3$).
  - **Cup Thickness**: Metal wall thickness in inches, critical for high-pressure magnum rifle loads (e.g. $0.025''$ on CCI 450/BR4 vs $0.017''$ on pistol primers) to prevent cup piercing or flow into firing pin apertures.
- **1-Click Workbench Loading**: Click **Load into Workbench** on any primer to immediately set it as the active primer in your simulation.

---

## 13. Relative Powder Burn Rate Chart & Substitutions

Open `Databases -> Powder Burn Rate Chart` (or click **Burn Chart** on Deck 3) to view the relative speed spectrum of **180+ propellants**:
- **Burn Speed Classification**:
  - `Extremely Fast Handgun / Shotgun`: N310, Titewad, Bullseye, Red Dot, Clays
  - `Fast Handgun`: Titegroup, 231, HP-38, Sport Pistol, Zip
  - `Medium Handgun / Magnum Pistol`: Power Pistol, Silhouette, Blue Dot, Accurate No. 7, 2400, H110, W296
  - `Fast Rifle`: Reloder 7, Accurate 1680, IMR 4198, H4198, LT-30
  - `Medium Rifle (Benchmark)`: Varget, IMR 4064, Reloder 15, Benchmark, Accurate 2520, BL-C(2), AR-Comp
  - `Slow Rifle / Magnum`: H4350, Reloder 16, IMR 4831, Superformance, H4831SC
  - `Ultra Slow Extreme Magnum`: Retumbo, H1000, Reloder 26, N570, US869, 50 BMG
- **Active Propellant Highlighting**: Highlights your current workstation powder and shows the nearest $\pm 3$ adjacent powders with calculated relative burn offsets for rapid load substitution analysis.
- **1-Click Switch**: Click any listed propellant in the chart to load it directly into Deck 3.

---

## 14. CBTO, Bullet Jump & Throat Erosion Calculator

Open `Calculators & Tools -> Cartridge Base to Ogive (CBTO) & Bullet Jump` (or click **CBTO & Jump** on Deck 2):
- **Why CBTO Matters**: Cartridge Overall Length (COAL) measured to the bullet meplat varies widely due to hollow point irregular tips (up to $\pm 0.015''$). Measuring to the bullet ogive with a comparator bushing reflects true seating depth relative to the chamber rifling leade.
- **Hornady / Sinclair Comparator Inserts**: Supports standard insert diameters ($0.224''$, $0.243''$, $0.264''$, $0.284''$, $0.308''$, $0.338''$).
- **Freebore Jump Presets**:
  - `Jam (+0.010")`: Engraved into rifling (maximum pressure spike).
  - `Touch (0.000")`: Resting against lands.
  - `Match Jump (0.015" - 0.020")`: Optimal for tangent ogive bullets (e.g. Sierra MatchKing).
  - `Standard Jump (0.030" - 0.050")`: Standard factory chamber margin.
  - `Hunting Mag Box Jump (0.080"+)`: Restricted by internal magazine box length.
- **Barrel Throat Erosion Wear Tracker**: Enter round count to estimate leade erosion wear (rule-of-thumb: $\approx 0.001''$ throat erosion per 100 rounds fired in standard cartridges, higher in overbore magnums).
- **Direct Workbench Sync**: Click **Apply Seating Depth** to synchronize calculated depth directly into your interior ballistics simulation.

---

## 15. Volumetric Powder Measure & VMD Cavity Sizing

Open `Calculators & Tools -> Volumetric Powder Measure & VMD` (or click **VMD Dispenser** on Deck 3):
- **Volumetric Density (VMD)**: The ratio of cubic centimeters of volume occupied by 1 grain of propellant ($cc/\text{grain}$).
- **Charge Cavity Calculation**:
  $$\text{Cavity Volume } (cc) = \text{Charge (grains)} \times \text{VMD } (cc/\text{grain})$$
- **Supported Powder Measures**:
  - **Lee Auto-Disk & Pro Auto-Disk**: Recommends the exact discrete disk cavity size (e.g., `0.46 cc`, `0.61 cc`, etc.).
  - **RCBS Uniflow**: Displays graduated micrometer screw setting.
  - **Hornady Lock-N-Load Powder Measure**: Displays micrometer rotor depth.
  - **Dillon Precision Powder Bar**: Displays Small/Large powder measure bolt turns and travel.

---

## 16. Printable Benchrest Range Card & Chrono Logger

Open `Calculators & Tools -> Benchrest Range Card & Chrono Logger`:
- **1-Page High-Contrast Print Ready**: Designed specifically for benchrest clipboards, printed in clean monochrome black-and-white.
- **Load Specification Summary**: Caliber, projectile, propellant charge, primer, and COAL.
- **Ballistics Overview**: Muzzle velocity, peak pressure, barrel time, and recoil energy.
- **500-Yard Trajectory Table**: 100yd to 500yd trajectory with bullet drop (inches, MOA, MIL) and 10mph 90° crosswind drift.
- **10-Shot Chronograph Logging Grid**: Shot #1 to #10 velocity entry slots with computed Average, Extreme Spread (ES), and Standard Deviation (SD).
- **Environmental Box**: Temperature, Barometric Pressure, Humidity, and Density Altitude.
- **Integrated ArmoryVault QR Code**: Encodes complete load telemetry for instant mobile and desktop scanning.

---

## 17. ArmoryVault Dual-Model Ingestion (Desktop & Mobile)

LoadBench QR codes and `.load` project files seamlessly ingest into both ArmoryVault models:

### 1. ArmoryVault Desktop (Electron & Tauri)
- **Automatic QR / JSON Parsing**: When pasted or scanned into `AmmoDashboard` or `SyncInbox`, `src/utils/BarcodeEngine.ts` automatically parses the JSON payload, extracting caliber, bullet type, grain weight, powder charge, primer, COAL, velocity, pressure, and lot number directly into Handload inventory.
- **Direct Project File Ingestion**: In `CsvImportModal`, you can drop `.load` or `.json` files saved from LoadBench. Nested specs (`cartridge.name`, `projectile.name`, `propellant.name`) are automatically mapped to inventory columns.
- **Sync Inbox 1-Click Approval**: Pending handload items sent from the mobile companion appear with an emerald "LoadBench Handload Batch" card. Clicking **Accept Handload Batch** automatically prefills the handload form.

### 2. ArmoryVault Mobile Companion (Expo Native)
- **Optical Camera QR Recognition**: Point the companion app's live camera scanner at any LoadBench Ammo Can Label or Range Card QR code.
- **Instant Recipe Card**: The scanner immediately identifies the handload, displaying the caliber, projectile, powder, primer, velocity, and pressure with the lot number.
- **Batch Round Preset**: Automatically sets the round count to the batch size (e.g., 50 rounds).
- **Rapid Round Depletion**: Scanned LoadBench QR codes can also be resolved against on-hand vault inventory to rapidly deduct rounds expended during a range session.
- **LAN Sync Handshake**: Scanned batches can be approved locally or queued to the outbox to be pushed to ArmoryVault Desktop on next LAN sync.
