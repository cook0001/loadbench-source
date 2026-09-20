import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  Code2, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'eula' | 'cleanroom' | 'safety' | 'opensource';
}

type TabKey = 'eula' | 'cleanroom' | 'safety' | 'opensource';

const FULL_LICENSE_TEXT = `LOADBENCH STUDIO — END USER LICENSE AGREEMENT & LEGAL NOTICES
Version 1.0.0 • Copyright (c) 2026 Daniel Cook / LoadBench Studio. All rights reserved.

1. PROPRIETARY FREEWARE LICENSE GRANT
LoadBench Studio ("the Software") is proprietary software provided free of charge ("Freeware") for personal, hobbyist, educational, precision reloading, and professional ballistic research and calculation.

Under this license, you are granted a non-exclusive, non-transferable, revocable license to:
- Install and execute the official binary distributions on any compatible computer system.
- Create, modify, save, and export interior ballistics recipe specifications (.loadbench, .ldb).
- Ingest cartridge CAD dimensions from Wildcat Studio (.wildcat, .wcs) and QuickLOAD data (.vol).
- Export simulated trajectory profiles and ballistics payloads to RangeStudio (.range).
- Generate and print powder charge ladders, OBT harmonic node sheets, batch cost reports, and ammo can identification labels.
- Utilize the mathematical solvers for personal ballistic experimentation and interior pressure modeling.

2. RESTRICTIONS & CONFIDENTIAL SOURCE CODE
The source code, thermodynamic simulation models, numerical integrators, and proprietary internal data structures are the exclusive intellectual property of Daniel Cook.
You may NOT:
- Decompile, reverse engineer, disassemble, or attempt to derive the source code from official compiled binaries.
- Modify, adapt, translate, or create derivative works of the executable or application bundle.
- Sell, rent, lease, sublicense, or distribute modified copies of the Software for commercial gain.
- Publicly redistribute repackaged binary releases without explicit prior written authorization. Official distributions are hosted exclusively via https://armstrader.store/loadbench and authorized GitHub repositories.

3. CLEANROOM IMPLEMENTATION & THERMODYNAMIC PHYSICS ATTRIBUTION
All mathematical and ballistic calculations implemented in LoadBench Studio are independent, cleanroom derivations:
- Noble-Abel Real-Gas State Equation: P · (V - η · mg) = mg · (R / M) · Tg, modeling gas covolume displacement (0.85–1.05 cm³/g) behind the accelerating projectile.
- Vieille's Web Regression Law: dz/dt = Ba · P^α · φ(z), integrating progressive, degressive, and neutral propellant grain geometries (tubular, single-perf, 7-perf, spherical, and flake).
- Lagrange Inertia Gradient: Kinetic acceleration partition accounting for the 1/3 powder charge mass moving with combustion gases down the bore.
- Chris Long Optimal Barrel Time (OBT): Acoustic transit harmonic node predictions based on longitudinal stress wave velocities in cylindrical steel rifle barrels.
- Propellant Thermal Sensitivity: Temperature shift derivations for single-base vs. double-base nitrocellulose/nitroglycerin formulations (Δfps / °F).
- Reference Data: Chamber and pressure limits conform to SAAMI and C.I.P. maximum average pressure (MAP) standards.

4. CRITICAL RELOADING SAFETY & LIABILITY DISCLAIMER
ALL OUTPUTS, PEAK CHAMBER PRESSURES, MUZZLE VELOCITIES, CHARGE WEIGHT LADDERS, AND BARREL TIME VALUES ARE THEORETICAL COMPUTER SIMULATIONS INTENDED SOLELY FOR COMPARATIVE BALLISTIC MODELING.

WARNING:
- Handloading ammunition carries inherent physical risks of severe bodily harm, death, or catastrophic firearm destruction. Actual pressures are influenced by powder lot variations (±3–5% burn rate fluctuation), ambient temperature, chamber neck clearance, primer brisance, bore friction, and bullet seating depth.
- NEVER assemble live ammunition relying solely on calculated outputs.
- ALWAYS reduce starting powder charges by a MINIMUM of 10% below any estimated maximum charge and incrementally work up in small steps (0.2–0.5 gr) while inspecting fired cases for overpressure signs (flattened/cratered primers, stiff bolt lift, ejector extrusion marks).
- Cross-reference published reloading manuals from recognized powder manufacturers (Hodgdon, Alliant, Vihtavuori, Accurate, Ramshot, Norma).
- The author and distributors accept ZERO liability for personal injury, property destruction, or legal non-compliance resulting from ammunition loaded or evaluated using this software. The handloader assumes 100% of the risk.

5. THIRD-PARTY & OPEN SOURCE ACKNOWLEDGEMENTS
LoadBench Studio utilizes open source libraries licensed under permissive terms:
- Tauri v2 (MIT / Apache-2.0) — Rust native desktop application framework
- React & React-DOM (MIT) — Component user interface architecture
- Lucide Icons (ISC) — Clean vector interface iconography
- qrcode (MIT) — Storage label QR code generator
- Vite (MIT) — Application bundler and build system

Official Distribution & Ecosystem Portal:
https://armstrader.store/loadbench
`;

export const LicenseModal: React.FC<LicenseModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'eula' 
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_LICENSE_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleOpenPortal = () => {
    openUrl('https://armstrader.store/loadbench').catch(() => {
      window.open('https://armstrader.store/loadbench', '_blank');
    });
  };

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-content license-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Scale size={18} color="var(--accent-cyan)" />
            <span>LoadBench Studio — Software License &amp; Legal Terms</span>
          </div>
          <button 
            onClick={onClose}
            className="btn-icon"
            aria-label="Close License Modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="license-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'eula'}
            onClick={() => setActiveTab('eula')}
            className={`license-tab-btn ${activeTab === 'eula' ? 'active' : ''}`}
          >
            <FileText size={13} />
            <span>Freeware EULA</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'cleanroom'}
            onClick={() => setActiveTab('cleanroom')}
            className={`license-tab-btn ${activeTab === 'cleanroom' ? 'active' : ''}`}
          >
            <ShieldCheck size={13} />
            <span>Cleanroom Thermodynamics</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'safety'}
            onClick={() => setActiveTab('safety')}
            className={`license-tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
          >
            <AlertTriangle size={13} />
            <span>Reloading Safety Advisory</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'opensource'}
            onClick={() => setActiveTab('opensource')}
            className={`license-tab-btn ${activeTab === 'opensource' ? 'active' : ''}`}
          >
            <Code2 size={13} />
            <span>Open Source Notices</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="license-body">
          {activeTab === 'eula' && (
            <>
              <div className="license-callout cyan">
                <FileText size={18} color="var(--accent-cyan)" />
                <div>
                  <strong>Proprietary Freeware License:</strong> LoadBench Studio is provided 100% free of charge for personal, hobbyist, educational, and professional precision handloading and ballistic research.
                </div>
              </div>

              <div>
                <div className="license-section-title">1. Permitted Uses</div>
                <ul className="license-list">
                  <li>Install and execute official desktop binaries on unlimited personal and shop computer systems.</li>
                  <li>Simulate chamber pressures, combustion curves, and muzzle velocities across standard and custom wildcat cartridges.</li>
                  <li>Ingest wildcat cartridge CAD geometry from Wildcat Studio (<code>.wildcat</code>) and export ballistics profiles to RangeStudio (<code>.range</code>).</li>
                  <li>Generate and print powder charge ladders, OBT harmonic node charts, batch cost analyses, and ammunition storage labels.</li>
                </ul>
              </div>

              <div>
                <div className="license-section-title">2. Commercial Restrictions &amp; Source Rights</div>
                <ul className="license-list">
                  <li>The source code, thermodynamic algorithms, and numerical integrators are the exclusive intellectual property of Daniel Cook.</li>
                  <li>You may not decompile, reverse engineer, disassemble, or derive source code from compiled binaries.</li>
                  <li>You may not sell, rent, lease, or distribute modified builds for commercial gain.</li>
                  <li>Official distributions are hosted exclusively on <code>armstrader.store/loadbench</code> and authorized GitHub releases.</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'cleanroom' && (
            <>
              <div className="license-callout cyan">
                <ShieldCheck size={18} color="var(--accent-cyan)" />
                <div>
                  <strong>Cleanroom Engineering:</strong> All thermodynamic models, gas expansion integrators, and harmonic calculators are independent derivations based on open interior ballistics literature.
                </div>
              </div>

              <div>
                <div className="license-section-title">Noble-Abel Thermodynamic Equation of State</div>
                <p>
                  High-pressure gas expansion behind the accelerating projectile is solved using the classical Noble-Abel real-gas formulation accounting for molecular covolume:
                </p>
                <div className="license-code-block">
                  P · (V - η · mg) = mg · (R / M) · Tg
                </div>
                <ul className="license-list">
                  <li><strong>P:</strong> Chamber gas pressure (bar / psi).</li>
                  <li><strong>V:</strong> Instantaneous chamber volume behind the bullet base as it advances down the bore.</li>
                  <li><strong>η (Covolume):</strong> Incompressible molecular volume of combustion products (0.85–1.05 cm³/g).</li>
                </ul>
              </div>

              <div>
                <div className="license-section-title">Vieille's Law of Propellant Regression</div>
                <p>
                  Linear burning rate regression of propellant grain geometry under chamber pressure:
                </p>
                <div className="license-code-block">
                  r = Ba · P^α · φ(z)
                </div>
                <p>
                  Where <code>Ba</code> is the relative quickness coefficient, <code>α</code> is the pressure exponent, and <code>φ(z)</code> is the form function for tubular, 7-perf, spherical, and flake grains.
                </p>
              </div>

              <div>
                <div className="license-section-title">Optimal Barrel Time (OBT) Acoustics</div>
                <p>
                  Acoustic harmonic transit times predict muzzle crown expansion nodes using Chris Long's finite-element longitudinal stress wave propagation equations in cylindrical rifle barrels.
                </p>
              </div>
            </>
          )}

          {activeTab === 'safety' && (
            <>
              <div className="license-callout danger">
                <AlertTriangle size={18} color="var(--accent-red)" />
                <div>
                  <strong>Critical Handloading Warning:</strong> Computer simulations are mathematical approximations. NEVER assemble ammunition or fire a weapon based solely on simulated charge weights.
                </div>
              </div>

              <div>
                <div className="license-section-title">1. Mandatory 10% Starting Reduction Rule</div>
                <p>
                  Always reduce starting propellant charge weights by a minimum of <strong>10% below any estimated maximum charge</strong>. Work up incrementally in steps of 0.2 to 0.5 grains while carefully inspecting every fired cartridge case.
                </p>
              </div>

              <div>
                <div className="license-section-title">2. Powder Lot-to-Lot Variance</div>
                <p>
                  Commercial propellants exhibit burning rate fluctuations of ±3% to ±5% between manufacturing lot numbers. Ambient temperature, storage humidity, and primer brisance also substantially shift peak chamber pressures.
                </p>
              </div>

              <div>
                <div className="license-section-title">3. Physical Overpressure Diagnostics</div>
                <ul className="license-list">
                  <li>Flattened, cratered, or pierced primers.</li>
                  <li>Heavy or stiff bolt lift upon extraction.</li>
                  <li>Ejector pin imprint marks or brass flow into the bolt face recess.</li>
                  <li>Excessive case head expansion measuring above SAAMI dimensional limits.</li>
                </ul>
              </div>

              <div>
                <div className="license-section-title">4. Limitation of Liability</div>
                <p>
                  The author and distributors assume zero liability for equipment damage, personal injury, disability, death, or regulatory non-compliance resulting from ammunition calculated with LoadBench. The handloader assumes 100% of the risk.
                </p>
              </div>
            </>
          )}

          {activeTab === 'opensource' && (
            <>
              <div className="license-callout cyan">
                <Code2 size={18} color="var(--accent-cyan)" />
                <div>
                  <strong>Open Source Software Notices:</strong> LoadBench Studio is built using high-performance open source components under permissive licensing.
                </div>
              </div>

              <div>
                <div className="license-section-title">Core Runtime Dependencies</div>
                <ul className="license-list">
                  <li><strong>Tauri v2 (MIT / Apache-2.0):</strong> Rust native desktop windowing and IPC bridge.</li>
                  <li><strong>React 19 &amp; React-DOM (MIT):</strong> Component architecture and reactive state management.</li>
                  <li><strong>Lucide Icons (ISC):</strong> Consistent vector typography and iconography.</li>
                  <li><strong>qrcode (MIT):</strong> Storage location QR code matrix generation.</li>
                  <li><strong>Vite (MIT):</strong> Frontend tooling and optimized production bundler.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="license-footer">
          <button
            onClick={handleCopy}
            className="btn-action"
          >
            {copied ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
            <span>{copied ? 'Full License Copied!' : 'Copy Full License Text'}</span>
          </button>

          <div className="flex-row-gap-8">
            <button
              onClick={handleOpenPortal}
              className="btn-action"
            >
              <ExternalLink size={13} />
              <span>armstrader.store/loadbench ↗</span>
            </button>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
