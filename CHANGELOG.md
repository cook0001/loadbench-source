# Changelog

All notable changes to **QuickLOAD Studio** (`Quick_load`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project scaffolding: Tauri 2 + Vite + React 19 + TypeScript + Rust native ODE engine.
- Interior ballistics thermodynamic solver architecture: Noble-Abel real-gas equation of state, Vieille's combustion law, grain form functions, Lagrange gas inertia correction, projectile engraving friction, and heat transfer.
- Direct interchange with Wildcat Studio (`Quick_Design`) supporting `.qdf` and `.vol` formats.
- Chris Long Optimal Barrel Time (OBT) harmonic node calculation engine.
- Interactive dual-axis Canvas curve rendering for chamber pressure $P(x)$ and bullet velocity $V(x)$ across barrel travel.
- Four-pillar propellant calculation framework: Closed-bomb database, grain formulator, relative quickness interpolation, and chronograph velocity truing.
