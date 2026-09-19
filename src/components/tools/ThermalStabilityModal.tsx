import React, { useState, useMemo } from 'react';
import { X, Thermometer, Flame, Snowflake, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';
import { simulateInteriorBallistics } from '../../utils/ballisticsEngine';

interface ThermalStabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  barrelLengthInches: number;
  seatingDepthInches: number;
  primer: PrimerSpec;
  currentTempF: number;
  onApplyTemp?: (tempF: number) => void;
  isMetric: boolean;
}

export const ThermalStabilityModal: React.FC<ThermalStabilityModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  chargeGrains,
  barrelLengthInches,
  seatingDepthInches,
  primer,
  currentTempF,
  onApplyTemp,
  isMetric: _isMetric,
}) => {
  const [customTempF, setCustomTempF] = useState<number>(currentTempF);

  // Baseline at 70°F
  const baseSim = useMemo(() => {
    return simulateInteriorBallistics({
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      barrelLengthInches,
      seatingDepthInches,
      shotStartPressureBar: projectile.shot_start_pressure_bar,
      primer,
      powderTemperatureF: 70,
    });
  }, [cartridge, projectile, propellant, chargeGrains, barrelLengthInches, seatingDepthInches, primer]);

  // Temperature Ladder points: -20°F to 135°F
  const tempPoints = [-20, 0, 32, 50, 70, 90, 110, 125, 140];

  const thermalLadder = useMemo(() => {
    return tempPoints.map(temp => {
      const sim = simulateInteriorBallistics({
        cartridge,
        projectile,
        propellant,
        chargeGrains,
        barrelLengthInches,
        seatingDepthInches,
        shotStartPressureBar: projectile.shot_start_pressure_bar,
        primer,
        powderTemperatureF: temp,
      });

      const mapBar = cartridge.max_pressure_bar;
      const pctMap = (sim.max_pressure_bar / mapBar) * 100;
      const velDelta = sim.muzzle_velocity_fps - baseSim.muzzle_velocity_fps;
      const pressDeltaPsi = sim.max_pressure_psi - baseSim.max_pressure_psi;

      return {
        tempF: temp,
        tempC: Math.round((temp - 32) * (5 / 9)),
        sim,
        pctMap,
        velDelta,
        pressDeltaPsi,
        isOverpressure: pctMap >= 100,
        isWarning: pctMap >= 95 && pctMap < 100,
      };
    });
  }, [cartridge, projectile, propellant, chargeGrains, barrelLengthInches, seatingDepthInches, primer, baseSim]);

  // Selected Interactive Temp simulation
  const selectedTempSim = useMemo(() => {
    const sim = simulateInteriorBallistics({
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      barrelLengthInches,
      seatingDepthInches,
      shotStartPressureBar: projectile.shot_start_pressure_bar,
      primer,
      powderTemperatureF: customTempF,
    });
    const mapBar = cartridge.max_pressure_bar;
    const pctMap = (sim.max_pressure_bar / mapBar) * 100;
    const velDelta = sim.muzzle_velocity_fps - baseSim.muzzle_velocity_fps;
    const pressDeltaPsi = sim.max_pressure_psi - baseSim.max_pressure_psi;

    return {
      tempF: customTempF,
      sim,
      pctMap,
      velDelta,
      pressDeltaPsi,
      isOverpressure: pctMap >= 100,
      isWarning: pctMap >= 95 && pctMap < 100,
    };
  }, [cartridge, projectile, propellant, chargeGrains, barrelLengthInches, seatingDepthInches, primer, customTempF, baseSim]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '880px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Thermometer size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Thermal Stability &amp; Temperature Drift Analyzer
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({propellant.name})
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Interactive Temperature Slider & Warning Card */}
          <div
            style={{
              backgroundColor: selectedTempSim.isOverpressure
                ? 'rgba(255, 68, 68, 0.12)'
                : selectedTempSim.isWarning
                ? 'rgba(255, 152, 0, 0.12)'
                : 'var(--bg-tertiary)',
              border: `1px solid ${
                selectedTempSim.isOverpressure
                  ? 'var(--accent-red)'
                  : selectedTempSim.isWarning
                  ? 'var(--accent-orange)'
                  : 'var(--border-color)'
              }`,
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {customTempF >= 100 ? (
                  <Flame size={20} color="var(--accent-red)" />
                ) : customTempF <= 32 ? (
                  <Snowflake size={20} color="var(--accent-cyan)" />
                ) : (
                  <Thermometer size={20} color="var(--accent-green)" />
                )}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {customTempF}°F ({Math.round((customTempF - 32) * (5 / 9))}°C) Ambient Temperature
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Baseline Reference: 70°F ({Math.round(baseSim.muzzle_velocity_fps)} fps &bull; {Math.round(baseSim.max_pressure_psi).toLocaleString()} psi)
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: selectedTempSim.isOverpressure
                    ? 'rgba(255, 68, 68, 0.2)'
                    : selectedTempSim.isWarning
                    ? 'rgba(255, 152, 0, 0.2)'
                    : 'rgba(0, 230, 118, 0.15)',
                  color: selectedTempSim.isOverpressure
                    ? 'var(--accent-red)'
                    : selectedTempSim.isWarning
                    ? 'var(--accent-orange)'
                    : 'var(--accent-green)',
                }}
              >
                {selectedTempSim.isOverpressure ? (
                  <>
                    <ShieldAlert size={14} /> DANGER: OVERPRESSURE ({selectedTempSim.pctMap.toFixed(1)}% MAP)
                  </>
                ) : selectedTempSim.isWarning ? (
                  <>
                    <AlertTriangle size={14} /> CAUTION: NEAR MAP ({selectedTempSim.pctMap.toFixed(1)}%)
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> SAFE OPERATING MARGIN ({selectedTempSim.pctMap.toFixed(1)}%)
                  </>
                )}
              </div>
            </div>

            {/* Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>-20°F</span>
              <input
                type="range"
                min="-20"
                max="140"
                step="5"
                value={customTempF}
                onChange={(e) => setCustomTempF(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: customTempF >= 100 ? '#ff4444' : '#00d2ff' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>140°F</span>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Velocity at {customTempF}°F</div>
                <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {Math.round(selectedTempSim.sim.muzzle_velocity_fps)} fps
                </div>
                <div style={{ fontSize: '10px', color: selectedTempSim.velDelta >= 0 ? 'var(--accent-orange)' : 'var(--accent-cyan)' }}>
                  {selectedTempSim.velDelta >= 0 ? `+${selectedTempSim.velDelta.toFixed(0)}` : selectedTempSim.velDelta.toFixed(0)} fps vs 70°F
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Peak Pressure</div>
                <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {Math.round(selectedTempSim.sim.max_pressure_psi).toLocaleString()} psi
                </div>
                <div style={{ fontSize: '10px', color: selectedTempSim.pressDeltaPsi >= 0 ? 'var(--accent-orange)' : 'var(--accent-cyan)' }}>
                  {selectedTempSim.pressDeltaPsi >= 0 ? `+${selectedTempSim.pressDeltaPsi.toFixed(0)}` : selectedTempSim.pressDeltaPsi.toFixed(0)} psi
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Safety Margin</div>
                <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedTempSim.isOverpressure ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                  {(100 - selectedTempSim.pctMap).toFixed(1)}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  MAP: {Math.round(cartridge.max_pressure_bar * 14.5038).toLocaleString()} psi
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Burn Completion</div>
                <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {selectedTempSim.sim.propellant_burnt_pct.toFixed(1)}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  At barrel muzzle
                </div>
              </div>
            </div>
          </div>

          {/* Temperature Spectrum Table */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <table className="data-table" style={{ textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Temperature</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Muzzle Velocity</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Vel Shift (&Delta;)</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Chamber Pressure</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'center' }}>% of MAP</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Safety Assessment</th>
                </tr>
              </thead>
              <tbody>
                {thermalLadder.map((row) => (
                  <tr
                    key={row.tempF}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: row.tempF === customTempF ? 'rgba(0, 210, 255, 0.08)' : row.tempF === 70 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                      fontWeight: row.tempF === 70 || row.tempF === customTempF ? 600 : 400,
                    }}
                  >
                    <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: row.tempF >= 90 ? 'var(--accent-orange)' : row.tempF <= 32 ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {row.tempF}°F
                      </span>{' '}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({row.tempC}°C)</span>
                      {row.tempF === 70 && <span style={{ fontSize: '10px', color: 'var(--accent-gold)', marginLeft: '6px' }}>(Base)</span>}
                    </td>

                    <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(row.sim.muzzle_velocity_fps)} fps
                    </td>

                    <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      <span style={{ color: row.velDelta > 0 ? 'var(--accent-orange)' : row.velDelta < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                        {row.velDelta > 0 ? `+${row.velDelta.toFixed(0)}` : row.velDelta.toFixed(0)} fps
                      </span>
                    </td>

                    <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(row.sim.max_pressure_psi).toLocaleString()} psi
                    </td>

                    <td style={{ padding: '7px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: row.isOverpressure ? 'var(--accent-red)' : row.isWarning ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                        {row.pctMap.toFixed(1)}%
                      </span>
                    </td>

                    <td style={{ padding: '7px 12px', textAlign: 'center', fontSize: '11px' }}>
                      {row.isOverpressure ? (
                        <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>OVERPRESSURE</span>
                      ) : row.isWarning ? (
                        <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>NEAR MAX</span>
                      ) : (
                        <span style={{ color: 'var(--accent-green)' }}>Safe</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Handloader Tip Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
            }}
          >
            <strong style={{ color: 'var(--accent-cyan)' }}>Handloader Safety Note on Summer Direct Sunlight:</strong> Ammunition left sitting on an outdoor shooting bench in 90°F ambient weather can heat up to <strong>130°F–145°F</strong> internally inside the brass case and chamber. A load developed near maximum pressure in cool spring weather (55°F) can spike directly into catastrophic overpressure under direct summer sun.
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onApplyTemp && (
            <button
              onClick={() => {
                onApplyTemp(customTempF);
                onClose();
              }}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Set Active Workstation Temp to {customTempF}°F
            </button>
          )}
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
