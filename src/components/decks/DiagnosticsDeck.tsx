import React from 'react';
import { Gauge, Zap, Wind, Timer, Flame, Shield, Compass } from 'lucide-react';
import { SimulationResult } from '../../types/ballistics';
import { formatPressure, formatVelocity, formatEnergy, formatLength } from '../../utils/formatters';

interface DiagnosticsDeckProps {
  result: SimulationResult;
  mapPressureBar: number;
  isMetric: boolean;
  recoilEnergyFtLbs?: number;
  recoilVelocityFps?: number;
  stabilitySg?: number;
  onOpenRecoil?: () => void;
  onOpenTrajectory?: () => void;
}

export const DiagnosticsDeck: React.FC<DiagnosticsDeckProps> = ({
  result,
  mapPressureBar,
  isMetric,
  recoilEnergyFtLbs,
  recoilVelocityFps,
  stabilitySg,
  onOpenRecoil,
  onOpenTrajectory,
}) => {
  const getStatusClass = () => {
    switch (result.pressure_status) {
      case 'danger':
        return 'status-danger';
      case 'caution':
        return 'status-caution';
      default:
        return 'status-safe';
    }
  };

  const getStabilityColor = (sg?: number) => {
    if (!sg) return 'var(--text-secondary)';
    if (sg >= 1.5) return 'var(--status-safe)';
    if (sg >= 1.0) return 'var(--status-caution)';
    return 'var(--status-danger)';
  };

  const getStabilityLabel = (sg?: number) => {
    if (!sg) return 'Twist solver ready';
    if (sg >= 1.5) return 'Optimum stability';
    if (sg >= 1.3) return 'Fully stable';
    if (sg >= 1.0) return 'Marginal stability';
    return 'Unstable (Tumbling)';
  };

  return (
    <div className="diagnostics-grid">
      {/* 1. Maximum Pressure */}
      <div className={`diag-card ${getStatusClass()}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Peak Pressure (Pmax)</span>
          <Gauge size={14} />
        </div>
        <div className="diag-value" style={{ color: 'inherit' }}>
          {formatPressure(result.max_pressure_bar, isMetric)}
        </div>
        <div className="diag-sub">
          {result.pressure_margin_pct}% of MAP ({formatPressure(mapPressureBar, isMetric)})
        </div>
      </div>

      {/* 2. Muzzle Velocity */}
      <div className="diag-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Muzzle Velocity (V₀)</span>
          <Zap size={14} color="var(--accent-cyan)" />
        </div>
        <div className="diag-value" style={{ color: 'var(--accent-cyan)' }}>
          {formatVelocity(result.muzzle_velocity_fps, isMetric)}
        </div>
        <div className="diag-sub">
          {isMetric ? `${result.muzzle_velocity_fps} fps` : `${result.muzzle_velocity_mps} m/s`}
        </div>
      </div>

      {/* 3. Muzzle Kinetic Energy */}
      <div className="diag-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Muzzle Energy (E₀)</span>
          <Zap size={14} color="var(--accent-blue)" />
        </div>
        <div className="diag-value">
          {formatEnergy(result.muzzle_energy_ft_lbs, isMetric)}
        </div>
        <div className="diag-sub">
          Efficiency: <strong>{result.ballistic_efficiency_pct}%</strong>
        </div>
      </div>

      {/* 4. Barrel Transit Time */}
      <div className="diag-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Barrel Time (Lock-Exit)</span>
          <Timer size={14} color="var(--accent-indigo)" />
        </div>
        <div className="diag-value" style={{ color: 'var(--accent-indigo)' }}>
          {result.barrel_time_ms.toFixed(4)} ms
        </div>
        <div className="diag-sub">
          Peak at: {result.max_pressure_time_ms.toFixed(3)} ms ({formatLength(result.max_pressure_travel_in, 2, isMetric)})
        </div>
      </div>

      {/* 5. Propellant Burned at Muzzle */}
      <div className="diag-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Powder Burned</span>
          <Flame size={14} color="#f97316" />
        </div>
        <div className="diag-value" style={{ color: result.propellant_burnt_pct < 95 ? 'var(--status-caution)' : 'var(--text-primary)' }}>
          {result.propellant_burnt_pct}%
        </div>
        <div className="diag-sub">
          {result.propellant_burnt_pct < 95 ? 'Unburned powder flash' : 'Complete clean combustion'}
        </div>
      </div>

      {/* 6. Muzzle Exit Pressure */}
      <div className="diag-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Muzzle Blast Pressure</span>
          <Wind size={14} color="var(--text-secondary)" />
        </div>
        <div className="diag-value">
          {formatPressure(result.muzzle_pressure_bar, isMetric)}
        </div>
        <div className="diag-sub">
          Exit port pressure
        </div>
      </div>

      {/* 7. Free Recoil Energy */}
      <div 
        className="diag-card" 
        onClick={onOpenRecoil} 
        style={{ cursor: onOpenRecoil ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
        title="Click to open Free Recoil Laboratory"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Free Recoil</span>
          <Shield size={14} color="var(--accent-amber)" />
        </div>
        <div className="diag-value" style={{ color: 'var(--accent-amber)' }}>
          {recoilEnergyFtLbs !== undefined ? formatEnergy(recoilEnergyFtLbs, isMetric) : '--'}
        </div>
        <div className="diag-sub">
          {recoilVelocityFps !== undefined ? `Vel: ${recoilVelocityFps.toFixed(1)} fps` : 'Recoil engine'}
        </div>
      </div>

      {/* 8. Gyroscopic Stability Sg */}
      <div 
        className="diag-card" 
        onClick={onOpenTrajectory} 
        style={{ cursor: onOpenTrajectory ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
        title="Click to open Downrange Trajectory & Ballistics Table"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="diag-title">Stability (Sg)</span>
          <Compass size={14} color={getStabilityColor(stabilitySg)} />
        </div>
        <div className="diag-value" style={{ color: getStabilityColor(stabilitySg) }}>
          {stabilitySg !== undefined ? `Sg ${stabilitySg.toFixed(2)}` : '--'}
        </div>
        <div className="diag-sub" style={{ color: getStabilityColor(stabilitySg) }}>
          {getStabilityLabel(stabilitySg)}
        </div>
      </div>
    </div>
  );
};
