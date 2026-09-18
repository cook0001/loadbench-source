import React from 'react';
import { X, FileDown, Printer, FileText, Download } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { SimulationResult } from '../../types/ballistics';
import { formatPressure, formatVelocity, formatEnergy, formatWeight, formatLength } from '../../utils/formatters';
import { exportLoadRecipeJSON } from '../../utils/fileParsers';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  barrelLength: number;
  seatingDepth: number;
  result: SimulationResult;
  isMetric: boolean;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  chargeGrains,
  barrelLength,
  seatingDepth,
  result,
  isMetric,
}) => {
  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const jsonStr = exportLoadRecipeJSON({
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      barrelLengthInches: barrelLength,
      seatingDepthInches: seatingDepth,
      shotStartPressureBar: projectile.shot_start_pressure_bar,
    });
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartridge.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_load_recipe.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const headers = ['Time_ms', 'Travel_in', 'Travel_mm', 'Pressure_psi', 'Pressure_bar', 'Velocity_fps', 'Velocity_mps', 'Burnt_pct'];
    const rows = result.steps.map(s => [
      s.time_ms,
      s.bullet_travel_in,
      s.bullet_travel_mm,
      s.chamber_pressure_psi,
      s.chamber_pressure_bar,
      s.bullet_velocity_fps,
      s.bullet_velocity_mps,
      s.propellant_burnt_pct,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartridge.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_telemetry.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileDown size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Export Load Recipe & Technical Report
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Printable Card Area */}
          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{cartridge.name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Standard: {cartridge.standard} | MAP: {formatPressure(cartridge.max_pressure_bar, isMetric)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: result.pressure_status === 'safe' ? 'var(--status-safe)' : (result.pressure_status === 'caution' ? 'var(--status-caution)' : 'var(--status-danger)'),
                  textTransform: 'uppercase',
                }}>
                  {result.pressure_status} Load ({result.pressure_margin_pct}% MAP)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>PROJECTILE</div>
                <div style={{ fontWeight: 600 }}>{projectile.manufacturer} {projectile.name}</div>
                <div>Weight: {formatWeight(projectile.weight_grains, 1, isMetric)}</div>
                <div>Seating Depth: {formatLength(seatingDepth, 3, isMetric)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>PROPELLANT</div>
                <div style={{ fontWeight: 600 }}>{propellant.manufacturer} {propellant.name}</div>
                <div>Charge: <strong>{formatWeight(chargeGrains, 1, isMetric)}</strong></div>
                <div>Loading Density: {result.loading_density_pct}%</div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
            }}>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>PEAK PRESSURE</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#ef4444' }}>
                  {formatPressure(result.max_pressure_bar, isMetric)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>MUZZLE VELOCITY</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#06b6d4' }}>
                  {formatVelocity(result.muzzle_velocity_fps, isMetric)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>MUZZLE ENERGY</div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>
                  {formatEnergy(result.muzzle_energy_ft_lbs, isMetric)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>BARREL TIME</div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>
                  {result.barrel_time_ms.toFixed(4)} ms
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '9px', color: 'var(--text-muted)' }}>
              <span>Generated by <strong>LoadBench</strong> &bull; Resal RK4 Interior Ballistics Engine</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button onClick={handleDownloadJSON} style={actionBtnStyle}>
              <FileText size={14} color="var(--accent-cyan)" />
              <span>Download JSON Recipe</span>
            </button>
            <button onClick={handleDownloadCSV} style={actionBtnStyle}>
              <Download size={14} color="var(--accent-blue)" />
              <span>Export CSV Telemetry</span>
            </button>
            <button onClick={handlePrint} style={actionBtnStyle}>
              <Printer size={14} />
              <span>Print Load Sheet</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} style={btnSecondaryStyle}>Close</button>
        </div>
      </div>
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  backgroundColor: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '6px 14px',
  fontSize: '12px',
};
