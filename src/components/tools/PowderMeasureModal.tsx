import React, { useState } from 'react';
import { X, Layers, Check } from 'lucide-react';
import { PropellantSpec } from '../../types/propellant';

interface PowderMeasureModalProps {
  isOpen: boolean;
  onClose: () => void;
  propellant: PropellantSpec;
  chargeGrains: number;
  onChangeChargeGrains: (val: number) => void;
}

export const PowderMeasureModal: React.FC<PowderMeasureModalProps> = ({
  isOpen,
  onClose,
  propellant,
  chargeGrains,
  onChangeChargeGrains,
}) => {
  const [activeCharge, setActiveCharge] = useState<number>(chargeGrains);
  const [vmdOffsetPct, setVmdOffsetPct] = useState<number>(0); // user lot density calibration

  // Base VMD from propellant DB or fallback from bulk density (VMD = 1 / (bulk_density * 15.4323584))
  const nominalVmd = propellant.vmd_cc_gr || (1 / (propellant.bulk_density_g_cm3 * 15.4323584));
  const effectiveVmd = nominalVmd * (1 + vmdOffsetPct / 100);

  // Required cavity volume in cubic centimeters (cc) and cubic inches
  const requiredCc = activeCharge * effectiveVmd;
  const requiredCuIn = requiredCc / 16.387064;

  // Dillon Bar recommendation
  const dillonBarType = activeCharge <= 15 ? 'Small Powder Bar' : activeCharge <= 55 ? 'Large Powder Bar' : 'Magnum Powder Bar';
  const dillonTurnsApprox = (activeCharge <= 15 ? activeCharge * 0.25 : (activeCharge - 15) * 0.15 + 3.5).toFixed(1);

  // Lee cavity index approximation
  const leeDisks = [0.30, 0.34, 0.37, 0.40, 0.43, 0.46, 0.49, 0.53, 0.57, 0.61, 0.66, 0.71, 0.76, 0.82, 0.88, 0.95, 1.02, 1.09, 1.18, 1.26, 1.36, 1.46, 1.57];
  const closestLeeDisk = leeDisks.reduce((prev, curr) => Math.abs(curr - requiredCc) < Math.abs(prev - requiredCc) ? curr : prev, leeDisks[0]);

  // Volumetric sensitivity: grains per 0.01 cc variation
  const grainsPer01Cc = 0.01 / effectiveVmd;

  if (!isOpen) return null;

  const handleApply = () => {
    onChangeChargeGrains(activeCharge);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>
                Volumetric Powder Measure &amp; VMD Dispenser Calculator
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Dillon, RCBS, Hornady &amp; Lee cavity volume indexing • Volume Measured Density (VMD)
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Active Propellant & Target Charge */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Propellant
              </span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {propellant.manufacturer} {propellant.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Geometry: {propellant.grain_geometry || 'Extruded'} • Bulk: {propellant.bulk_density_g_cm3} g/cm³
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Target Charge Weight
                </span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {activeCharge.toFixed(1)} gr
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="0.1"
                className="range-slider"
                style={{ marginTop: '8px' }}
                value={activeCharge}
                onChange={(e) => setActiveCharge(parseFloat(e.target.value) || 10)}
              />
            </div>
          </div>

          {/* Core Result Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '14px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CAVITY VOLUME (CC)</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {requiredCc.toFixed(3)} cm³
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {requiredCuIn.toFixed(4)} cu in
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>EFFECTIVE VMD FACTOR</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {effectiveVmd.toFixed(5)}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                cc per single grain
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DISPENSER SENSITIVITY</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                ±{grainsPer01Cc.toFixed(2)} gr
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                per 0.01 cc cavity shift
              </div>
            </div>
          </div>

          {/* Measure Hardware Index Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Dillon Precision Setup */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                Dillon Precision (XL750 / RL550 / Super 1050)
              </div>
              <div style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <div>Powder Bar: <strong>{dillonBarType}</strong></div>
                <div>Micrometer Stem Index: <strong>~{dillonTurnsApprox} turns</strong></div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Always verify final weight with a digital scale before running full batch.
                </div>
              </div>
            </div>

            {/* Lee Precision Setup */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                Lee Precision (Auto-Disk / Drum / Perfect Measure)
              </div>
              <div style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <div>Closest Disk Cavity: <strong>{closestLeeDisk} cc</strong></div>
                <div>Cavity Delta: <strong>{(closestLeeDisk - requiredCc > 0 ? '+' : '') + (closestLeeDisk - requiredCc).toFixed(3)} cc</strong></div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Micro-disk recommended for fine adjustments under 0.03 cc.
                </div>
              </div>
            </div>
          </div>

          {/* Density Lot Calibration */}
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Lot-Specific Density Fine-Tuning
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: vmdOffsetPct !== 0 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                {vmdOffsetPct > 0 ? `+${vmdOffsetPct}%` : `${vmdOffsetPct}%`} density shift
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Manufactured propellant lots vary by ±2% to 4% in settling density depending on humidity and storage.
            </div>
            <input
              type="range"
              min="-8"
              max="8"
              step="0.5"
              className="range-slider"
              value={vmdOffsetPct}
              onChange={(e) => setVmdOffsetPct(parseFloat(e.target.value) || 0)}
            />
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
          <button onClick={() => setVmdOffsetPct(0)} className="btn-secondary" style={{ fontSize: '11px' }}>
            Reset Density
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '11px' }}>
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={14} />
              <span>Apply Charge to Workbench</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
