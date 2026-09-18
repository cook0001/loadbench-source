# Changelog

All notable changes to **LoadBench** (`Quick_load`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **1,120+ Factory Projectile Catalog**: Comprehensive expansion of verified bullets across 25 manufacturers (Hornady, Sierra, Nosler, Barnes, Berger, Speer, Lapua, Federal, Swift, Norma, Cutting Edge, Woodleigh, Berry's, Cast Performance, Lehigh Defense, Winchester, Remington, Hammer Bullets, Lake City, Peregrine) spanning all calibers (.172 through .50 BMG and handgun calibers 9mm, .357, .40/10mm, .44, .45, .454, .500 S&W).
- **Accurate Ballistic & Engraving Modeling**: Physical projectile dimensions including bullet length, shank length, G1/G7 ballistic coefficients, base types (boat tail, flat base, round nose), and shot start engraving pressure ($P_0 = 380$ bar for monolithic copper, $250$ bar for standard jacketed lead core, $150$ bar for cast/plated lead).
- **Projectile Database Modal (`ProjectileDatabaseModal.tsx`)**: Fullscreen/modal searchable catalog with multi-parameter filtering (by caliber matching current cartridge, specific caliber, manufacturer, or bullet category: Match/Target, Hunting, Monolithic, Handgun), sorting by grain weight or G1 BC, gyroscopic stability factor ($S_g$) preview with Don Miller ARL formula, and one-click loading into the workstation.
- **Brand Filter & Quick DB Launcher in `ProjectileDeck.tsx`**: In-deck manufacturer dropdown filter and direct database button for streamlined bullet selection among 1,120+ options.
- **Navbar Integration**: Added Bullet Database launcher button in the primary top toolbar next to Powder Database.
- Initial project scaffolding: Tauri 2 + Vite + React 19 + TypeScript + Rust native ODE engine.
- Interior ballistics thermodynamic solver architecture: Noble-Abel real-gas equation of state, Vieille's combustion law, grain form functions, Lagrange gas inertia correction, projectile engraving friction, and heat transfer.
- Direct interchange with Wildcat Studio (`Quick_Design`) supporting `.qdf` and `.vol` formats.
- Chris Long Optimal Barrel Time (OBT) harmonic node calculation engine.
- Interactive dual-axis Canvas curve rendering for chamber pressure $P(x)$ and bullet velocity $V(x)$ across barrel travel.
- Four-pillar propellant calculation framework: Closed-bomb database, grain formulator, relative quickness interpolation, and chronograph velocity truing.
