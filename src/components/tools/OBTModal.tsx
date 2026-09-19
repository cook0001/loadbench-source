import React from 'react';
import { X, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { OBTNode } from '../../types/ballistics';

interface OBTModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: OBTNode[];
  barrelLengthInches: number;
  currentBarrelTimeMs: number;
}

export const OBTModal: React.FC<OBTModalProps> = ({
  isOpen,
  onClose,
  nodes,
  barrelLengthInches,
  currentBarrelTimeMs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Chris Long Optimal Barrel Time (OBT) Harmonics
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            OBT models acoustic shockwave reflection in the barrel steel (~5,000 m/s). Minimal muzzle vibration and tightest group dispersion occur when the bullet exits during a wave harmonic node (Nodes 1 through 7).
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Barrel Length</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{barrelLengthInches.toFixed(1)}"</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Load Barrel Time</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {currentBarrelTimeMs.toFixed(4)} ms
              </div>
            </div>
          </div>

          <table className="ladder-table" style={{
            textAlign: 'right',
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
              }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Acoustic Node</th>
                <th style={{ padding: '8px' }}>Target Exit Time</th>
                <th style={{ padding: '8px' }}>Current Delta (Δ)</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Harmonic Alignment</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => {
                const absDelta = Math.abs(node.delta_ms);
                const isExact = node.status === 'exact';
                const isNear = node.status === 'near';

                return (
                  <tr
                    key={node.node_number}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isExact ? 'rgba(16, 185, 129, 0.12)' : (isNear ? 'rgba(245, 158, 11, 0.08)' : 'transparent'),
                    }}
                  >
                    <td style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>
                      Node {node.node_number}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {node.target_time_ms.toFixed(4)} ms
                    </td>
                    <td style={{ padding: '8px', color: isExact ? 'var(--status-safe)' : (isNear ? 'var(--status-caution)' : 'var(--text-muted)') }}>
                      {node.delta_ms > 0 ? `+${node.delta_ms.toFixed(4)}` : `${node.delta_ms.toFixed(4)}`} ms
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {isExact && (
                        <span style={{ color: 'var(--status-safe)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                          <CheckCircle2 size={12} /> ON NODE SWEET SPOT
                        </span>
                      )}
                      {isNear && (
                        <span style={{ color: 'var(--status-caution)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Near Node (±{absDelta.toFixed(3)} ms)
                        </span>
                      )}
                      {!isExact && !isNear && (
                        <span style={{ color: 'var(--text-muted)' }}>Off Harmonic</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

