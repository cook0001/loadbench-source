import React, { useMemo } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';
import { generateBarrelLengthSteps, BarrelLengthStep } from '../../utils/barrelLengthStepper';

interface BarrelLengthModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  currentBarrelLengthInches: number;
  seatingDepthInches: number;
  primer?: PrimerSpec;
  powderTemperatureF?: number;
  isTouchingLands?: boolean;
  baOffsetPct?: number;
  onApplyBarrelLength: (lengthInches: number) => void;
  isMetric: boolean;
}

export const BarrelLengthModal: React.FC<BarrelLengthModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  chargeGrains,
  currentBarrelLengthInches,
  seatingDepthInches,
  primer,
  powderTemperatureF = 70,
  isTouchingLands = false,
  baOffsetPct = 0,
  onApplyBarrelLength,
  isMetric,
}) => {
  const steps: BarrelLengthStep[] = useMemo(() => {
    return generateBarrelLengthSteps(
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      currentBarrelLengthInches,
      seatingDepthInches,
      primer,
      powderTemperatureF,
      isTouchingLands,
      baOffsetPct
    );
  }, [cartridge, projectile, propellant, chargeGrains, currentBarrelLengthInches, seatingDepthInches, primer, powderTemperatureF, isTouchingLands, baOffsetPct]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              Barrel Length vs. Velocity Stepper (&Delta;V / &Delta;L)
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', overflowY: 'auto' }}>
          {/* Active Context Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '12px',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Load: </span>
              <strong>{cartridge.name}</strong> &bull; {projectile.weight_grains} gr {projectile.name}
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Propellant: </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{chargeGrains.toFixed(1)} gr {propellant.name}</strong>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            Simulates velocity changes when chopping or lengthening barrel. Fast burning powders lose less velocity per inch (&sim;15–20 fps/in); slow magnum powders lose significantly more (&sim;35–50 fps/in).
          </p>

          {/* Stepping Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <table className="ladder-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Barrel Length</th>
                  <th style={{ padding: '8px 10px' }}>Velocity</th>
                  <th style={{ padding: '8px 10px', color: 'var(--accent-cyan)' }}>&Delta;V vs Base</th>
                  <th style={{ padding: '8px 10px', color: 'var(--accent-blue)' }}>Slope (&Delta;V/in)</th>
                  <th style={{ padding: '8px 10px' }}>Pmax</th>
                  <th style={{ padding: '8px 10px' }}>Muzzle Blast</th>
                  <th style={{ padding: '8px 10px' }}>Burn %</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px' }}>Action</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'var(--font-mono)' }}>
                {steps.map((step) => {
                  return (
                    <tr
                      key={step.lengthInches}
                      style={{
                        backgroundColor: step.isBaseline ? 'rgba(6, 182, 212, 0.10)' : 'transparent',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <td style={{ textAlign: 'left', padding: '6px 10px', fontWeight: step.isBaseline ? 700 : 400 }}>
                        {step.lengthInches}" {isMetric && `(${(step.lengthInches * 25.4).toFixed(0)} mm)`}
                        {step.isBaseline && <span style={{ color: 'var(--accent-cyan)', fontSize: '10px', marginLeft: '6px' }}>(CURRENT)</span>}
                      </td>
                      <td style={{ padding: '6px 10px', fontWeight: 700 }}>
                        {isMetric ? `${Math.round(step.muzzleVelocityFps * 0.3048)} m/s` : `${step.muzzleVelocityFps} fps`}
                      </td>
                      <td style={{ padding: '6px 10px', color: step.velocityDeltaFps < 0 ? 'var(--status-caution)' : (step.velocityDeltaFps > 0 ? 'var(--status-safe)' : 'var(--text-muted)') }}>
                        {step.velocityDeltaFps > 0 ? `+${step.velocityDeltaFps}` : step.velocityDeltaFps} fps
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--accent-blue)' }}>
                        +{step.velocityPerInchFps} fps/in
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        {isMetric ? `${step.maxPressureBar} bar` : `${Math.round(step.maxPressureBar * 14.5038)} psi`}
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>
                        {isMetric ? `${step.muzzlePressureBar} bar` : `${Math.round(step.muzzlePressureBar * 14.5038)} psi`}
                      </td>
                      <td style={{ padding: '6px 10px', color: step.propellantBurntPct >= 98 ? 'var(--status-safe)' : 'var(--text-muted)' }}>
                        {step.propellantBurntPct}%
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                        {!step.isBaseline && (
                          <button
                            onClick={() => {
                              onApplyBarrelLength(step.lengthInches);
                              onClose();
                            }}
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '3px',
                              padding: '3px 8px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Set {step.lengthInches}"
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
