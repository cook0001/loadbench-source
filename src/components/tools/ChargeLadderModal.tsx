import React from 'react';
import { X, Table, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ChargeLadderStep } from '../../types/ballistics';
import { formatPressure, formatVelocity, formatWeight } from '../../utils/formatters';

interface ChargeLadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: ChargeLadderStep[];
  currentCharge: number;
  mapPressureBar: number;
  onSelectCharge: (charge: number) => void;
  isMetric: boolean;
}

export const ChargeLadderModal: React.FC<ChargeLadderModalProps> = ({
  isOpen,
  onClose,
  steps,
  currentCharge,
  mapPressureBar,
  onSelectCharge,
  isMetric,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Charge Stepping Ladder & Safety Window</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Incremental charge variation showing chamber pressure, muzzle velocity, filling ratio, and powder burn efficiency. Click any row to load that charge into the workbench.
          </div>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            textAlign: 'right',
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
              }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Charge Weight</th>
                <th style={{ padding: '8px' }}>Pmax</th>
                <th style={{ padding: '8px' }}>% of MAP</th>
                <th style={{ padding: '8px' }}>Velocity (V₀)</th>
                <th style={{ padding: '8px' }}>Fill Ratio</th>
                <th style={{ padding: '8px' }}>Burned %</th>
                <th style={{ padding: '8px' }}>Barrel Time</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Safety Status</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => {
                const isCurrent = Math.abs(s.charge_grains - currentCharge) < 0.05;
                const margin = ((s.max_pressure_bar / mapPressureBar) * 100).toFixed(1);

                return (
                  <tr
                    key={s.charge_grains}
                    onClick={() => onSelectCharge(s.charge_grains)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isCurrent ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <td style={{ padding: '8px', textAlign: 'left', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--accent-cyan)' : 'inherit' }}>
                      {formatWeight(s.charge_grains, 1, isMetric)} {isCurrent ? '◄ Active' : ''}
                    </td>
                    <td style={{ padding: '8px', color: s.status === 'danger' ? 'var(--status-danger)' : 'inherit' }}>
                      {formatPressure(s.max_pressure_bar, isMetric)}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>
                      {margin}%
                    </td>
                    <td style={{ padding: '8px', color: 'var(--accent-cyan)' }}>
                      {formatVelocity(s.muzzle_velocity_fps, isMetric)}
                    </td>
                    <td style={{ padding: '8px', color: s.fill_ratio_pct > 100 ? 'var(--status-caution)' : 'inherit' }}>
                      {s.fill_ratio_pct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px' }}>
                      {s.burn_pct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px' }}>
                      {s.barrel_time_ms.toFixed(4)} ms
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {s.status === 'safe' && (
                        <span style={{ color: 'var(--status-safe)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> Safe
                        </span>
                      )}
                      {s.status === 'caution' && (
                        <span style={{ color: 'var(--status-caution)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Near Max
                        </span>
                      )}
                      {s.status === 'danger' && (
                        <span style={{ color: 'var(--status-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                          <ShieldAlert size={12} /> Danger
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} style={btnSecondaryStyle}>Close</button>
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
