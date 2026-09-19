import React, { useState } from 'react';
import { X, BookOpen, Search, Crosshair, Flame, Sparkles, Activity, Layers } from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ManualSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const sections: ManualSection[] = [
    {
      id: 'quickstart',
      title: '1. Quick Start Workflow',
      icon: <Crosshair size={14} />,
      content: (
        <div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--accent-cyan)' }}>Quick Start &amp; Basic Workflow</h4>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px' }}>
            <li><strong>Open Cartridge:</strong> Click <code>File -&gt; Open Cartridge...</code> (or click the active cartridge badge in the header) to search and pick from the 385 verified reloadable centerfire catalog.</li>
            <li><strong>Select Projectile:</strong> In Deck 2 (<em>Projectile &amp; Seating Setup</em>), choose your bullet or click <strong>Bullet DB</strong> to search through 1,120+ verified presets. Adjust seating depth into the case neck.</li>
            <li><strong>Select Propellant &amp; Charge Weight:</strong> In Deck 3 (<em>Propellant Charge</em>), select your powder from the 180+ propellant catalog and enter your desired charge weight in grains (or grams).</li>
            <li><strong>Review Diagnostics &amp; Dual Curves:</strong> The real-time Canvas dynamically updates peak pressure, muzzle velocity, burn percentage, and gyroscopic stability.</li>
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
          <h4 style={{ margin: '0 0 8px', color: 'var(--accent-cyan)' }}>Noble-Abel Thermodynamic Equation of State</h4>
          <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
            LoadBench models the high-pressure gas expansion behind the advancing projectile using the classical <strong>Noble-Abel real-gas equation</strong>:
          </p>
          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', margin: '8px 0' }}>
            P · (V - η · mg) = mg · (R / M) · Tg
          </div>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px' }}>
            <li><strong>P:</strong> Chamber gas pressure (bar / psi).</li>
            <li><strong>V:</strong> Instantaneous chamber volume behind the projectile base as it accelerates down the bore.</li>
            <li><strong>η (Covolume):</strong> Incompressible molecular volume of combustion gases (typically 0.85 – 1.05 cm³/g).</li>
            <li><strong>Vieille's Law:</strong> Rate of propellant web regression: <code>r = β · P^α</code>.</li>
            <li><strong>Lagrange Inertia:</strong> Accounts for kinetic energy gradient of gas accelerating along with the bullet.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'curves',
      title: '3. Interpreting Pressure Curves',
      icon: <Activity size={14} />,
      content: (
        <div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--accent-cyan)' }}>Interpreting Pressure P(x) &amp; Velocity V(x) Curves</h4>
          <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
            The dual-axis Canvas chart displays two simultaneous physical curves along the entire length of barrel travel:
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px' }}>
            <li><strong style={{ color: '#ef4444' }}>Pressure Curve:</strong> Rises sharply from initial engraving pressure (P0), peaks within 1.0" - 2.5" of travel, and decays as expanding volume exceeds gas production.</li>
            <li><strong style={{ color: 'var(--accent-cyan)' }}>Velocity Curve:</strong> Accelerates rapidly across the peak pressure zone, gradually flattening toward the muzzle.</li>
          </ul>
          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', marginTop: '8px' }}>
            <strong>Safety Threshold Badges:</strong> Green indicates safe pressures below 95% MAP limit; Amber warns near maximum (95-100% MAP); Red indicates dangerous overpressure exceeding proof limits.
          </div>
        </div>
      ),
    },
    {
      id: 'primers',
      title: '4. Primer Brisance & Starting P0',
      icon: <Flame size={14} />,
      content: (
        <div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--accent-cyan)' }}>Primer Starting Pressure Dynamics</h4>
          <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
            Primers initiate propellant deflagration and create initial chamber pressure before the bullet begins engraving into rifling lands:
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px' }}>
            <li><strong>Small Pistol:</strong> ~140 bar baseline.</li>
            <li><strong>Small Pistol Magnum:</strong> ~185 bar baseline.</li>
            <li><strong>Large Pistol:</strong> ~160 bar baseline.</li>
            <li><strong>Large Pistol Magnum:</strong> ~210 bar baseline.</li>
            <li><strong>Small Rifle:</strong> ~220 bar baseline.</li>
            <li><strong>Small Rifle Magnum:</strong> ~280 bar baseline.</li>
            <li><strong>Large Rifle:</strong> ~250 bar baseline.</li>
            <li><strong>Large Rifle Magnum:</strong> ~330 bar baseline.</li>
            <li><strong>Touching Lands (+150 bar):</strong> Eliminating bullet jump causes initial pressure spikes.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'obt',
      title: '5. Optimal Barrel Time (OBT)',
      icon: <Activity size={14} />,
      content: (
        <div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--accent-cyan)' }}>Chris Long Optimal Barrel Time (OBT) Harmonics</h4>
          <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
            When a cartridge fires, an acoustic longitudinal shockwave travels back and forth through the barrel steel at approximately 19,700 ft/s (speed of sound in steel).
          </p>
          <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
            When this shockwave reaches the muzzle crown, the muzzle diameter minutely expands and contracts. OBT nodes represent the quiescent harmonic intervals when the crown is at rest. Tuning your charge weight so bullet exit time matches an OBT node produces the smallest shot groups.
          </p>
        </div>
      ),
    },
    {
      id: 'ecosystem',
      title: '6. Ecosystem Integration (ArmoryVault & Wildcat Studio)',
      icon: <Layers size={14} />,
      content: (
        <div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--accent-cyan)' }}>Ecosystem Bridge</h4>
          <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
            LoadBench is natively integrated with the ArmoryVault suite and Wildcat Studio:
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px' }}>
            <li><strong>ArmoryVault Export:</strong> Export your simulated recipe directly into native ArmoryVault Handload Cards (.avr, .json, or .csv) to update your inventory.</li>
            <li><strong>Wildcat Studio Bridge:</strong> Direct two-way interchange with Wildcat Studio (.qdf and .vol files) for custom chamber geometries.</li>
            <li><strong>ArmsTrader Store Hub:</strong> Share and download community load recipes and wildcat designs online.</li>
          </ul>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
  });

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '860px', width: '95vw', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              LoadBench Comprehensive User Manual &amp; Ballistic Reference
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Layout: Sidebar & Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: '520px', overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 6px' }}>
                <Search size={12} color="var(--text-muted)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics..."
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '10px' }}
                />
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
              {filteredSections.map(s => {
                const isActive = s.id === activeSection.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSectionId(s.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      marginBottom: '2px',
                    }}
                  >
                    {s.icon}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading Panel */}
          <div style={{ padding: '20px', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)' }}>
            {activeSection.content}
          </div>
        </div>
      </div>
    </div>
  );
};
