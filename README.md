# LoadBench Studio

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/QC-passing-brightgreen.svg)
![Security](https://img.shields.io/badge/security-monitored-success.svg)
![License](https://img.shields.io/badge/license-Proprietary-green.svg)

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

*Copyright © 2026 LoadBench Studio. All rights reserved.*
