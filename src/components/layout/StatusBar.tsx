import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cpu, Link2 } from 'lucide-react';
import { SafetyStatus } from '../../types/ballistics';

interface StatusBarProps {
  status: SafetyStatus;
  maxPressureBar: number;
  mapPressureBar: number;
  calcTimeMs: number;
  cartridgeName: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  maxPressureBar,
  mapPressureBar,
  calcTimeMs,
  cartridgeName,
}) => {
  const marginPct = ((maxPressureBar / mapPressureBar) * 100).toFixed(1);

  return (
    <footer style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 16px',
      backgroundColor: 'var(--bg-tertiary)',
      borderTop: '1px solid var(--border-color)',
      fontSize: '11px',
      color: 'var(--text-secondary)',
      userSelect: 'none',
    }}>
      {/* Left: Active Solver & Cartridge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cpu size={12} color="var(--accent-cyan)" />
          <span>Solver: <strong>Noble-Abel RK4 Integrator (dt=1.5µs)</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Link2 size={12} color="var(--accent-blue)" />
          <span>Active Cartridge: <strong>{cartridgeName}</strong></span>
        </div>
      </div>

      {/* Right: Pressure Safety Alert & Latency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {status === 'safe' && (
            <>
              <ShieldCheck size={14} color="var(--status-safe)" />
              <span style={{ color: 'var(--status-safe)', fontWeight: 600 }}>
                SAFE LOAD ({marginPct}% of MAP)
              </span>
            </>
          )}
          {status === 'caution' && (
            <>
              <AlertTriangle size={14} color="var(--status-caution)" />
              <span style={{ color: 'var(--status-caution)', fontWeight: 600 }}>
                NEAR MAXIMUM ({marginPct}% of MAP)
              </span>
            </>
          )}
          {status === 'danger' && (
            <>
              <ShieldAlert size={14} color="var(--status-danger)" />
              <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>
                OVERPRESSURE DANGER ({marginPct}% of MAP)
              </span>
            </>
          )}
        </div>

        <div style={{ color: 'var(--text-muted)' }}>
          Solved in {calcTimeMs.toFixed(2)} ms
        </div>
      </div>
    </footer>
  );
};
