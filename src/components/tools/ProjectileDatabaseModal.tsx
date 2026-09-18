import React, { useState, useMemo } from 'react';
import { X, Search, Database, Crosshair, Check, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { ProjectileSpec } from '../../types/projectile';
import { calculateGyroscopicStability } from '../../utils/stabilityEngine';

interface ProjectileDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectiles: ProjectileSpec[];
  activeProjectile: ProjectileSpec;
  onSelectProjectile: (projectile: ProjectileSpec) => void;
  cartridgeBulletDiaIn: number;
  barrelTwistInches: number;
  muzzleVelocityFps: number;
  isMetric: boolean;
}

export const ProjectileDatabaseModal: React.FC<ProjectileDatabaseModalProps> = ({
  isOpen,
  onClose,
  projectiles,
  activeProjectile,
  onSelectProjectile,
  cartridgeBulletDiaIn,
  barrelTwistInches,
  muzzleVelocityFps,
  isMetric,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mfgFilter, setMfgFilter] = useState<string>('all');
  const [caliberFilter, setCaliberFilter] = useState<string>('current'); // 'current', 'all', or specific caliber
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedBulletId, setSelectedBulletId] = useState<string>(activeProjectile.id);
  const [sortBy, setSortBy] = useState<'weight_asc' | 'weight_desc' | 'bc_desc' | 'mfg'>('weight_asc');

  // Available manufacturers with counts
  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    projectiles.forEach(p => set.add(p.manufacturer));
    return Array.from(set).sort();
  }, [projectiles]);

  // Distinct calibers
  const distinctCalibers = useMemo(() => {
    const map = new Map<number, number>();
    projectiles.forEach(p => {
      const cal = Number(p.caliber_in.toFixed(3));
      map.set(cal, (map.get(cal) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [projectiles]);

  // Filtered bullet list
  const filteredBullets = useMemo(() => {
    return projectiles.filter(p => {
      // Caliber filter
      if (caliberFilter === 'current') {
        if (Math.abs(p.caliber_in - cartridgeBulletDiaIn) > 0.006) return false;
      } else if (caliberFilter !== 'all') {
        const targetCal = parseFloat(caliberFilter);
        if (Math.abs(p.caliber_in - targetCal) > 0.004) return false;
      }

      // Manufacturer filter
      if (mfgFilter !== 'all' && p.manufacturer !== mfgFilter) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = (p.category || '').toLowerCase();
        if (categoryFilter === 'match' && !cat.includes('match') && !cat.includes('target')) return false;
        if (categoryFilter === 'hunting' && !cat.includes('hunting') && !cat.includes('game')) return false;
        if (categoryFilter === 'monolithic' && p.shot_start_pressure_bar < 350) return false;
        if (categoryFilter === 'handgun' && !cat.includes('handgun') && !cat.includes('defense') && !cat.includes('action') && p.caliber_in < 0.35) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesMfg = p.manufacturer.toLowerCase().includes(q);
        const matchesWeight = p.weight_grains.toString().includes(q);
        const matchesCal = p.caliber_in.toString().includes(q);
        const matchesDesig = (p.caliber_designation || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMfg && !matchesWeight && !matchesCal && !matchesDesig && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [projectiles, caliberFilter, cartridgeBulletDiaIn, mfgFilter, categoryFilter, searchQuery]);

  // Sorted bullets
  const sortedBullets = useMemo(() => {
    const list = [...filteredBullets];
    if (sortBy === 'weight_asc') {
      list.sort((a, b) => a.weight_grains - b.weight_grains);
    } else if (sortBy === 'weight_desc') {
      list.sort((a, b) => b.weight_grains - a.weight_grains);
    } else if (sortBy === 'bc_desc') {
      list.sort((a, b) => (b.bc_g1 || 0) - (a.bc_g1 || 0));
    } else if (sortBy === 'mfg') {
      list.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.weight_grains - b.weight_grains);
    }
    return list;
  }, [filteredBullets, sortBy]);

  // Active inspected bullet
  const inspectedBullet = useMemo(() => {
    return projectiles.find(p => p.id === selectedBulletId) || sortedBullets[0] || projectiles[0];
  }, [projectiles, selectedBulletId, sortedBullets]);

  // Gyroscopic stability computation for inspected bullet
  const stability = useMemo(() => {
    if (!inspectedBullet) return null;
    return calculateGyroscopicStability({
      bulletWeightGrains: inspectedBullet.weight_grains,
      bulletLengthInches: inspectedBullet.length_in,
      bulletDiameterInches: inspectedBullet.caliber_in,
      barrelTwistInches,
      muzzleVelocityFps,
    });
  }, [inspectedBullet, barrelTwistInches, muzzleVelocityFps]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1100px', width: '95vw', maxHeight: '88vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              LoadBench Projectile Database ({projectiles.length} Verified Factory Bullets)
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, grain weight, or model (e.g. ELD, TMK, TTSX, Scenar, 140)..."
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '5px 8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Caliber Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Caliber:</span>
            <select
              value={caliberFilter}
              onChange={(e) => setCaliberFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            >
              <option value="current">Current ({cartridgeBulletDiaIn}")</option>
              <option value="all">All Calibers ({projectiles.length})</option>
              {distinctCalibers.map(([cal, count]) => (
                <option key={cal} value={cal.toString()}>
                  .{Math.round(cal * 1000).toString().padStart(3, '0')}" ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Brand:</span>
            <select
              value={mfgFilter}
              onChange={(e) => setMfgFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            >
              <option value="all">All Brands ({manufacturers.length})</option>
              {manufacturers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            >
              <option value="all">All Types</option>
              <option value="match">Match / Target</option>
              <option value="hunting">Hunting</option>
              <option value="monolithic">Monolithic Copper</option>
              <option value="handgun">Handgun / Defense</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={12} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            >
              <option value="weight_asc">Weight (Low → High)</option>
              <option value="weight_desc">Weight (High → Low)</option>
              <option value="bc_desc">Highest G1 BC</option>
              <option value="mfg">Manufacturer</option>
            </select>
          </div>
        </div>

        {/* Main Content Body (Two Columns: Projectiles List + Detailed Inspector) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', height: '560px', overflow: 'hidden' }}>
          {/* Left Column: Bullet List */}
          <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border-color)', padding: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '4px' }}>
              Showing {sortedBullets.length} of {projectiles.length} projectiles
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sortedBullets.map(p => {
                const isSelected = p.id === inspectedBullet?.id;
                const isActiveInWorkstation = p.id === activeProjectile.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedBulletId(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </span>
                        {isActiveInWorkstation && (
                          <span style={{
                            fontSize: '9px',
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            color: '#34d399',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            fontWeight: 700,
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>{p.manufacturer}</span>
                        <span>•</span>
                        <span>{p.weight_grains} gr ({isMetric ? (p.weight_grains * 0.06479891).toFixed(2) + ' g' : ''})</span>
                        <span>•</span>
                        <span>L: {p.length_in}"</span>
                        {p.bc_g1 && (
                          <>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>G1: {p.bc_g1}</span>
                          </>
                        )}
                        {p.bc_g7 && (
                          <>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>G7: {p.bc_g7}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        backgroundColor: p.base_type === 'boat_tail' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.15)',
                        color: p.base_type === 'boat_tail' ? '#60a5fa' : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}>
                        {p.base_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}

              {sortedBullets.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No projectiles found matching your search and filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Inspector & Load Button */}
          {inspectedBullet && (
            <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  {inspectedBullet.manufacturer} • {inspectedBullet.category || 'Projectile'}
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {inspectedBullet.name}
                </h3>
              </div>

              {/* Physical Parameters Card */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crosshair size={13} />
                  <span>Physical Specifications</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Diameter: </span>
                    <strong>{inspectedBullet.caliber_in}" {inspectedBullet.caliber_designation ? `(${inspectedBullet.caliber_designation})` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Weight: </span>
                    <strong>{inspectedBullet.weight_grains} gr {isMetric ? `(${(inspectedBullet.weight_grains * 0.06479891).toFixed(2)} g)` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Length: </span>
                    <strong>{inspectedBullet.length_in}" {isMetric ? `(${(inspectedBullet.length_in * 25.4).toFixed(2)} mm)` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Base Type: </span>
                    <strong style={{ textTransform: 'capitalize' }}>{inspectedBullet.base_type.replace('_', ' ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Seating Depth: </span>
                    <strong>{inspectedBullet.default_seating_depth_in}"</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Shot Start (P0): </span>
                    <strong>{inspectedBullet.shot_start_pressure_bar} bar ({Math.round(inspectedBullet.shot_start_pressure_bar * 14.5038)} psi)</strong>
                  </div>
                </div>
              </div>

              {/* Aerodynamic BC Card */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  Aerodynamic Ballistic Coefficients
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>G1 BC: </span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: inspectedBullet.bc_g1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {inspectedBullet.bc_g1 || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>G7 BC: </span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: inspectedBullet.bc_g7 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {inspectedBullet.bc_g7 || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Gyroscopic Stability Preview */}
              {stability && (
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={13} />
                      <span>Stability with {barrelTwistInches}" Twist</span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: stability.statusColor,
                      backgroundColor: `${stability.statusColor}1a`,
                      padding: '1px 6px',
                      borderRadius: '3px',
                    }}>
                      {stability.statusLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stability Factor (Sg):</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: stability.statusColor }}>
                      {stability.sg.toFixed(2)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Optimal Twist:</span>
                    <span>1:{stability.optimalTwistInches.toFixed(1)}" or faster</span>
                  </div>
                </div>
              )}

              {/* Construction Notes */}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4', backgroundColor: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Interior Ballistics Pressure Note:
                </div>
                {inspectedBullet.shot_start_pressure_bar >= 350 ? (
                  <span>Monolithic copper/brass alloy bullets have higher engraving resistance into the rifling lands. LoadBench automatically applies {inspectedBullet.shot_start_pressure_bar} bar initial shot start pressure for accurate peak pressure calculation.</span>
                ) : inspectedBullet.shot_start_pressure_bar <= 150 ? (
                  <span>Plated/lead cast projectile with low engraving resistance. Initial shot start pressure is modeled at {inspectedBullet.shot_start_pressure_bar} bar ({Math.round(inspectedBullet.shot_start_pressure_bar * 14.5038)} psi).</span>
                ) : (
                  <span>Standard copper-jacketed lead core projectile. Initial shot start engraving resistance is modeled at {inspectedBullet.shot_start_pressure_bar} bar ({Math.round(inspectedBullet.shot_start_pressure_bar * 14.5038)} psi).</span>
                )}
              </div>

              {/* Select & Load Button */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  onClick={() => {
                    onSelectProjectile(inspectedBullet);
                    onClose();
                  }}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={14} />
                  <span>Select Projectile &amp; Load into Workstation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
