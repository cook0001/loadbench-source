import React from 'react';
import { X, Search } from 'lucide-react';
import { PropellantRankingItem } from '../../types/ballistics';
import { PropellantSpec } from '../../types/propellant';
import { formatPressure, formatVelocity, formatWeight } from '../../utils/formatters';

interface PowderCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ranking: PropellantRankingItem[];
  propellants: PropellantSpec[];
  onSelectPropellantAndCharge: (propellant: PropellantSpec, charge: number) => void;
  isMetric: boolean;
}

export const PowderCompareModal: React.FC<PowderCompareModalProps> = ({
  isOpen,
  onClose,
  ranking,
  propellants,
  onSelectPropellantAndCharge,
  isMetric,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Propellant Ranking Matrix (Max Velocity at Pmax)
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Each powder is simulated up to ~98% of maximum allowable chamber pressure (Pmax). Sorted descending by highest achievable muzzle velocity. Click <strong>Load Recipe</strong> to apply to your workbench.
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
                <th style={{ padding: '8px', textAlign: 'left' }}>Propellant</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Brand</th>
                <th style={{ padding: '8px' }}>Max Safe Velocity</th>
                <th style={{ padding: '8px' }}>Charge at Pmax</th>
                <th style={{ padding: '8px' }}>Pressure</th>
                <th style={{ padding: '8px' }}>Fill Ratio</th>
                <th style={{ padding: '8px' }}>Burn %</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, index) => {
                const propObj = propellants.find(p => p.id === item.propellant_id);

                return (
                  <tr
                    key={item.propellant_id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: index === 0 ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: index === 0 ? 'var(--status-safe)' : 'var(--text-primary)' }}>
                      {item.propellant_name} {index === 0 ? '★ Top Performer' : ''}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'left', color: 'var(--text-muted)' }}>
                      {item.manufacturer}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '12px' }}>
                      {formatVelocity(item.max_velocity_fps, isMetric)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {formatWeight(item.charge_at_pmax_grains, 1, isMetric)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {formatPressure(item.pressure_bar, isMetric)}
                    </td>
                    <td style={{ padding: '8px', color: item.fill_ratio_pct > 100 ? 'var(--status-caution)' : 'inherit' }}>
                      {item.fill_ratio_pct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px' }}>
                      {item.burn_pct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          if (propObj) {
                            onSelectPropellantAndCharge(propObj, item.charge_at_pmax_grains);
                            onClose();
                          }
                        }}
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--accent-cyan)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Load Recipe
                      </button>
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
