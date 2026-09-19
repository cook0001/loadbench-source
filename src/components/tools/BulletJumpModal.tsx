import React, { useState, useMemo } from 'react';
import { X, Crosshair, Check, ShieldAlert } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { calculateCBTO, STANDARD_COMPARATOR_INSERTS } from '../../utils/cbtoEngine';

interface BulletJumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  seatingDepthInches: number;
  onChangeSeatingDepth: (depth: number) => void;
  isTouchingLands: boolean;
  onChangeTouchingLands: (touching: boolean) => void;
  peakPressurePsi: number;
  isMetric: boolean;
}

export const BulletJumpModal: React.FC<BulletJumpModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  seatingDepthInches,
  onChangeSeatingDepth,
  isTouchingLands: _isTouchingLands,
  onChangeTouchingLands,
  peakPressurePsi,
  isMetric: _isMetric,
}) => {
  const [activeSeatingDepth, setActiveSeatingDepth] = useState<number>(seatingDepthInches);
  const [measuredLandsCbto, setMeasuredLandsCbto] = useState<number>(() => {
    return Number((cartridge.case_length_in + projectile.length_in * 0.70 - seatingDepthInches + 0.020).toFixed(3));
  });
  const [roundCount, setRoundCount] = useState<number>(0);
  const [selectedInsertDia, setSelectedInsertDia] = useState<number>(() => {
    const match = STANDARD_COMPARATOR_INSERTS.find(
      i => Math.abs(i.nominalCaliberIn - cartridge.bullet_diameter_in) < 0.01
    );
    return match ? match.insertDiameterIn : 0.257;
  });

  const cbtoResult = useMemo(() => {
    return calculateCBTO({
      caseLengthInches: cartridge.case_length_in,
      bulletLengthInches: projectile.length_in,
      bulletDiameterInches: cartridge.bullet_diameter_in,
      seatingDepthInches: activeSeatingDepth,
      comparatorInsertDiameterInches: selectedInsertDia,
      measuredCbtoTouchingLandsInches: measuredLandsCbto,
      roundCountFired: roundCount,
      peakPressurePsi,
      heatOfExplosionJPerG: propellant.heat_of_explosion_j_g,
    });
  }, [cartridge, projectile, propellant, activeSeatingDepth, selectedInsertDia, measuredLandsCbto, roundCount, peakPressurePsi]);

  if (!isOpen) return null;

  // Jump Presets
  const applyPresetJump = (targetJumpInches: number) => {
    // Jump = Lands CBTO - Loaded CBTO
    // Loaded CBTO = Lands CBTO - Jump
    // Seating Depth = Case Length + BTO - Loaded CBTO
    const targetLoadedCbto = cbtoResult.currentErodedLandsCbtoInches - targetJumpInches;
    const newSeatingDepth = cartridge.case_length_in + cbtoResult.bulletBaseToOgiveInches - targetLoadedCbto;
    const clampedDepth = Math.max(0.05, Math.min(projectile.length_in * 0.9, Number(newSeatingDepth.toFixed(3))));
    setActiveSeatingDepth(clampedDepth);
  };

  const handleCommit = () => {
    onChangeSeatingDepth(activeSeatingDepth);
    onChangeTouchingLands(cbtoResult.jumpToLandsInches <= 0.001);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '780px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={18} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>
                Cartridge Base To Ogive (CBTO) &amp; Bullet Jump Calculator
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Comparator datum alignment • Freebore throat erosion tracker • Shot-start engraving resistance
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Quick Status Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CARTRIDGE OAL</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {cbtoResult.calculatedCoalInches.toFixed(3)}"
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                Tip to base (COAL)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LOADED CBTO</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {cbtoResult.calculatedCbtoInches.toFixed(3)}"
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                Comparator {selectedInsertDia}" datum
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LANDS CBTO</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {cbtoResult.currentErodedLandsCbtoInches.toFixed(3)}"
              </div>
              <div style={{ fontSize: '9px', color: 'var(--accent-orange)' }}>
                {roundCount > 0 ? `+${cbtoResult.estimatedThroatErosionInches.toFixed(4)}" eroded` : 'Chamber zero-jump'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BULLET JUMP</div>
              <div style={{
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: cbtoResult.jumpStatus === 'jammed' ? 'var(--status-danger)' : cbtoResult.jumpStatus === 'touching' ? 'var(--accent-gold)' : 'var(--accent-green)',
              }}>
                {cbtoResult.jumpToLandsInches > 0 ? `+${cbtoResult.jumpToLandsInches.toFixed(3)}"` : `${cbtoResult.jumpToLandsInches.toFixed(3)}"`}
              </div>
              <div style={{
                fontSize: '9px',
                fontWeight: 700,
                color: cbtoResult.jumpStatus === 'jammed' ? 'var(--status-danger)' : cbtoResult.jumpStatus === 'touching' ? 'var(--accent-gold)' : 'var(--accent-green)',
              }}>
                {cbtoResult.jumpStatus.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Jump Advisory Banner */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: cbtoResult.jumpStatus === 'jammed' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(6, 182, 212, 0.08)',
            border: `1px solid ${cbtoResult.jumpStatus === 'jammed' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.25)'}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <ShieldAlert size={18} color={cbtoResult.jumpStatus === 'jammed' ? 'var(--status-danger)' : 'var(--accent-cyan)'} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong>Jump Dynamics:</strong> {cbtoResult.jumpStatusDescription}
            </div>
          </div>

          {/* Jump Preset Chips */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Set Seating Depth by Quick Target Jump Preset:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Hard Jam (-0.010")', val: -0.010, color: 'var(--status-danger)' },
                { label: 'Touch Lands (0.000")', val: 0.000, color: 'var(--accent-gold)' },
                { label: 'Hybrid Match (+0.010")', val: 0.010, color: 'var(--accent-green)' },
                { label: 'Standard Jump (+0.020")', val: 0.020, color: 'var(--accent-cyan)' },
                { label: 'Generous Jump (+0.040")', val: 0.040, color: 'var(--text-secondary)' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => applyPresetJump(chip.val)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: chip.color,
                    cursor: 'pointer',
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Sliders & Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Left: Seating Depth & Comparator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                1. Seating &amp; Tool Setup
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <label className="input-label" style={{ margin: 0 }}>Bullet Seating Depth (in)</label>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {activeSeatingDepth.toFixed(3)}"
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max={projectile.length_in * 0.85}
                  step="0.001"
                  className="range-slider"
                  value={activeSeatingDepth}
                  onChange={(e) => setActiveSeatingDepth(parseFloat(e.target.value) || 0.1)}
                />
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '2px' }}>Comparator Insert Bushing</label>
                <select
                  className="input-control"
                  style={{ fontSize: '11px', width: '100%' }}
                  value={selectedInsertDia}
                  onChange={(e) => setSelectedInsertDia(parseFloat(e.target.value))}
                >
                  {STANDARD_COMPARATOR_INSERTS.map(i => (
                    <option key={i.name} value={i.insertDiameterIn}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: Chamber Lands & Barrel Wear */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                2. Chamber Freebore &amp; Throat Wear
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '2px' }}>
                  Measured Lands CBTO (Zero-Jump Gauge)
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input-control"
                  style={{ width: '100%', fontSize: '11px' }}
                  value={measuredLandsCbto}
                  onChange={(e) => setMeasuredLandsCbto(parseFloat(e.target.value) || 2.0)}
                />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Distance to lands measured with Hornady Lock-N-Load OAL tool
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <label className="input-label" style={{ margin: 0 }}>Barrel Round Count Fired</label>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {roundCount} rounds
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="25"
                  className="range-slider"
                  value={roundCount}
                  onChange={(e) => setRoundCount(parseInt(e.target.value) || 0)}
                />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Simulates throat leade forward creep from powder plasma erosion
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Updating will set workstation Seating Depth to <strong>{activeSeatingDepth.toFixed(3)}"</strong> (COAL: <strong>{cbtoResult.calculatedCoalInches.toFixed(3)}"</strong>).
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '11px' }}>
              Cancel
            </button>
            <button
              onClick={handleCommit}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={14} />
              <span>Apply to Workbench</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
