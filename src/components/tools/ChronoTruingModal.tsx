import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { PropellantSpec } from '../../types/propellant';

interface ChronoTruingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propellant: PropellantSpec;
  currentVelocityFps: number;
  onApplyBaOffset: (offsetPct: number) => void;
  onCalibrateBa: (measuredFps: number) => { calibratedBa: number; offsetPct: number };
}

export const ChronoTruingModal: React.FC<ChronoTruingModalProps> = ({
  isOpen,
  onClose,
  propellant,
  currentVelocityFps,
  onApplyBaOffset,
  onCalibrateBa,
}) => {
  const [measuredFps, setMeasuredFps] = useState<number>(currentVelocityFps);
  const [calibrationResult, setCalibrationResult] = useState<{ calibratedBa: number; offsetPct: number } | null>(null);

  if (!isOpen) return null;

  const handleSolve = () => {
    const res = onCalibrateBa(measuredFps);
    setCalibrationResult(res);
  };

  const handleApply = () => {
    if (calibrationResult) {
      onApplyBaOffset(calibrationResult.offsetPct);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Chronograph Velocity Truing & Ba Calibration
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Real-world powder lots, temperature, primer brisance, and bore friction vary from nominal book values. Enter your actual chronograph velocity reading to solve for the exact burning rate factor (<strong>Ba</strong>) for this specific rifle and lot.
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Propellant</div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{propellant.manufacturer} {propellant.name}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                Baseline Ba: {propellant.burn_rate_ba}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Simulated Velocity</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {currentVelocityFps} fps
              </div>
            </div>
          </div>

          <div className="input-field">
            <label className="input-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Actual Chronograph Measured Muzzle Velocity (fps)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                step="1"
                className="input-control"
                style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}
                value={measuredFps}
                onChange={(e) => setMeasuredFps(parseFloat(e.target.value) || 0)}
              />
              <button
                onClick={handleSolve}
                style={{
                  backgroundColor: 'var(--accent-cyan)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Solve Ba
              </button>
            </div>
          </div>

          {calibrationResult && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--status-safe-border)',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-safe)' }}>
                Calibration Solution Converged
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span>Calibrated Burning Rate (Ba):</span>
                <strong>{calibrationResult.calibratedBa}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span>Required Ba Offset:</span>
                <strong style={{ color: calibrationResult.offsetPct >= 0 ? 'var(--status-caution)' : 'var(--accent-blue)' }}>
                  {calibrationResult.offsetPct >= 0 ? `+${calibrationResult.offsetPct}%` : `${calibrationResult.offsetPct}%`}
                </strong>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          {calibrationResult && (
            <button
              onClick={handleApply}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--status-safe)',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Check size={14} />
              <span>Apply Calibrated Ba</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const btnSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '6px 14px',
  fontSize: '12px',
};
