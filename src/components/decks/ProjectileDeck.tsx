import React from 'react';
import { Crosshair } from 'lucide-react';
import { ProjectileSpec } from '../../types/projectile';

interface ProjectileDeckProps {
  projectiles: ProjectileSpec[];
  projectile: ProjectileSpec;
  onChangeProjectile: (updated: ProjectileSpec) => void;
  seatingDepth: number;
  onChangeSeatingDepth: (val: number) => void;
  usableChamberVolCm3: number;
  isMetric: boolean;
}

export const ProjectileDeck: React.FC<ProjectileDeckProps> = ({
  projectiles,
  projectile,
  onChangeProjectile,
  seatingDepth,
  onChangeSeatingDepth,
  usableChamberVolCm3,
  isMetric,
}) => {
  return (
    <section className="deck-card">
      <div className="deck-header">
        <div className="deck-title">
          <Crosshair size={14} style={{ flexShrink: 0 }} />
          <span>2. Projectile & Seating Setup</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
          Net Combustion Vol: <strong>{usableChamberVolCm3.toFixed(2)} cm³</strong>
        </span>
      </div>

      {/* Bullet Selector */}
      <div className="input-field">
        <label className="input-label">Select Projectile</label>
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
          {projectiles.map(p => (
            <option key={p.id} value={p.id}>
              {p.manufacturer} {p.name} ({p.weight_grains} gr)
            </option>
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

        {/* Shot Start Pressure (P0) */}
        <div className="input-field">
          <label className="input-label">Shot Start Pressure (P₀)</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              step="10"
              className="input-control"
              style={{ flex: 1, minWidth: 0 }}
              value={projectile.shot_start_pressure_bar}
              onChange={(e) => {
                onChangeProjectile({
                  ...projectile,
                  shot_start_pressure_bar: parseFloat(e.target.value) || 50,
                });
              }}
            />
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              bar
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
