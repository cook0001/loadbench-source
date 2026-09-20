# Security Policy

## Supported Versions

LoadBench Studio is actively maintained. Security updates, cryptographic patches, and critical hotfixes are provided for the following versions:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| **1.0.x** | :white_check_mark: Yes | Current production release |
| **< 1.0.0** | :x: No | Beta / Pre-release builds (unsupported) |

---

## Reporting a Vulnerability

We take the security, numeric stability, and thermodynamic algorithmic integrity of LoadBench Studio seriously. If you discover a potential security vulnerability, memory corruption bug, or numerical solver integrity issue, please disclose it responsibly.

### How to Report

1. **GitHub Private Vulnerability Reporting (Preferred)**:
   - Navigate to the **Security** tab of the repository.
   - Click **Report a vulnerability** to open a confidential advisory draft.
   - This ensures the issue is reviewed in private before public disclosure.

2. **Responsible Disclosure Guidelines**:
   - **Do NOT** open a public issue or discussion thread disclosing the vulnerability details.
   - Provide a detailed description including:
     - The type of vulnerability (e.g., buffer overflow, file path traversal during recipe import/export, parser vulnerability).
     - The affected platform(s) (macOS Universal, Windows x64, Linux amd64).
     - Step-by-step reproduction instructions or a minimal reproducible recipe.
     - Expected vs actual behavior.

### Response & Remediation Timelines

- **Initial Acknowledgment**: Within **48 hours** of report receipt.
- **Triage & Impact Assessment**: Within **5 business days**.
- **Remediation & Patch Release**: A hotfix release will be built via the automated CI pipeline accompanied by a coordinated security advisory.

---

## Scope & Security Architecture

LoadBench Studio operates strictly as an offline, zero-telemetry desktop application. The following areas are strictly protected:

- **Thermodynamic & Ballistic Solver Safety**: Numerical stability and bounds checking of the 4th-order Runge-Kutta (RK4) numerical ODE solver, Noble-Abel equation of state, and Vieille combustion burn rates to prevent calculation overflows or hangs.
- **Interchange & File Parsing**: Strict schema validation for `.loadbench` (`.ldb`), Wildcat Studio `.wildcat` / `.wcs` files, and universal volume interchanges to prevent injection or directory traversal.
- **Zero-Cloud Architecture**: All custom load records, chronograph telemetry, firearm chamber dimensions, and proprietary powder calibration data remain exclusively on the local client filesystem.
- **Binary Integrity**: Built with Rust Tauri 2 in cleanroom environments with dead-code elimination, symbol stripping, and strict compiler warnings.

---

*Copyright © 2026 LoadBench Studio. All rights reserved.*
