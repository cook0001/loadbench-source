import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  Crosshair, 
  Flame, 
  Sparkles, 
  Activity, 
  Layers, 
  FileUp, 
  Scale
} from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLicense?: () => void;
}

interface ManualSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenLicense 
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections: ManualSection[] = useMemo(() => [
    {
      id: 'quickstart',
      title: '1. Quick Start Workflow',
      icon: <Crosshair size={14} />,
      content: (
        <div>
          <h4>Quick Start &amp; Primary Workflow</h4>
          <p>
            LoadBench Studio models high-pressure propellant combustion and projectile bore acceleration in real-time. Follow this standard 4-step sequence:
          </p>
          <ol className="license-list">
            <li><strong>Select Cartridge:</strong> Choose from the verified 385+ centerfire database or click <code>File &gt; Open Cartridge...</code> to ingest a custom wildcat design (<code>.wildcat</code>) from Wildcat Studio.</li>
            <li><strong>Configure Projectile:</strong> In Deck 2 (<em>Projectile &amp; Seating</em>), pick your bullet from the 1,120+ projectile database or define custom diameter, weight, and bearing surface length. Adjust seating depth into the neck.</li>
            <li><strong>Select Propellant &amp; Charge:</strong> In Deck 3 (<em>Propellant Charge</em>), select your powder from 180+ smokeless propellants and enter target charge weight in grains (or grams).</li>
            <li><strong>Inspect Telemetry &amp; Dual Curves:</strong> Observe peak chamber pressure (bar / psi), muzzle velocity (fps / mps), burn percentage, and safety threshold badges in real-time.</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'ballistics',
      title: '2. Interior Ballistics Theory',
      icon: <Sparkles size={14} />,
      content: (
        <div>
          <h4>Noble-Abel Thermodynamic Equation of State</h4>
          <p>
            LoadBench calculates high-pressure propellant gas expansion behind the accelerating bullet using the Noble-Abel equation of state, which accounts for the finite physical volume of gas molecules (covolume):
          </p>
          <div className="license-code-block">
            P · (V - η · mg) = mg · (R / M) · Tg
          </div>
          <ul className="license-list">
            <li><strong>P:</strong> Instantaneous chamber gas pressure (bar / psi).</li>
            <li><strong>V:</strong> Free volume behind the bullet base as it advances down the rifled bore.</li>
            <li><strong>η (Covolume):</strong> Incompressible molecular volume of combustion gases (typically 0.85–1.05 cm³/g).</li>
            <li><strong>Vieille's Law:</strong> Propellant web regression rate: <code>r = Ba · P^α · φ(z)</code>.</li>
            <li><strong>Lagrange Kinetic Energy Partition:</strong> Models the 1/3 powder charge mass accelerating along with the gas column.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'curves',
      title: '3. Interpreting Pressure & Velocity Curves',
      icon: <Activity size={14} />,
      content: (
        <div>
          <h4>Dual-Axis Telemetry Canvas</h4>
          <p>
            The central Canvas renders two simultaneous physical curves across the full length of projectile bore travel:
          </p>
          <ul className="license-list">
            <li><strong>Chamber Pressure P(x) [Red]:</strong> Rises sharply as propellant deflagration begins, peaks within 1.0" to 2.5" of bullet movement, and rapidly decays as bore volume expansion outpaces gas generation.</li>
            <li><strong>Muzzle Velocity V(x) [Cyan]:</strong> Demonstrates steep acceleration through the high-pressure peak region, progressively flattening toward the muzzle crown.</li>
          </ul>
          <div className="manual-callout-box">
            <strong>Safety Threshold Badges:</strong>
            <span>• <strong>Safe (Green):</strong> Peak pressure below 95% of SAAMI/C.I.P. Maximum Average Pressure (MAP).</span>
            <span>• <strong>Caution (Amber):</strong> 95% to 100% of MAP. Near maximum proof limits.</span>
            <span>• <strong>Danger (Red):</strong> Exceeds MAP. Severe risk of case head extrusion or firearm rupture.</span>
          </div>
        </div>
      ),
    },
    {
      id: 'primers',
      title: '4. Primer Brisance & Starting Resistance',
      icon: <Flame size={14} />,
      content: (
        <div>
          <h4>Primer Ignition Dynamics &amp; Shot Start P0</h4>
          <p>
            Primers detonate before the main propellant charge deflagrates, establishing initial chamber pre-pressurization and driving the bullet into the rifling leade:
          </p>
          <ul className="license-list">
            <li><strong>Small Pistol / Magnum:</strong> 140–185 bar initial impulse.</li>
            <li><strong>Large Pistol / Magnum:</strong> 160–210 bar initial impulse.</li>
            <li><strong>Small Rifle / Magnum:</strong> 220–280 bar initial impulse.</li>
            <li><strong>Large Rifle / Magnum:</strong> 250–330 bar initial impulse.</li>
            <li><strong>Touching Lands (+150 bar):</strong> Seating bullets into direct contact with the rifling lands creates an instantaneous mechanical engraving spike.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'obt',
      title: '5. Optimal Barrel Time (OBT) Harmonics',
      icon: <Activity size={14} />,
      content: (
        <div>
          <h4>Chris Long Optimal Barrel Time (OBT) Formulation</h4>
          <p>
            Upon ignition, an acoustic stress wave travels longitudinally through the barrel steel at the speed of sound in ordnance steel (~19,700 ft/s). As this pulse reflects between breech and muzzle, the muzzle crown minutely expands and contracts.
          </p>
          <p>
            <strong>OBT Harmonic Nodes</strong> identify the quiescent intervals when muzzle crown expansion is at rest. Adjusting powder charge weight so the projectile exits during an OBT node yields minimum dispersion and exceptional group consistency.
          </p>
        </div>
      ),
    },
    {
      id: 'interchange',
      title: '6. File Interchange & Drag-and-Drop',
      icon: <FileUp size={14} />,
      content: (
        <div>
          <h4>Universal File Ingestion &amp; Export</h4>
          <p>
            LoadBench features native OS file associations and universal multi-format ingestion:
          </p>
          <ul className="license-list">
            <li><strong>Native LoadBench Recipes (<code>.loadbench</code>, <code>.ldb</code>):</strong> Complete load development recipes with all parameters and diagnostic telemetry.</li>
            <li><strong>Wildcat Studio Specifications (<code>.wildcat</code>, <code>.wcs</code>):</strong> Custom wildcat cartridge drawings and 1,000-slice Simpson capacity data.</li>
            <li><strong>QuickLOAD Data (<code>.vol</code>, <code>.qdf</code>):</strong> Volumetric centerfire records and propellant burn rate constants.</li>
            <li><strong>RangeStudio Export:</strong> Export calculated velocity, bullet weight, and ballistic coefficients directly into RangeStudio for 4th-order Runge-Kutta trajectory modeling.</li>
          </ul>
          <div className="manual-callout-box">
            <strong>Window Drag-and-Drop:</strong> Drag any <code>.loadbench</code>, <code>.wildcat</code>, or <code>.vol</code> file directly onto the LoadBench window to instantly load the specification.
          </div>
        </div>
      ),
    },
    {
      id: 'ecosystem',
      title: '7. Precision Firearms Ecosystem',
      icon: <Layers size={14} />,
      content: (
        <div>
          <h4>Unified Ballistic Architecture</h4>
          <p>
            LoadBench is an integral pillar of the precision firearms software ecosystem:
          </p>
          <ul className="license-list">
            <li><strong><a href="https://armstrader.store" target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); openUrl('https://armstrader.store'); }}>ArmsTrader (armstrader.store)</a>:</strong> Free digital utility suite (Firearm Bill of Sale Generator, Nationwide FFL Finder, Shooting Range Locator, Gun Laws Directory).</li>
            <li><strong><a href="https://armstrader.store/wildcat-studio" target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); openUrl('https://armstrader.store/wildcat-studio'); }}>Wildcat Studio</a>:</strong> 2D vector CAD cartridge design, chamber reamers &amp; cutaway telemetry.</li>
            <li><strong><a href="https://armstrader.store/rangestudio" target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); openUrl('https://armstrader.store/rangestudio'); }}>RangeStudio</a>:</strong> Exterior ballistics, 4th-order Runge-Kutta trajectory engine &amp; optical reticle simulator.</li>
            <li><strong><a href="https://armstrader.store/companion" target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); openUrl('https://armstrader.store/companion'); }}>ArmoryVault Companion</a>:</strong> Offline mobile barcode scanner and encrypted LAN vault sync.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'legal',
      title: '8. Legal Terms & Reloading Advisory',
      icon: <Scale size={14} />,
      content: (
        <div>
          <h4>Software License &amp; Safety Terms</h4>
          <p>
            LoadBench Studio is proprietary freeware provided free of charge for non-commercial cartridge calculation and interior ballistics modeling.
          </p>
          <div className="manual-callout-box">
            <strong>Safety Reminder:</strong> Always reduce starting powder charges by at least 10% below any estimated maximum. Computer simulations can never replace certified piezoelectric transducer proof testing.
          </div>
          {onOpenLicense && (
            <button
              onClick={() => {
                onClose();
                onOpenLicense();
              }}
              className="btn-action"
            >
              <Scale size={13} color="var(--accent-cyan)" />
              <span>View Full Software License &amp; Legal Disclaimers →</span>
            </button>
          )}
        </div>
      ),
    },
  ], [onClose, onOpenLicense]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(s => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [sections, searchQuery]);

  const activeSection = useMemo(() => {
    return sections.find(s => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-content manual-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={16} color="var(--accent-cyan)" />
            <span>LoadBench Studio — User Manual &amp; Interior Ballistics Guide</span>
          </div>
          <button 
            onClick={onClose} 
            className="btn-icon"
            aria-label="Close User Manual"
          >
            <X size={16} />
          </button>
        </div>

        {/* Layout */}
        <div className="manual-layout">
          {/* Sidebar */}
          <div className="manual-sidebar">
            <div className="manual-search-box">
              <Search size={12} className="manual-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="manual-search-input"
              />
            </div>

            <div className="manual-nav-list">
              {filteredSections.map(s => {
                const isActive = s.id === activeSection.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSectionId(s.id)}
                    className={`manual-nav-item ${isActive ? 'active' : ''}`}
                  >
                    {s.icon}
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading Panel */}
          <div className="manual-content-view">
            {activeSection.content}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            onClick={onClose} 
            className="btn-primary"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
