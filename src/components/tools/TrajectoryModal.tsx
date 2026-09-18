import React, { useState, useMemo } from 'react';
import { X, Compass } from 'lucide-react';
import { calculateDownrangeTrajectory, TrajectoryResult } from '../../utils/trajectoryEngine';

interface TrajectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  muzzleVelocityFps: number;
  bulletWeightGrains: number;
  bcG1?: number;
  bcG7?: number;
  projectileName: string;
  cartridgeName: string;
  isMetric: boolean;
}

export const TrajectoryModal: React.FC<TrajectoryModalProps> = ({
  isOpen,
  onClose,
  muzzleVelocityFps,
  bulletWeightGrains,
  bcG1 = 0.500,
  bcG7 = 0.250,
  projectileName,
  cartridgeName,
  isMetric,
}) => {
  const [zeroRangeYards, setZeroRangeYards] = useState<number>(100);
  const [dragModel, setDragModel] = useState<'G1' | 'G7'>('G1');
  const [sightHeightInches, setSightHeightInches] = useState<number>(1.5);
  const [windMph, setWindMph] = useState<number>(10);
  const [vitalZoneInches, setVitalZoneInches] = useState<number>(6.0);

  const activeBc = dragModel === 'G7' ? (bcG7 || (bcG1 ? bcG1 * 0.505 : 0.25)) : (bcG1 || 0.500);

  const trajectory: TrajectoryResult = useMemo(() => {
    return calculateDownrangeTrajectory({
      muzzleVelocityFps,
      bc: activeBc,
      dragModel,
      bulletWeightGrains,
      sightHeightInches,
      zeroRangeYards,
      maxRangeYards: 1000,
      stepYards: 100,
      vitalZoneDiameterInches: vitalZoneInches,
      windSpeedMph: windMph,
    });
  }, [muzzleVelocityFps, activeBc, dragModel, bulletWeightGrains, sightHeightInches, zeroRangeYards, vitalZoneInches, windMph]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '840px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              Downrange Trajectory &amp; Drop Table (QuickTARGET)
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
              <strong>{cartridgeName}</strong> &bull; <strong>{projectileName}</strong> ({bulletWeightGrains} gr &bull; {dragModel} BC: {activeBc.toFixed(3)})
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Muzzle Velocity: </span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(muzzleVelocityFps)} fps
              </strong>
            </div>
          </div>

          {/* Quick Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            <div>
              <label className="input-label">Zero Range (yds)</label>
              <select
                className="input-control"
                value={zeroRangeYards}
                onChange={(e) => setZeroRangeYards(parseInt(e.target.value, 10))}
              >
                <option value={50}>50 yds</option>
                <option value={100}>100 yds</option>
                <option value={200}>200 yds</option>
                <option value={300}>300 yds</option>
              </select>
            </div>

            <div>
              <label className="input-label">Drag Standard</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setDragModel('G1')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: dragModel === 'G1' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: dragModel === 'G1' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  G1
                </button>
                <button
                  onClick={() => setDragModel('G7')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: dragModel === 'G7' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: dragModel === 'G7' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  G7
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Sight Height (in)</label>
              <input
                type="number"
                step="0.1"
                className="input-control"
                value={sightHeightInches}
                onChange={(e) => setSightHeightInches(parseFloat(e.target.value) || 1.5)}
              />
            </div>

            <div>
              <label className="input-label">Crosswind (mph)</label>
              <input
                type="number"
                step="1"
                className="input-control"
                value={windMph}
                onChange={(e) => setWindMph(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="input-label">Vital Zone (in)</label>
              <input
                type="number"
                step="1"
                className="input-control"
                value={vitalZoneInches}
                onChange={(e) => setVitalZoneInches(parseFloat(e.target.value) || 6)}
              />
            </div>
          </div>

          {/* MPBR & Apex Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MAX POINT BLANK RANGE (MPBR)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-safe)', marginTop: '2px' }}>
                {trajectory.mpbrYards} yds <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({(trajectory.mpbrYards * 0.9144).toFixed(0)} m)</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Within &plusmn;{(vitalZoneInches / 2).toFixed(1)}" vital window without turret dialing
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MAX APEX TRAJECTORY (MAX ORDINATE)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                +{trajectory.maxOrdinateInches}" <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>at {trajectory.maxOrdinateRangeYards} yds</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Highest bullet rise above scope line of sight
              </div>
            </div>
          </div>

          {/* Trajectory Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <table className="ladder-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Range</th>
                  <th style={{ padding: '8px 10px' }}>Drop (in)</th>
                  <th style={{ padding: '8px 10px', color: 'var(--accent-cyan)' }}>Elev (MOA)</th>
                  <th style={{ padding: '8px 10px', color: 'var(--accent-blue)' }}>Elev (MIL)</th>
                  <th style={{ padding: '8px 10px' }}>Velocity</th>
                  <th style={{ padding: '8px 10px' }}>Energy</th>
                  <th style={{ padding: '8px 10px' }}>TOF</th>
                  <th style={{ padding: '8px 10px' }}>Wind ({windMph}mph)</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'var(--font-mono)' }}>
                {trajectory.steps.map((step) => {
                  const isZero = step.rangeYards === zeroRangeYards;
                  return (
                    <tr
                      key={step.rangeYards}
                      style={{
                        backgroundColor: isZero ? 'rgba(6, 182, 212, 0.10)' : 'transparent',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <td style={{ textAlign: 'left', padding: '6px 10px', fontWeight: isZero ? 700 : 400 }}>
                        {step.rangeYards} yds {isZero && <span style={{ color: 'var(--accent-cyan)', fontSize: '10px' }}>(ZERO)</span>}
                      </td>
                      <td style={{ padding: '6px 10px', color: step.dropInches < 0 ? 'var(--status-caution)' : 'var(--text-primary)' }}>
                        {step.dropInches > 0 ? `+${step.dropInches}` : step.dropInches}"
                      </td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {step.elevationMoa > 0 ? `+${step.elevationMoa}` : step.elevationMoa}
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--accent-blue)' }}>
                        {step.elevationMils > 0 ? `+${step.elevationMils}` : step.elevationMils}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        {isMetric ? `${Math.round(step.velocityFps * 0.3048)} m/s` : `${step.velocityFps} fps`}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        {isMetric ? `${Math.round(step.energyFtLbs * 1.355818)} J` : `${step.energyFtLbs} ft-lbs`}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        {step.timeOfFlightSec.toFixed(3)} s
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        {step.windDriftInches}" ({step.windDriftMoa} MOA)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
