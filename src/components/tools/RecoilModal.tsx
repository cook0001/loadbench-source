import React, { useState, useMemo } from 'react';
import { X, Shield } from 'lucide-react';
import { calculateRecoilDynamics, RecoilResult } from '../../utils/recoilEngine';

interface RecoilModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulletWeightGrains: number;
  chargeGrains: number;
  muzzleVelocityFps: number;
  cartridgeName: string;
  isMetric: boolean;
}

export const RecoilModal: React.FC<RecoilModalProps> = ({
  isOpen,
  onClose,
  bulletWeightGrains,
  chargeGrains,
  muzzleVelocityFps,
  cartridgeName,
  isMetric,
}) => {
  const [rifleWeightLbs, setRifleWeightLbs] = useState<number>(9.5);
  const [brakeEfficiencyPct, setBrakeEfficiencyPct] = useState<number>(0);

  const recoil: RecoilResult = useMemo(() => {
    return calculateRecoilDynamics({
      bulletWeightGrains,
      powderChargeGrains: chargeGrains,
      muzzleVelocityFps,
      rifleWeightLbs,
      muzzleBrakeEfficiencyPct: brakeEfficiencyPct,
    });
  }, [bulletWeightGrains, chargeGrains, muzzleVelocityFps, rifleWeightLbs, brakeEfficiencyPct]);

  if (!isOpen) return null;

  const getSeverityColor = (category: RecoilResult['perceivedCategory']) => {
    switch (category) {
      case 'Mild / Varmint': return 'var(--status-safe)';
      case 'Moderate / Standard': return 'var(--accent-blue)';
      case 'Heavy / Magnum': return 'var(--status-caution)';
      case 'Severe / Dangerous Game': return 'var(--status-danger)';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '700px', maxWidth: '95vw', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              Free Recoil Energy, Velocity &amp; Impulse Dynamics
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          {/* Active Load Telemetry Bar */}
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
              <strong>{cartridgeName}</strong> &bull; {bulletWeightGrains} gr @ {Math.round(muzzleVelocityFps)} fps
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Powder Charge: </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{chargeGrains.toFixed(1)} gr</strong>
            </div>
          </div>

          {/* Sliders: Rifle Weight and Muzzle Brake Efficiency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="input-label">Total Firearm Weight (with Optics &amp; Bipod)</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
                  {isMetric ? `${(rifleWeightLbs * 0.453592).toFixed(2)} kg` : `${rifleWeightLbs.toFixed(1)} lbs`}
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="26"
                step="0.25"
                className="range-slider"
                value={rifleWeightLbs}
                onChange={(e) => setRifleWeightLbs(parseFloat(e.target.value))}
              />
            </div>

            <div className="input-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="input-label">Muzzle Device Attenuation (Brake / Can)</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: brakeEfficiencyPct > 0 ? 'var(--status-safe)' : 'var(--text-muted)' }}>
                  {brakeEfficiencyPct}% {brakeEfficiencyPct === 0 ? '(Bare Muzzle)' : '(Reduction)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="5"
                className="range-slider"
                value={brakeEfficiencyPct}
                onChange={(e) => setBrakeEfficiencyPct(parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          {/* Primary Recoil Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FREE RECOIL ENERGY</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: getSeverityColor(recoil.perceivedCategory), margin: '4px 0' }}>
                {isMetric ? `${recoil.recoilEnergyJoules} J` : `${recoil.recoilEnergyFtLbs} ft-lbs`}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {isMetric ? `${recoil.recoilEnergyFtLbs} ft-lbs` : `${recoil.recoilEnergyJoules} J`}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RECOIL VELOCITY</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>
                {isMetric ? `${recoil.recoilVelocityMps} m/s` : `${recoil.recoilVelocityFps} fps`}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {isMetric ? `${recoil.recoilVelocityFps} fps` : `${recoil.recoilVelocityMps} m/s`}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RECOIL IMPULSE</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                {isMetric ? `${recoil.recoilImpulseNs} N·s` : `${recoil.recoilImpulseLbSec} lb·s`}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {isMetric ? `${recoil.recoilImpulseLbSec} lb·s` : `${recoil.recoilImpulseNs} N·s`}
              </div>
            </div>
          </div>

          {/* Severity & Brake Savings */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '10px 14px',
            borderRadius: '6px',
            border: `1px solid ${getSeverityColor(recoil.perceivedCategory)}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RECOIL SEVERITY:</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: getSeverityColor(recoil.perceivedCategory) }}>
                {recoil.perceivedCategory}
              </span>
            </div>
            {brakeEfficiencyPct > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--status-safe)' }}>
                Brake Attenuation Savings: <strong>-{recoil.effectiveReductionFtLbs} ft-lbs</strong>
              </div>
            )}
          </div>

          {/* Standard Benchmark Comparison Table */}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>INDUSTRY CALIBER BENCHMARKS (Typical Bare Muzzle):</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '4px' }}>
                .223 Rem (8 lb): ~3.5 ft-lbs
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '4px' }}>
                6.5 Creedmoor: ~12.5 ft-lbs
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '4px' }}>
                .308 Win (8.5 lb): ~17.5 ft-lbs
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '4px' }}>
                .300 Win Mag: ~32.0 ft-lbs
              </div>
            </div>
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
