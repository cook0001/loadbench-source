# LoadBench Studio

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/QC-passing-brightgreen.svg)
![Security](https://img.shields.io/badge/security-monitored-success.svg)
![License](https://img.shields.io/badge/license-Proprietary%20Freeware-blue.svg)

LoadBench Studio is an industrial-grade desktop interior ballistics simulation suite designed to simulate, analyze, and optimize cartridge loads. It models the thermodynamic combustion process of propellants, peak chamber pressures, muzzle velocities, and barrel harmonics with laboratory precision.

## Architecture

- **Frontend Ballistics Workbench**: React 19, TypeScript, Vite, Vanilla/Tailwind CSS, Lucide Icons, High-DPI Canvas 2D dual-curve telemetry engine.
- **Backend Native Core**: Rust (Tauri 2), 4th-Order Runge-Kutta (RK4) numerical ODE solver, Noble-Abel equation of state, Vieille's combustion law, propellant grain form factor synthesizer.
- **Wildcat Studio Interchange**: Native import of `.qdf` (Wildcat Studio Data File) and universal `.vol` records exported from Wildcat Studio (`Quick_Design`).
- **Safety & Calibration**: SAAMI/CIP pressure threshold checks, charge ladder generator, multi-propellant comparison matrix, and chronograph velocity truing inversion.

## Setup & Development

```bash
# Install frontend dependencies
npm install

# Run local development with HMR
npm run dev

# Run Tauri desktop app in development
npm run tauri dev

# Typecheck and bundle production build
npx tsc --noEmit
npm run build
```

---

## Precision Firearms Ecosystem

LoadBench Studio is engineered as part of the unified precision ballistics and firearms management ecosystem:

- **[ArmsTrader (armstrader.store)](https://armstrader.store)** — Free web tools and digital utilities suite for firearm owners (Firearm Bill of Sale Generator, Nationwide FFL Finder, Shooting Range Locator, and 50-State Gun Laws Directory). *Note: ArmsTrader is NOT a marketplace, broker, or dealer.*
- **[ArmoryVault](https://github.com/cook0001/armoryvault)** — High-performance desktop firearm inventory, ATF compliance & vault logistics suite.
- **[ArmoryVault Companion](https://github.com/cook0001/armoryvault-companion)** — Offline mobile firearm barcode scanner and encrypted LAN sync for Android.
- **[Wildcat Studio](https://github.com/cook0001/wildcat-studio)** — High-performance cartridge CAD, chamber reamer modeling & internal cutaway telemetry suite.
- **[RangeStudio](https://github.com/cook0001/rangestudio)** — Precision exterior ballistics, 4th-order Runge-Kutta trajectory engine & optical reticle simulator.

---

## License

LoadBench Studio is proprietary software provided free of charge for personal, non-commercial ballistic simulation and load analysis under the [LoadBench End User License Agreement](LICENSE). All Rights Reserved. Reverse engineering, decompilation, unauthorized redistribution, or commercial use without prior written authorization is prohibited.

---

*Copyright © 2026 LoadBench Studio. All rights reserved.*
