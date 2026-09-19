import React, { useState, useMemo } from 'react';
import { X, GitCompare, ArrowRight } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';
import { simulateInteriorBallistics } from '../../utils/ballisticsEngine';
import { calculateRecoilDynamics } from '../../utils/recoilEngine';
import { calculateDownrangeTrajectory } from '../../utils/trajectoryEngine';

interface CartridgeCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Load A (Active Workbench Load)
  cartridgeA: CartridgeSpec;
  projectileA: ProjectileSpec;
  propellantA: PropellantSpec;
  chargeGrainsA: number;
  barrelLengthA: number;
  primerA: PrimerSpec;
  // Full catalogs for Load B selection
  allCartridges: CartridgeSpec[];
  allProjectiles: ProjectileSpec[];
  allPropellants: PropellantSpec[];
  allPrimers: PrimerSpec[];
  onLoadLoadBIntoWorkbench?: (cartridge: CartridgeSpec, projectile: ProjectileSpec, propellant: PropellantSpec, charge: number, barrel: number) => void;
  isMetric: boolean;
}

export const CartridgeCompareModal: React.FC<CartridgeCompareModalProps> = ({
  isOpen,
  onClose,
  cartridgeA,
  projectileA,
  propellantA,
  chargeGrainsA,
  barrelLengthA,
  primerA,
  allCartridges,
  allProjectiles,
  allPropellants,
  allPrimers,
  onLoadLoadBIntoWorkbench,
  isMetric,
}) => {
  // Load B State
  const [selectedCartridgeBId, setSelectedCartridgeBId] = useState<string>(() => {
    const alt = allCartridges.find(c => c.id !== cartridgeA.id);
    return alt ? alt.id : cartridgeA.id;
  });

  const cartridgeB = useMemo(() => {
    return allCartridges.find(c => c.id === selectedCartridgeBId) || allCartridges[0];
  }, [allCartridges, selectedCartridgeBId]);

  // Matching projectiles for Cartridge B caliber
  const matchingProjectilesB = useMemo(() => {
    return allProjectiles.filter(p => Math.abs(p.caliber_in - cartridgeB.bullet_diameter_in) < 0.005);
  }, [allProjectiles, cartridgeB.bullet_diameter_in]);

  const [selectedProjectileBId, setSelectedProjectileBId] = useState<string>(() => {
    return matchingProjectilesB[0]?.id || allProjectiles[0].id;
  });

  const projectileB = useMemo(() => {
    return (
      allProjectiles.find(p => p.id === selectedProjectileBId) ||
      matchingProjectilesB[0] ||
      allProjectiles[0]
    );
  }, [allProjectiles, matchingProjectilesB, selectedProjectileBId]);

  const [selectedPropellantBId, setSelectedPropellantBId] = useState<string>(propellantA.id);
  const propellantB = useMemo(() => {
    return allPropellants.find(p => p.id === selectedPropellantBId) || allPropellants[0];
  }, [allPropellants, selectedPropellantBId]);

  const [barrelLengthB, setBarrelLengthB] = useState<number>(cartridgeB.default_barrel_length_in);
  const [chargeGrainsB, setChargeGrainsB] = useState<number>(() => {
    return Math.round(cartridgeB.overflow_capacity_gr_h2o * 0.85 * 10) / 10;
  });

  const primerB = useMemo(() => {
    const pocket = cartridgeB.default_primer_pocket || 'large_rifle';
    return allPrimers.find(p => p.id === cartridgeB.default_primer_id) || allPrimers.find(p => p.pocket_size === pocket) || allPrimers[0];
  }, [cartridgeB, allPrimers]);

  // Interior Ballistics Simulation for Load A
  const simA = useMemo(() => {
    return simulateInteriorBallistics({
      cartridge: cartridgeA,
      projectile: projectileA,
      propellant: propellantA,
      chargeGrains: chargeGrainsA,
      barrelLengthInches: barrelLengthA,
      seatingDepthInches: projectileA.default_seating_depth_in,
      shotStartPressureBar: projectileA.shot_start_pressure_bar,
      primer: primerA,
      powderTemperatureF: 70,
    });
  }, [cartridgeA, projectileA, propellantA, chargeGrainsA, barrelLengthA, primerA]);

  // Interior Ballistics Simulation for Load B
  const simB = useMemo(() => {
    return simulateInteriorBallistics({
      cartridge: cartridgeB,
      projectile: projectileB,
      propellant: propellantB,
      chargeGrains: chargeGrainsB,
      barrelLengthInches: barrelLengthB,
      seatingDepthInches: projectileB.default_seating_depth_in,
      shotStartPressureBar: projectileB.shot_start_pressure_bar,
      primer: primerB,
      powderTemperatureF: 70,
    });
  }, [cartridgeB, projectileB, propellantB, chargeGrainsB, barrelLengthB, primerB]);

  // Recoil calculations
  const recoilA = useMemo(() => {
    return calculateRecoilDynamics({
      bulletWeightGrains: projectileA.weight_grains,
      powderChargeGrains: chargeGrainsA,
      muzzleVelocityFps: simA.muzzle_velocity_fps,
      rifleWeightLbs: 9.5,
    });
  }, [projectileA.weight_grains, chargeGrainsA, simA.muzzle_velocity_fps]);

  const recoilB = useMemo(() => {
    return calculateRecoilDynamics({
      bulletWeightGrains: projectileB.weight_grains,
      powderChargeGrains: chargeGrainsB,
      muzzleVelocityFps: simB.muzzle_velocity_fps,
      rifleWeightLbs: 9.5,
    });
  }, [projectileB.weight_grains, chargeGrainsB, simB.muzzle_velocity_fps]);

  // Downrange Trajectory at 500yd and 1000yd
  const trajA = useMemo(() => {
    const res = calculateDownrangeTrajectory({
      muzzleVelocityFps: simA.muzzle_velocity_fps,
      bc: projectileA.bc_g1 || 0.500,
      dragModel: 'G1',
      bulletWeightGrains: projectileA.weight_grains,
      sightHeightInches: 1.5,
      zeroRangeYards: 100,
      maxRangeYards: 1000,
      stepYards: 500,
      windSpeedMph: 10,
    });
    const p500 = res.steps.find(p => p.rangeYards === 500);
    const p1000 = res.steps.find(p => p.rangeYards === 1000);
    return { p500, p1000 };
  }, [simA.muzzle_velocity_fps, projectileA]);

  const trajB = useMemo(() => {
    const res = calculateDownrangeTrajectory({
      muzzleVelocityFps: simB.muzzle_velocity_fps,
      bc: projectileB.bc_g1 || 0.500,
      dragModel: 'G1',
      bulletWeightGrains: projectileB.weight_grains,
      sightHeightInches: 1.5,
      zeroRangeYards: 100,
      maxRangeYards: 1000,
      stepYards: 500,
      windSpeedMph: 10,
    });
    const p500 = res.steps.find(p => p.rangeYards === 500);
    const p1000 = res.steps.find(p => p.rangeYards === 1000);
    return { p500, p1000 };
  }, [simB.muzzle_velocity_fps, projectileB]);

  if (!isOpen) return null;

  const handleCartridgeBChange = (id: string) => {
    setSelectedCartridgeBId(id);
    const c = allCartridges.find(item => item.id === id);
    if (c) {
      setBarrelLengthB(c.default_barrel_length_in);
      setChargeGrainsB(Math.round(c.overflow_capacity_gr_h2o * 0.85 * 10) / 10);
      const match = allProjectiles.find(p => Math.abs(p.caliber_in - c.bullet_diameter_in) < 0.005);
      if (match) setSelectedProjectileBId(match.id);
    }
  };

  const handleApplyLoadB = () => {
    if (onLoadLoadBIntoWorkbench) {
      onLoadLoadBIntoWorkbench(cartridgeB, projectileB, propellantB, chargeGrainsB, barrelLengthB);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '980px', width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCompare size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Cartridge &amp; Handload Head-to-Head Comparison Duel
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Selection Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '12px', alignItems: 'center' }}>
            {/* Load A Banner */}
            <div
              style={{
                backgroundColor: 'rgba(0, 210, 255, 0.06)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  Load A &bull; Active Workbench
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{barrelLengthA}&quot; barrel</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {cartridgeA.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {projectileA.weight_grains}gr {projectileA.name} &bull; {chargeGrainsA}gr {propellantA.name}
              </div>
            </div>

            {/* VS Divider */}
            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', color: 'var(--text-muted)' }}>
              VS
            </div>

            {/* Load B Controls */}
            <div
              style={{
                backgroundColor: 'rgba(255, 152, 0, 0.06)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-orange)' }}>
                  Load B &bull; Challenger
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{barrelLengthB}&quot; barrel</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px', marginBottom: '6px' }}>
                <select
                  value={selectedCartridgeBId}
                  onChange={(e) => handleCartridgeBChange(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                >
                  {allCartridges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={selectedProjectileBId}
                  onChange={(e) => setSelectedProjectileBId(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                >
                  {matchingProjectilesB.length > 0 ? (
                    matchingProjectilesB.map(p => (
                      <option key={p.id} value={p.id}>{p.weight_grains}gr {p.name}</option>
                    ))
                  ) : (
                    allProjectiles.slice(0, 10).map(p => (
                      <option key={p.id} value={p.id}>{p.weight_grains}gr {p.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
                <select
                  value={selectedPropellantBId}
                  onChange={(e) => setSelectedPropellantBId(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                >
                  {allPropellants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="150"
                    value={chargeGrainsB}
                    onChange={(e) => setChargeGrainsB(parseFloat(e.target.value) || 0)}
                    className="input-control"
                    style={{ fontSize: '11px', padding: '4px 6px', width: '100%' }}
                    title="Charge (gr)"
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>gr</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="40"
                    value={barrelLengthB}
                    onChange={(e) => setBarrelLengthB(parseFloat(e.target.value) || 24)}
                    className="input-control"
                    style={{ fontSize: '11px', padding: '4px 6px', width: '100%' }}
                    title="Barrel (in)"
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>in</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Metrics Grid */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <table className="data-table" style={{ textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Metric</th>
                  <th style={{ padding: '8px 12px', width: '28%', color: 'var(--accent-cyan)', textAlign: 'right' }}>Load A</th>
                  <th style={{ padding: '8px 12px', width: '18%', color: 'var(--text-muted)', textAlign: 'center' }}>Delta (B - A)</th>
                  <th style={{ padding: '8px 12px', width: '28%', color: 'var(--accent-orange)', textAlign: 'right' }}>Load B</th>
                </tr>
              </thead>
              <tbody>
                {/* Muzzle Velocity */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>Muzzle Velocity</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {Math.round(simA.muzzle_velocity_fps)} fps
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {simB.muzzle_velocity_fps >= simA.muzzle_velocity_fps ? (
                      <span style={{ color: 'var(--accent-green)' }}>+{(simB.muzzle_velocity_fps - simA.muzzle_velocity_fps).toFixed(0)} fps</span>
                    ) : (
                      <span style={{ color: 'var(--accent-red)' }}>-{(simA.muzzle_velocity_fps - simB.muzzle_velocity_fps).toFixed(0)} fps</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {Math.round(simB.muzzle_velocity_fps)} fps
                  </td>
                </tr>

                {/* Muzzle Energy */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>Muzzle Energy</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(simA.muzzle_energy_ft_lbs)} ft-lbs
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {simB.muzzle_energy_ft_lbs >= simA.muzzle_energy_ft_lbs ? (
                      <span style={{ color: 'var(--accent-green)' }}>+{(simB.muzzle_energy_ft_lbs - simA.muzzle_energy_ft_lbs).toFixed(0)} ft-lbs</span>
                    ) : (
                      <span style={{ color: 'var(--accent-red)' }}>-{(simA.muzzle_energy_ft_lbs - simB.muzzle_energy_ft_lbs).toFixed(0)} ft-lbs</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(simB.muzzle_energy_ft_lbs)} ft-lbs
                  </td>
                </tr>

                {/* Peak Chamber Pressure & Safety Margin */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>Peak Chamber Pressure</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div>{Math.round(simA.max_pressure_psi).toLocaleString()} psi</div>
                    <div style={{ fontSize: '10px', color: simA.pressure_status === 'safe' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {((simA.max_pressure_bar / cartridgeA.max_pressure_bar) * 100).toFixed(1)}% MAP
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {(simB.max_pressure_psi - simA.max_pressure_psi).toFixed(0)} psi
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div>{Math.round(simB.max_pressure_psi).toLocaleString()} psi</div>
                    <div style={{ fontSize: '10px', color: simB.pressure_status === 'safe' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {((simB.max_pressure_bar / cartridgeB.max_pressure_bar) * 100).toFixed(1)}% MAP
                    </div>
                  </td>
                </tr>

                {/* Powder Efficiency */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>Powder Efficiency</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {(simA.muzzle_energy_ft_lbs / Math.max(1, chargeGrainsA)).toFixed(1)} ft-lbs/gr
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {((simB.muzzle_energy_ft_lbs / Math.max(1, chargeGrainsB)) - (simA.muzzle_energy_ft_lbs / Math.max(1, chargeGrainsA))).toFixed(1)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {(simB.muzzle_energy_ft_lbs / Math.max(1, chargeGrainsB)).toFixed(1)} ft-lbs/gr
                  </td>
                </tr>

                {/* Powder Burn % */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>Muzzle Burn Completion</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {simA.propellant_burnt_pct.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {(simB.propellant_burnt_pct - simA.propellant_burnt_pct).toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {simB.propellant_burnt_pct.toFixed(1)}%
                  </td>
                </tr>

                {/* Recoil Energy */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>Free Recoil Energy</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {recoilA.recoilEnergyFtLbs.toFixed(1)} ft-lbs
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {recoilB.recoilEnergyFtLbs < recoilA.recoilEnergyFtLbs ? (
                      <span style={{ color: 'var(--accent-green)' }}>-{(recoilA.recoilEnergyFtLbs - recoilB.recoilEnergyFtLbs).toFixed(1)} ft-lbs (softer)</span>
                    ) : (
                      <span style={{ color: 'var(--accent-red)' }}>+{(recoilB.recoilEnergyFtLbs - recoilA.recoilEnergyFtLbs).toFixed(1)} ft-lbs</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {recoilB.recoilEnergyFtLbs.toFixed(1)} ft-lbs
                  </td>
                </tr>

                {/* 500yd Performance */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>500 Yards Ballistics</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div>
                      {isMetric ? `${Math.round((trajA.p500?.velocityFps || 0) * 0.3048)} m/s` : `${Math.round(trajA.p500?.velocityFps || 0)} fps`}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{Math.round(trajA.p500?.energyFtLbs || 0)} ft-lbs</div>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {((trajB.p500?.velocityFps || 0) - (trajA.p500?.velocityFps || 0)).toFixed(0)} fps
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div>
                      {isMetric ? `${Math.round((trajB.p500?.velocityFps || 0) * 0.3048)} m/s` : `${Math.round(trajB.p500?.velocityFps || 0)} fps`}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{Math.round(trajB.p500?.energyFtLbs || 0)} ft-lbs</div>
                  </td>
                </tr>

                {/* 1000yd Performance */}
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>1000 Yards Ballistics</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div>
                      {isMetric ? `${Math.round((trajA.p1000?.velocityFps || 0) * 0.3048)} m/s` : `${Math.round(trajA.p1000?.velocityFps || 0)} fps`}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Drop: {trajA.p1000?.elevationMoa.toFixed(1)} MOA ({Math.abs(Math.round(trajA.p1000?.dropInches || 0))}&quot;)
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {((trajB.p1000?.velocityFps || 0) - (trajA.p1000?.velocityFps || 0)).toFixed(0)} fps
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div>
                      {isMetric ? `${Math.round((trajB.p1000?.velocityFps || 0) * 0.3048)} m/s` : `${Math.round(trajB.p1000?.velocityFps || 0)} fps`}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Drop: {trajB.p1000?.elevationMoa.toFixed(1)} MOA ({Math.abs(Math.round(trajB.p1000?.dropInches || 0))}&quot;)
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleApplyLoadB}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowRight size={14} />
            Load Challenger (Load B) into Workstation
          </button>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
