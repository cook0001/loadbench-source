import React, { useState, useMemo } from 'react';
import { X, Droplets, Check } from 'lucide-react';
import { calculateFiredCaseWaterCapacity, CaseWaterResult } from '../../utils/caseCapacityEngine';

interface CaseWaterWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  nominalCapacityGrH2O: number;
  cartridgeName: string;
  onApplyCapacity: (capacityGrH2O: number) => void;
  isMetric: boolean;
}

export const CaseWaterWeightModal: React.FC<CaseWaterWeightModalProps> = ({
  isOpen,
  onClose,
  nominalCapacityGrH2O,
  cartridgeName,
  onApplyCapacity,
  isMetric,
}) => {
  const [dryWeight, setDryWeight] = useState<number>(170.0);
  const [waterFilledWeight, setWaterFilledWeight] = useState<number>(170.0 + nominalCapacityGrH2O);
  const [waterTempF, setWaterTempF] = useState<number>(68);

  const result: CaseWaterResult = useMemo(() => {
    return calculateFiredCaseWaterCapacity({
      dryWeightGrains: dryWeight,
      waterFilledWeightGrains: waterFilledWeight,
      waterTemperatureF: waterTempF,
      nominalCapacityGrainsH2O: nominalCapacityGrH2O,
    });
  }, [dryWeight, waterFilledWeight, waterTempF, nominalCapacityGrH2O]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '600px', maxWidth: '95vw', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplets size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              Fired Case H₂O Volume Calibration Tool
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
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
              <span style={{ color: 'var(--text-muted)' }}>Cartridge: </span>
              <strong>{cartridgeName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Factory Nominal: </span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {nominalCapacityGrH2O} gr H₂O
              </strong>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            Weigh an empty, dry fired case with spent primer intact. Then fill flush to the mouth with room temperature water (using a drop of dish soap to break surface tension) and weigh again.
          </p>

          {/* Input Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="input-field">
              <label className="input-label">Dry Fired Case (gr)</label>
              <input
                type="number"
                step="0.1"
                className="input-control"
                value={dryWeight}
                onChange={(e) => setDryWeight(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-field">
              <label className="input-label">Water-Filled Case (gr)</label>
              <input
                type="number"
                step="0.1"
                className="input-control"
                value={waterFilledWeight}
                onChange={(e) => setWaterFilledWeight(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-field">
              <label className="input-label">Water Temp (°F)</label>
              <input
                type="number"
                step="1"
                className="input-control"
                value={waterTempF}
                onChange={(e) => setWaterTempF(parseFloat(e.target.value) || 68)}
              />
            </div>
          </div>

          {/* Results Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CALIBRATED OVERFLOW CAPACITY</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
                {isMetric ? `${(result.overflowCapacityGrainsH2O / 15.432358).toFixed(2)} g H₂O` : `${result.overflowCapacityGrainsH2O} gr H₂O`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {result.overflowCapacityCm3} cm³ volume ({result.overflowCapacityGrainsH2O} gr H₂O)
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>VARIANCE VS. FACTORY NOMINAL</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 800,
                color: Math.abs(result.deltaFromNominalPct) > 5 ? 'var(--status-caution)' : 'var(--status-safe)',
                margin: '4px 0',
                fontFamily: 'var(--font-mono)'
              }}>
                {result.deltaFromNominalGrains > 0 ? `+${result.deltaFromNominalGrains}` : result.deltaFromNominalGrains} gr
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ({result.deltaFromNominalPct > 0 ? `+${result.deltaFromNominalPct}` : result.deltaFromNominalPct}%)
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={() => {
              onApplyCapacity(result.overflowCapacityGrainsH2O);
              onClose();
            }}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '12px',
              marginTop: '4px',
            }}
          >
            <Check size={16} />
            <span>Apply Calibrated Capacity ({result.overflowCapacityGrainsH2O} gr H₂O) to Workbench</span>
          </button>
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
