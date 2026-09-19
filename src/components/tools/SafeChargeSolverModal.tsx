import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Activity,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Target,
  Gauge,
  Sparkles,
  Sliders,
  Info,
  Check,
  TrendingUp,
} from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';
import { BallisticsInput } from '../../utils/ballisticsEngine';
import {
  computeSafeChargeEnvelope,
  solveChargeForVelocity,
  solveChargeForPressure,
  solveChargeForFillRatio,
  SolvedLoadPoint,
} from '../../utils/chargeSolverEngine';
import { formatPressure, formatVelocity, formatWeight } from '../../utils/formatters';

interface SafeChargeSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  currentChargeGrains: number;
  barrelLengthInches: number;
  seatingDepthInches: number;
  primer?: PrimerSpec;
  powderTemperatureF?: number;
  isTouchingLands?: boolean;
  baOffsetPct?: number;
  onApplyCharge: (chargeGrains: number) => void;
  isMetric: boolean;
}

type SolverTab = 'envelope' | 'target_solver' | 'ladder';
type TargetMode = 'velocity' | 'pressure' | 'fill';

export const SafeChargeSolverModal: React.FC<SafeChargeSolverModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  currentChargeGrains,
  barrelLengthInches,
  seatingDepthInches,
  primer,
  powderTemperatureF = 70,
  isTouchingLands = false,
  baOffsetPct = 0,
  onApplyCharge,
  isMetric,
}) => {
  const [activeTab, setActiveTab] = useState<SolverTab>('envelope');
  const [targetMode, setTargetMode] = useState<TargetMode>('velocity');

  // Input states for reverse target solver
  const [targetVelocityInput, setTargetVelocityInput] = useState<number>(2750);
  const [targetPressurePsiInput, setTargetPressurePsiInput] = useState<number>(55000);
  const [targetFillPctInput, setTargetFillPctInput] = useState<number>(98.0);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Compute Base Ballistics Input
  const baseInput: BallisticsInput = useMemo(() => ({
    cartridge,
    projectile,
    propellant,
    chargeGrains: currentChargeGrains,
    barrelLengthInches,
    seatingDepthInches,
    shotStartPressureBar: projectile.shot_start_pressure_bar,
    baOffsetPct,
    primer,
    powderTemperatureF,
    isTouchingLands,
  }), [cartridge, projectile, propellant, currentChargeGrains, barrelLengthInches, seatingDepthInches, baOffsetPct, primer, powderTemperatureF, isTouchingLands]);

  // Compute Safe Charge Envelope
  const envelope = useMemo(() => {
    return computeSafeChargeEnvelope(baseInput);
  }, [baseInput]);

  // Reverse Solver Evaluation based on Active Target Mode
  const targetSolvedPoint = useMemo<SolvedLoadPoint>(() => {
    if (targetMode === 'velocity') {
      const v = isMetric ? targetVelocityInput * 3.28084 : targetVelocityInput;
      return solveChargeForVelocity(baseInput, v);
    } else if (targetMode === 'pressure') {
      const pBar = isMetric ? targetPressurePsiInput : targetPressurePsiInput / 14.5038;
      return solveChargeForPressure(baseInput, pBar);
    } else {
      return solveChargeForFillRatio(baseInput, targetFillPctInput);
    }
  }, [baseInput, targetMode, targetVelocityInput, targetPressurePsiInput, targetFillPctInput, isMetric]);

  const handleApply = (charge: number, label: string) => {
    onApplyCharge(charge);
    setAppliedFeedback(`Applied ${charge.toFixed(1)} gr (${label}) to workbench!`);
    setTimeout(() => setAppliedFeedback(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '880px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--accent-cyan)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Safe Working Range &amp; Charge Solver
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Internal Ballistics Solver
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {cartridge.name} &bull; {projectile.weight_grains} gr {projectile.name} &bull; {propellant.manufacturer} {propellant.name}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Summary Status Ribbon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '11px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span>
              <strong style={{ color: 'var(--text-secondary)' }}>MAP:</strong>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {formatPressure(envelope.mapPressureBar, isMetric)}
              </span>
            </span>
            <span>
              <strong style={{ color: 'var(--text-secondary)' }}>Barrel:</strong>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {barrelLengthInches.toFixed(1)}"
              </span>
            </span>
            <span>
              <strong style={{ color: 'var(--text-secondary)' }}>Safe Range:</strong>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {envelope.startLoad.chargeGrains} gr &ndash; {envelope.maxSafeLoad.chargeGrains} gr
              </span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Active Charge:</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(6, 182, 212, 0.25)',
              }}
            >
              {currentChargeGrains.toFixed(1)} gr
            </span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {appliedFeedback && (
          <div
            style={{
              padding: '6px 16px',
              backgroundColor: 'var(--status-safe-bg)',
              color: 'var(--status-safe)',
              borderBottom: '1px solid var(--status-safe-border)',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} />
            <span>{appliedFeedback}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '0 16px',
            gap: '4px',
          }}
        >
          <button
            onClick={() => setActiveTab('envelope')}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: activeTab === 'envelope' ? 700 : 500,
              color: activeTab === 'envelope' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'envelope' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Gauge size={14} />
            <span>Safe Range &amp; Sweet Spot</span>
          </button>

          <button
            onClick={() => setActiveTab('target_solver')}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: activeTab === 'target_solver' ? 700 : 500,
              color: activeTab === 'target_solver' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'target_solver' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Target size={14} />
            <span>Reverse Target Solver</span>
          </button>

          <button
            onClick={() => setActiveTab('ladder')}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: activeTab === 'ladder' ? 700 : 500,
              color: activeTab === 'ladder' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'ladder' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sliders size={14} />
            <span>Workup Stepping Ladder</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', gap: '14px' }}>
          {/* TAB 1: SAFE RANGE & SWEET SPOT */}
          {activeTab === 'envelope' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 4 Hero Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '10px',
                }}
              >
                {/* 1. Minimum Starting Load */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Starting Load (-10%)
                      </span>
                      <ShieldCheck size={14} color="var(--status-safe)" />
                    </div>
                    <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {envelope.startLoad.chargeGrains} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>gr</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {formatVelocity(envelope.startLoad.result.muzzle_velocity_fps, isMetric)} &bull; {formatPressure(envelope.startLoad.result.max_pressure_bar, isMetric)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Fill: {envelope.startLoad.result.loading_density_pct.toFixed(1)}% &bull; Burn: {envelope.startLoad.result.propellant_burnt_pct.toFixed(1)}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApply(envelope.startLoad.chargeGrains, 'Starting Load')}
                    className="btn btn-action"
                    style={{ fontSize: '11px', padding: '4px 8px', justifyContent: 'center' }}
                  >
                    Apply Starting Load
                  </button>
                </div>

                {/* 2. OBT Sweet Spot Node */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--status-safe)', textTransform: 'uppercase' }}>
                        OBT Sweet Spot Node
                      </span>
                      <Sparkles size={14} color="var(--status-safe)" />
                    </div>
                    <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--status-safe)', marginTop: '4px' }}>
                      {envelope.sweetSpotLoad ? (
                        <>
                          {envelope.sweetSpotLoad.chargeGrains}{' '}
                          <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                            gr (Node {envelope.solvedNodes.find(n => n.isRecommendedSweetSpot)?.nodeNumber})
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>None In Range</span>
                      )}
                    </div>
                    {envelope.sweetSpotLoad && (
                      <>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {formatVelocity(envelope.sweetSpotLoad.result.muzzle_velocity_fps, isMetric)} &bull; {formatPressure(envelope.sweetSpotLoad.result.max_pressure_bar, isMetric)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Exit Time: {envelope.sweetSpotLoad.result.barrel_time_ms.toFixed(4)} ms
                        </div>
                      </>
                    )}
                  </div>
                  {envelope.sweetSpotLoad ? (
                    <button
                      type="button"
                      onClick={() => handleApply(envelope.sweetSpotLoad!.chargeGrains, 'OBT Sweet Spot')}
                      className="btn"
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(16, 185, 129, 0.16)',
                        color: 'var(--status-safe)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      Apply Sweet Spot
                    </button>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Nodes lie outside safe window
                    </span>
                  )}
                </div>

                {/* 3. 100% Non-Compressed Fill */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        100% Non-Compressed Fill
                      </span>
                      <Activity size={14} color="var(--accent-cyan)" />
                    </div>
                    <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {envelope.bulkFill100Load.chargeGrains} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>gr</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {formatVelocity(envelope.bulkFill100Load.result.muzzle_velocity_fps, isMetric)} &bull; {formatPressure(envelope.bulkFill100Load.result.max_pressure_bar, isMetric)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Pressure Margin: {envelope.bulkFill100Load.result.pressure_margin_pct.toFixed(1)}% MAP
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApply(envelope.bulkFill100Load.chargeGrains, '100% Fill')}
                    className="btn btn-action"
                    style={{ fontSize: '11px', padding: '4px 8px', justifyContent: 'center' }}
                  >
                    Apply 100% Fill
                  </button>
                </div>

                {/* 4. Maximum Safe Load */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--status-danger)', textTransform: 'uppercase' }}>
                        Max Safe Load (100% MAP)
                      </span>
                      <ShieldAlert size={14} color="var(--status-danger)" />
                    </div>
                    <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--status-danger)', marginTop: '4px' }}>
                      {envelope.maxSafeLoad.chargeGrains} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>gr</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {formatVelocity(envelope.maxSafeLoad.result.muzzle_velocity_fps, isMetric)} &bull; {formatPressure(envelope.maxSafeLoad.result.max_pressure_bar, isMetric)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Fill: {envelope.maxSafeLoad.result.loading_density_pct.toFixed(1)}% &bull; Burn: {envelope.maxSafeLoad.result.propellant_burnt_pct.toFixed(1)}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApply(envelope.maxSafeLoad.chargeGrains, 'Max Safe Load')}
                    className="btn"
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: 'var(--status-danger)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    Apply Max Safe Load
                  </button>
                </div>
              </div>

              {/* Propellant Suitability & Thermochemical Diagnostics Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Propellant Suitability Diagnostics
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        envelope.suitability.verdict === 'optimal'
                          ? 'var(--status-safe-bg)'
                          : envelope.suitability.verdict === 'acceptable'
                          ? 'var(--status-caution-bg)'
                          : 'var(--status-danger-bg)',
                      color:
                        envelope.suitability.verdict === 'optimal'
                          ? 'var(--status-safe)'
                          : envelope.suitability.verdict === 'acceptable'
                          ? 'var(--status-caution)'
                          : 'var(--status-danger)',
                      border: `1px solid ${
                        envelope.suitability.verdict === 'optimal'
                          ? 'var(--status-safe-border)'
                          : envelope.suitability.verdict === 'acceptable'
                          ? 'var(--status-caution-border)'
                          : 'var(--status-danger-border)'
                      }`,
                    }}
                  >
                    {envelope.suitability.verdictLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  {envelope.suitability.diagnostics.map((diag, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={13} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{diag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OBT Nodes Harmonic Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Chris Long OBT Harmonic Nodes for {barrelLengthInches.toFixed(1)}" Barrel
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Click "Apply" on any safe node to sync barrel exit timing
                  </span>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Acoustic Node</th>
                      <th>Target Transit</th>
                      <th>Required Charge</th>
                      <th>Muzzle Velocity</th>
                      <th>Peak Pressure</th>
                      <th>Fill Ratio</th>
                      <th>Harmonic Window</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envelope.solvedNodes.map((n) => {
                      const isSweet = n.isRecommendedSweetSpot;
                      return (
                        <tr
                          key={n.nodeNumber}
                          style={{
                            backgroundColor: isSweet ? 'rgba(16, 185, 129, 0.10)' : undefined,
                          }}
                        >
                          <td style={{ textAlign: 'left', fontWeight: isSweet ? 700 : 500, color: isSweet ? 'var(--status-safe)' : 'inherit' }}>
                            Node {n.nodeNumber} {isSweet ? '★ (Sweet Spot)' : ''}
                          </td>
                          <td>{n.targetTimeMs.toFixed(4)} ms</td>
                          <td style={{ fontWeight: 700, color: isSweet ? 'var(--status-safe)' : 'var(--accent-cyan)' }}>
                            {n.chargeGrains.toFixed(1)} gr
                          </td>
                          <td>{formatVelocity(n.muzzleVelocityFps, isMetric)}</td>
                          <td style={{ color: n.status === 'danger' ? 'var(--status-danger)' : undefined }}>
                            {formatPressure(n.maxPressureBar, isMetric)} ({n.pressureMarginPct.toFixed(0)}%)
                          </td>
                          <td>{n.fillRatioPct.toFixed(1)}%</td>
                          <td>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '3px',
                                backgroundColor: n.inSafeRange ? 'var(--status-safe-bg)' : 'var(--status-danger-bg)',
                                color: n.inSafeRange ? 'var(--status-safe)' : 'var(--status-danger)',
                              }}
                            >
                              {n.inSafeRange ? 'In Safe Range' : 'Out of Bounds'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleApply(n.chargeGrains, `OBT Node ${n.nodeNumber}`)}
                              className="badge-btn"
                              style={{
                                backgroundColor: isSweet ? 'rgba(16, 185, 129, 0.2)' : undefined,
                                borderColor: isSweet ? 'var(--status-safe)' : undefined,
                                color: isSweet ? 'var(--status-safe)' : undefined,
                              }}
                            >
                              Apply
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: REVERSE TARGET SOLVER */}
          {activeTab === 'target_solver' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Reverse-solve the exact charge weight needed to achieve a target velocity, chamber pressure, or non-compressed case fill.
              </div>

              {/* Mode Selector Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTargetMode('velocity')}
                  className={targetMode === 'velocity' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  <TrendingUp size={13} />
                  <span>Solve by Target Velocity</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('pressure')}
                  className={targetMode === 'pressure' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  <Gauge size={13} />
                  <span>Solve by Target Pressure</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('fill')}
                  className={targetMode === 'fill' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  <Activity size={13} />
                  <span>Solve by Case Fill Ratio</span>
                </button>
              </div>

              {/* Interactive Target Input Area */}
              <div
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {targetMode === 'velocity' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="input-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Target Muzzle Velocity ({isMetric ? 'm/s' : 'fps'})
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        className="input-control"
                        value={targetVelocityInput}
                        onChange={(e) => setTargetVelocityInput(Number(e.target.value) || 0)}
                        style={{ width: '140px', fontSize: '15px', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isMetric ? 'm/s' : 'fps'}</span>

                      <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                        {[2600, 2700, 2750, 2800, 2850].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setTargetVelocityInput(isMetric ? Math.round(v * 0.3048) : v)}
                            className="badge-btn"
                          >
                            {isMetric ? Math.round(v * 0.3048) : v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {targetMode === 'pressure' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="input-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Target Peak Chamber Pressure ({isMetric ? 'bar' : 'psi'})
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        className="input-control"
                        value={targetPressurePsiInput}
                        onChange={(e) => setTargetPressurePsiInput(Number(e.target.value) || 0)}
                        style={{ width: '140px', fontSize: '15px', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isMetric ? 'bar' : 'psi'}</span>

                      <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                        {[0.80, 0.85, 0.90, 0.95, 1.0].map((ratio) => {
                          const val = isMetric
                            ? Math.round(envelope.mapPressureBar * ratio)
                            : Math.round(envelope.mapPressurePsi * ratio);
                          return (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setTargetPressurePsiInput(val)}
                              className="badge-btn"
                            >
                              {(ratio * 100).toFixed(0)}% MAP
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {targetMode === 'fill' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="input-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Target Powder Filling Ratio (%)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        step="0.5"
                        className="input-control"
                        value={targetFillPctInput}
                        onChange={(e) => setTargetFillPctInput(Number(e.target.value) || 0)}
                        style={{ width: '140px', fontSize: '15px', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>

                      <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                        {[90, 95, 98, 100, 102, 105].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setTargetFillPctInput(pct)}
                            className="badge-btn"
                          >
                            {pct}% {pct > 100 ? '(Compressed)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Solved Output Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: `1px solid ${
                    targetSolvedPoint.result.pressure_status === 'danger'
                      ? 'var(--status-danger-border)'
                      : targetSolvedPoint.result.pressure_status === 'caution'
                      ? 'var(--status-caution-border)'
                      : 'rgba(6, 182, 212, 0.4)'
                  }`,
                  borderRadius: '6px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Calculated Reverse-Solve Solution
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        targetSolvedPoint.result.pressure_status === 'danger'
                          ? 'var(--status-danger-bg)'
                          : targetSolvedPoint.result.pressure_status === 'caution'
                          ? 'var(--status-caution-bg)'
                          : 'var(--status-safe-bg)',
                      color:
                        targetSolvedPoint.result.pressure_status === 'danger'
                          ? 'var(--status-danger)'
                          : targetSolvedPoint.result.pressure_status === 'caution'
                          ? 'var(--status-caution)'
                          : 'var(--status-safe)',
                    }}
                  >
                    {targetSolvedPoint.result.pressure_status === 'danger'
                      ? 'OVERPRESSURE'
                      : targetSolvedPoint.result.pressure_status === 'caution'
                      ? 'NEAR MAXIMUM (CAUTION)'
                      : 'SAFE PRESSURE'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    padding: '10px 0',
                    borderTop: '1px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Required Charge</div>
                    <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {targetSolvedPoint.chargeGrains.toFixed(1)}{' '}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>gr</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Simulated Velocity</div>
                    <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatVelocity(targetSolvedPoint.result.muzzle_velocity_fps, isMetric)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chamber Pressure</div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: targetSolvedPoint.result.pressure_status === 'danger' ? 'var(--status-danger)' : 'var(--text-primary)',
                      }}
                    >
                      {formatPressure(targetSolvedPoint.result.max_pressure_bar, isMetric)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {targetSolvedPoint.result.pressure_margin_pct.toFixed(1)}% of MAP
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fill &amp; Burn</div>
                    <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {targetSolvedPoint.result.loading_density_pct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Burned: {targetSolvedPoint.result.propellant_burnt_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleApply(targetSolvedPoint.chargeGrains, 'Target Solved Load')}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 16px' }}
                  >
                    Apply Solved Charge ({targetSolvedPoint.chargeGrains.toFixed(1)} gr) to Workbench
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORKUP STEPPING LADDER */}
          {activeTab === 'ladder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Incremental workup ladder spanning the full safe working range. Click any row to load that charge into the workbench.
              </div>

              <table className="ladder-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Charge</th>
                    <th>Pmax</th>
                    <th>% MAP</th>
                    <th>Velocity (V₀)</th>
                    <th>Fill Ratio</th>
                    <th>Burn %</th>
                    <th>Barrel Time</th>
                    <th>OBT Node</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {envelope.ladderSteps.map((step) => {
                    const isCurrent = Math.abs(step.chargeGrains - currentChargeGrains) < 0.05;
                    const isSweet = step.isSweetSpot;

                    return (
                      <tr
                        key={step.chargeGrains}
                        onClick={() => handleApply(step.chargeGrains, 'Ladder Step')}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isCurrent
                            ? 'rgba(6, 182, 212, 0.14)'
                            : isSweet
                            ? 'rgba(16, 185, 129, 0.08)'
                            : undefined,
                        }}
                      >
                        <td
                          style={{
                            textAlign: 'left',
                            fontWeight: isCurrent || isSweet ? 700 : 500,
                            color: isCurrent
                              ? 'var(--accent-cyan)'
                              : isSweet
                              ? 'var(--status-safe)'
                              : 'inherit',
                          }}
                        >
                          {formatWeight(step.chargeGrains, 1, isMetric)}
                          {isCurrent ? ' ◄ Active' : ''}
                          {step.isStartingLoad ? ' (Start)' : ''}
                          {step.isMaxSafeLoad ? ' (Max)' : ''}
                        </td>
                        <td style={{ color: step.status === 'danger' ? 'var(--status-danger)' : undefined }}>
                          {formatPressure(step.maxPressureBar, isMetric)}
                        </td>
                        <td style={{ fontWeight: 600 }}>{step.pressureMarginPct.toFixed(1)}%</td>
                        <td style={{ color: 'var(--accent-cyan)' }}>
                          {formatVelocity(step.muzzleVelocityFps, isMetric)}
                        </td>
                        <td style={{ color: step.fillRatioPct > 100 ? 'var(--status-caution)' : undefined }}>
                          {step.fillRatioPct.toFixed(1)}%
                        </td>
                        <td>{step.burnPct.toFixed(1)}%</td>
                        <td>{step.barrelTimeMs.toFixed(4)} ms</td>
                        <td>
                          {step.nearestNodeNumber ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: isSweet ? 'var(--status-safe)' : 'var(--text-muted)',
                              }}
                            >
                              Node {step.nearestNodeNumber} ({step.nearestNodeDeltaMs! > 0 ? `+${step.nearestNodeDeltaMs}` : step.nearestNodeDeltaMs} ms)
                            </span>
                          ) : (
                            '─'
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor:
                                step.status === 'danger'
                                  ? 'var(--status-danger-bg)'
                                  : step.status === 'caution'
                                  ? 'var(--status-caution-bg)'
                                  : 'var(--status-safe-bg)',
                              color:
                                step.status === 'danger'
                                  ? 'var(--status-danger)'
                                  : step.status === 'caution'
                                  ? 'var(--status-caution)'
                                  : 'var(--status-safe)',
                            }}
                          >
                            {step.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Interior ballistics &amp; OBT acoustic wave harmonic solver.
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: '11px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
