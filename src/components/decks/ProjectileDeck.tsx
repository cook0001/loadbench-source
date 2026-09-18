import React, { useState, useMemo } from 'react';
import { Crosshair, Compass, ShieldCheck, Database } from 'lucide-react';
import { ProjectileSpec } from '../../types/projectile';
import { calculateGyroscopicStability, StabilityResult } from '../../utils/stabilityEngine';

interface ProjectileDeckProps {
  projectiles: ProjectileSpec[];
  projectile: ProjectileSpec;
  onChangeProjectile: (updated: ProjectileSpec) => void;
  seatingDepth: number;
  onChangeSeatingDepth: (val: number) => void;
  barrelTwistInches: number;
  onChangeBarrelTwist: (twist: number) => void;
  isTouchingLands: boolean;
  onChangeTouchingLands: (touching: boolean) => void;
  cartridgeBulletDiaIn: number;
  usableChamberVolCm3: number;
  muzzleVelocityFps: number;
  isMetric: boolean;
  onOpenProjectileDB?: () => void;
}

export const ProjectileDeck: React.FC<ProjectileDeckProps> = ({
  projectiles,
  projectile,
  onChangeProjectile,
  seatingDepth,
  onChangeSeatingDepth,
  barrelTwistInches,
  onChangeBarrelTwist,
  isTouchingLands,
  onChangeTouchingLands,
  cartridgeBulletDiaIn,
  usableChamberVolCm3,
  muzzleVelocityFps,
  isMetric,
  onOpenProjectileDB,
}) => {
  const [showAllCalibers, setShowAllCalibers] = useState<boolean>(false);
  const [brandFilter, setBrandFilter] = useState<string>('all');

  // Caliber-matched projectiles
  const caliberProjectiles = useMemo(() => {
    if (showAllCalibers) return projectiles;
    return projectiles.filter(p => Math.abs(p.caliber_in - cartridgeBulletDiaIn) <= 0.006);
  }, [projectiles, cartridgeBulletDiaIn, showAllCalibers]);

  // Available manufacturers in this caliber pool
  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    caliberProjectiles.forEach(p => set.add(p.manufacturer));
    return Array.from(set).sort();
  }, [caliberProjectiles]);

  // Filter bullets matching manufacturer filter
  const filteredProjectiles = useMemo(() => {
    if (brandFilter === 'all') return caliberProjectiles;
    return caliberProjectiles.filter(p => p.manufacturer === brandFilter);
  }, [caliberProjectiles, brandFilter]);

  // Group by manufacturer
  const groupedProjectiles = useMemo(() => {
    const map: Record<string, ProjectileSpec[]> = {};
    filteredProjectiles.forEach(p => {
      if (!map[p.manufacturer]) map[p.manufacturer] = [];
      map[p.manufacturer].push(p);
    });
    return map;
  }, [filteredProjectiles]);

  // Gyroscopic stability computation
  const stability: StabilityResult = useMemo(() => {
    return calculateGyroscopicStability({
      bulletWeightGrains: projectile.weight_grains,
      bulletLengthInches: projectile.length_in,
      bulletDiameterInches: projectile.caliber_in,
      barrelTwistInches,
      muzzleVelocityFps,
    });
  }, [projectile, barrelTwistInches, muzzleVelocityFps]);

  return (
    <section className="deck-card">
      <div className="deck-header">
        <div className="deck-title">
          <Crosshair size={14} style={{ flexShrink: 0 }} />
          <span>2. Projectile &amp; Seating Setup</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowAllCalibers(!showAllCalibers)}
            style={{
              background: 'none',
              border: 'none',
              color: showAllCalibers ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '10px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {showAllCalibers ? 'Filtered to Caliber' : `All Calibers (${projectiles.length})`}
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
            Net Vol: <strong>{usableChamberVolCm3.toFixed(2)} cm³</strong>
          </span>
        </div>
      </div>

      {/* Manufacturer Filter & Bullet DB launcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <label className="input-label" style={{ margin: 0, marginBottom: '2px' }}>Brand Filter</label>
          <select
            className="input-control"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="all">All Brands ({caliberProjectiles.length} in cal)</option>
            {manufacturers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        {onOpenProjectileDB && (
          <button
            onClick={onOpenProjectileDB}
            className="btn-action"
            style={{ alignSelf: 'flex-end', height: '28px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Browse Complete Projectile Database"
          >
            <Database size={12} />
            <span>Bullet DB</span>
          </button>
        )}
      </div>

      {/* Bullet Selector with Manufacturer Grouping */}
      <div className="input-field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <label className="input-label" style={{ margin: 0 }}>
            Select Projectile ({filteredProjectiles.length} Available in {cartridgeBulletDiaIn}")
          </label>
          {projectile.bc_g1 && (
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              G1: {projectile.bc_g1} {projectile.bc_g7 ? `| G7: ${projectile.bc_g7}` : ''}
            </span>
          )}
        </div>
        <select
          className="input-control"
          value={projectile.id}
          onChange={(e) => {
            const found = projectiles.find(p => p.id === e.target.value);
            if (found) {
              onChangeProjectile(found);
              onChangeSeatingDepth(found.default_seating_depth_in);
            }
          }}
          style={{ width: '100%', minWidth: 0, maxWidth: '100%', textOverflow: 'ellipsis' }}
        >
          {Object.entries(groupedProjectiles).map(([mfg, items]) => (
            <optgroup key={mfg} label={mfg.toUpperCase()}>
              {items.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.weight_grains} gr, L: {p.length_in}")
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="deck-grid">
        {/* Bullet Weight */}
        <div className="input-field">
          <label className="input-label">Weight ({isMetric ? 'g' : 'grains'})</label>
          <input
            type="number"
            step="0.1"
            className="input-control"
            value={projectile.weight_grains}
            onChange={(e) => {
              onChangeProjectile({
                ...projectile,
                weight_grains: parseFloat(e.target.value) || 10,
              });
            }}
          />
        </div>

        {/* Bullet Length */}
        <div className="input-field">
          <label className="input-label">Bullet Length ({isMetric ? 'mm' : 'in'})</label>
          <input
            type="number"
            step="0.001"
            className="input-control"
            value={isMetric ? Number((projectile.length_in * 25.4).toFixed(2)) : projectile.length_in}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0.1;
              onChangeProjectile({
                ...projectile,
                length_in: isMetric ? val / 25.4 : val,
              });
            }}
          />
        </div>

        {/* Seating Depth */}
        <div className="input-field">
          <label className="input-label">Seating Depth into Case</label>
          <input
            type="number"
            step="0.005"
            className="input-control"
            value={seatingDepth}
            onChange={(e) => onChangeSeatingDepth(parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Barrel Twist Rate */}
        <div className="input-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <label className="input-label" style={{ margin: 0 }}>Barrel Twist Rate</label>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              1:{barrelTwistInches}"
            </span>
          </div>
          <input
            type="number"
            step="0.25"
            className="input-control"
            value={barrelTwistInches}
            onChange={(e) => onChangeBarrelTwist(parseFloat(e.target.value) || 8)}
          />
        </div>
      </div>

      {/* --- JUMP & TOUCHING LANDS SECTION --- */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => onChangeTouchingLands(!isTouchingLands)}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: `1px solid ${isTouchingLands ? 'var(--status-caution)' : 'var(--border-color)'}`,
            backgroundColor: isTouchingLands ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
            color: isTouchingLands ? 'var(--status-caution)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>{isTouchingLands ? '⚠ Jammed / Touching Lands (+150 bar)' : 'Standard Freebore Jump'}</span>
        </button>
      </div>

      {/* --- MILLER GYROSCOPIC STABILITY HUD --- */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '6px',
        border: `1px solid ${stability.statusColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={14} color={stability.statusColor} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: stability.statusColor }}>
              Sg: {stability.sg} &bull; {stability.statusLabel}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Optimal Twist: <strong>1:{stability.optimalTwistInches}"</strong> (Min: 1:{stability.minTwistInches}") &bull; BC: {stability.bcRetentionPct}%
            </div>
          </div>
        </div>
        {stability.classification === 'optimal' && (
          <ShieldCheck size={16} color="var(--status-safe)" />
        )}
      </div>
    </section>
  );
};
