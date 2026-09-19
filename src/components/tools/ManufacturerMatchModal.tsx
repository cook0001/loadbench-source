import React, { useState, useMemo } from 'react';
import { X, Check, BookOpen, RefreshCw } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec, ManufacturerReferenceLoad } from '../../types/propellant';
import { SimulationResult } from '../../types/ballistics';
import { reverseSolveBaFromTarget, matchManufacturerReferenceLoads, CalibrationResult } from '../../utils/reverseSolveEngine';
import { formatPressure, formatVelocity, formatWeight } from '../../utils/formatters';

interface ManufacturerMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  currentChargeGrains: number;
  currentBarrelLengthIn: number;
  currentSeatingDepthIn: number;
  currentResult: SimulationResult;
  onApplyBaOffset: (offsetPct: number) => void;
  onApplyChargeWeight: (charge: number) => void;
  isMetric: boolean;
}

export const ManufacturerMatchModal: React.FC<ManufacturerMatchModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  currentChargeGrains,
  currentBarrelLengthIn,
  currentSeatingDepthIn,
  currentResult,
  onApplyBaOffset,
  onApplyChargeWeight,
  isMetric,
}) => {
  const matchingRefs = useMemo(() => {
    return matchManufacturerReferenceLoads(propellant, cartridge);
  }, [propellant, cartridge]);

  // Selected reference load from manufacturer
  const [selectedRefIndex, setSelectedRefIndex] = useState<number>(0);
  const activeRef: ManufacturerReferenceLoad | undefined = matchingRefs[selectedRefIndex];

  // Manual input mode
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualCharge, setManualCharge] = useState<number>(currentChargeGrains);
  const [manualVelocity, setManualVelocity] = useState<number>(2700);
  const [manualPressure, setManualPressure] = useState<number>(55000);

  // Solved calibration result
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);

  if (!isOpen) return null;

  const handleRunReverseSolve = () => {
    let targetCharge = currentChargeGrains;
    let targetVel = 2700;
    let targetPress: number | undefined = undefined;
    let barrelLen = currentBarrelLengthIn;
    let seating = currentSeatingDepthIn;

    if (isManualMode) {
      targetCharge = manualCharge;
      targetVel = manualVelocity;
      targetPress = manualPressure > 0 ? manualPressure : undefined;
    } else if (activeRef) {
      targetCharge = activeRef.charge_grains;
      targetVel = activeRef.muzzle_velocity_fps;
      targetPress = activeRef.max_pressure_psi;
      barrelLen = activeRef.barrel_length_in;
      if (activeRef.coal_in) {
        seating = (cartridge.case_length_in + projectile.length_in) - activeRef.coal_in;
        if (seating < 0.1) seating = currentSeatingDepthIn;
      }
    }

    const res = reverseSolveBaFromTarget(
      cartridge,
      projectile,
      propellant,
      {
        targetVelocityFps: targetVel,
        targetPressurePsi: targetPress,
        chargeGrains: targetCharge,
        barrelLengthInches: barrelLen,
        seatingDepthInches: seating,
      }
    );

    setCalibrationResult(res);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '780px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              LoadBench &bull; Real-World Manufacturer Match &amp; Calibration
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
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
              <span style={{ color: 'var(--text-muted)' }}>Active Load: </span>
              <strong>{cartridge.name}</strong> &bull; {projectile.weight_grains} gr {projectile.name}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Current Workbench: {formatWeight(currentChargeGrains, 1, isMetric)} | {formatVelocity(currentResult.muzzle_velocity_fps, isMetric)} | {formatPressure(currentResult.max_pressure_bar, isMetric)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--text-muted)' }}>Propellant: </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{propellant.manufacturer} {propellant.name}</strong>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Base Ba: {propellant.burn_rate_ba} &bull; VMD: {propellant.vmd_cc_gr ?? '0.0662'} cc/gr
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => { setIsManualMode(false); setCalibrationResult(null); }}
              disabled={matchingRefs.length === 0}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                backgroundColor: !isManualMode ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                color: !isManualMode ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: matchingRefs.length > 0 ? 'pointer' : 'not-allowed',
                opacity: matchingRefs.length === 0 ? 0.5 : 1,
              }}
            >
              Verified Factory Reference Loads ({matchingRefs.length} Available)
            </button>
            <button
              onClick={() => { setIsManualMode(true); setCalibrationResult(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                backgroundColor: isManualMode ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                color: isManualMode ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Custom Manual Entry (from Paper Manual / Field Chrono)
            </button>
          </div>

          {/* Factory Reference Card List */}
          {!isManualMode && matchingRefs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                SELECT PUBLISHED PRESSURE BARREL TEST POINT:
              </span>
              {matchingRefs.map((ref, idx) => {
                const isSelected = idx === selectedRefIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => { setSelectedRefIndex(idx); setCalibrationResult(null); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                        {ref.source}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ref.bullet_name} ({ref.bullet_weight_grains} gr) &bull; {ref.barrel_length_in}" Test Barrel
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {ref.charge_grains} gr &rarr; {ref.muzzle_velocity_fps} fps
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Peak: {ref.max_pressure_psi.toLocaleString()} psi
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual Input Form */}
          {isManualMode && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '14px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}>
              <div>
                <label className="input-label">Published Charge (gr)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-control"
                  value={manualCharge}
                  onChange={(e) => setManualCharge(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">Published Velocity (fps)</label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={manualVelocity}
                  onChange={(e) => setManualVelocity(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">Published Pressure (psi, opt.)</label>
                <input
                  type="number"
                  step="100"
                  className="input-control"
                  value={manualPressure}
                  onChange={(e) => setManualPressure(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {/* Action: Run Reverse-Solve */}
          <button
            onClick={handleRunReverseSolve}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              padding: '10px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            <span>Reverse-Solve Exact Dynamic Vivacity (Ba)</span>
          </button>

          {/* Calibration Comparison Results */}
          {calibrationResult && (
            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-safe)' }}>
                  REVERSE-SOLVE CONVERGENCE ({calibrationResult.iterations} Iterations)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Ba Offset: <strong>{calibrationResult.baOffsetPct > 0 ? `+${calibrationResult.baOffsetPct}%` : `${calibrationResult.baOffsetPct}%`}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BASE BURNING RATE</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{calibrationResult.originalBa.toFixed(4)}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>CALIBRATED BURNING RATE</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {calibrationResult.calibratedBa.toFixed(4)}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>VELOCITY DELTA</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: Math.abs(calibrationResult.velocityDeltaFps) <= 2 ? 'var(--status-safe)' : 'var(--status-caution)' }}>
                    {calibrationResult.velocityDeltaFps > 0 ? `+${calibrationResult.velocityDeltaFps}` : calibrationResult.velocityDeltaFps} fps
                  </div>
                </div>
              </div>

              {/* Apply Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => {
                    onApplyBaOffset(calibrationResult.baOffsetPct);
                    if (!isManualMode && activeRef) {
                      onApplyChargeWeight(activeRef.charge_grains);
                    } else if (isManualMode) {
                      onApplyChargeWeight(manualCharge);
                    }
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--status-safe-bg)',
                    color: 'var(--status-safe)',
                    border: '1px solid var(--status-safe-border)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={14} />
                  <span>Apply Calibrated Powder & Charge to Workbench</span>
                </button>
              </div>
            </div>
          )}
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
