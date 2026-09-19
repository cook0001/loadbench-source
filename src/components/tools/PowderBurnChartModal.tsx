import React, { useState, useMemo } from 'react';
import { X, Search, Flame, Check, ArrowUpDown } from 'lucide-react';
import { PropellantSpec } from '../../types/propellant';

interface PowderBurnChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  propellants: PropellantSpec[];
  activePropellant: PropellantSpec;
  onSelectPropellant: (propellant: PropellantSpec) => void;
}

export const PowderBurnChartModal: React.FC<PowderBurnChartModalProps> = ({
  isOpen,
  onClose,
  propellants,
  activePropellant,
  onSelectPropellant,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPropellantId, setSelectedPropellantId] = useState<string>(activePropellant.id);

  // Sort propellants by burn_chart_ranking or Ba
  const sortedPropellants = useMemo(() => {
    return [...propellants].sort((a, b) => {
      const rankA = a.burn_chart_ranking || 999;
      const rankB = b.burn_chart_ranking || 999;
      if (rankA !== rankB) return rankA - rankB;
      return b.burn_rate_ba - a.burn_rate_ba;
    });
  }, [propellants]);

  // Available brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    propellants.forEach(p => set.add(p.manufacturer));
    return Array.from(set).sort();
  }, [propellants]);

  const getBurnCategory = (rank: number) => {
    if (rank <= 25) return 'Very Fast Pistol';
    if (rank <= 55) return 'Standard Pistol';
    if (rank <= 80) return 'Magnum Pistol / Shotgun';
    if (rank <= 115) return 'Fast Rifle';
    if (rank <= 145) return 'Medium Rifle';
    if (rank <= 168) return 'Slow Rifle';
    return 'Extreme Magnum / Heavy';
  };

  const filteredPropellants = useMemo(() => {
    return sortedPropellants.filter(p => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (!p.name.toLowerCase().includes(query) && !p.manufacturer.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (brandFilter !== 'all' && p.manufacturer !== brandFilter) return false;
      if (categoryFilter !== 'all') {
        const cat = getBurnCategory(p.burn_chart_ranking || 999);
        if (cat !== categoryFilter) return false;
      }
      return true;
    });
  }, [sortedPropellants, searchTerm, brandFilter, categoryFilter]);

  const inspectedPropellant = useMemo(() => {
    return propellants.find(p => p.id === selectedPropellantId) || filteredPropellants[0] || propellants[0];
  }, [propellants, selectedPropellantId, filteredPropellants]);

  // Find adjacent powders on the burn chart (± 3 places from inspected)
  const adjacentSubstitutes = useMemo(() => {
    const idx = sortedPropellants.findIndex(p => p.id === inspectedPropellant.id);
    if (idx === -1) return [];
    const start = Math.max(0, idx - 3);
    const end = Math.min(sortedPropellants.length, idx + 4);
    return sortedPropellants.slice(start, end);
  }, [sortedPropellants, inspectedPropellant]);

  if (!isOpen) return null;

  const handleApply = (prop: PropellantSpec) => {
    onSelectPropellant(prop);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '980px', width: '95vw', height: '88vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>
                Relative Powder Burn Rate Chart &amp; Substitution Matrix
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                180+ smokeless propellants ranked from fastest burning (#1) to slowest (#180+) • Vieille vivacity Ba coefficients
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search powder name (e.g. Varget, H4350, Reloder 16, N140)..."
              className="input-control"
              style={{ paddingLeft: '30px', width: '100%', fontSize: '11px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>Manufacturer:</span>
            <select
              className="input-control"
              style={{ fontSize: '11px', minWidth: '130px' }}
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>Speed Class:</span>
            <select
              className="input-control"
              style={{ fontSize: '11px', minWidth: '150px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Speed Classes</option>
              <option value="Very Fast Pistol">Very Fast Pistol</option>
              <option value="Standard Pistol">Standard Pistol</option>
              <option value="Magnum Pistol / Shotgun">Magnum Pistol / Shotgun</option>
              <option value="Fast Rifle">Fast Rifle</option>
              <option value="Medium Rifle">Medium Rifle</option>
              <option value="Slow Rifle">Slow Rifle</option>
              <option value="Extreme Magnum / Heavy">Extreme Magnum / Heavy</option>
            </select>
          </div>
        </div>

        {/* Body Split View */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: Ranked Burn Rate Table */}
          <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid var(--border-color)', padding: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px', width: '50px' }}>Rank</th>
                  <th style={{ padding: '6px 10px' }}>Propellant</th>
                  <th style={{ padding: '6px 10px' }}>Manufacturer</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Vivacity Ba</th>
                  <th style={{ padding: '6px 10px' }}>Speed Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredPropellants.map((p) => {
                  const isSelected = p.id === inspectedPropellant.id;
                  const isCurrentActive = p.id === activePropellant.id;
                  const rank = p.burn_chart_ranking || 999;
                  const category = getBurnCategory(rank);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPropellantId(p.id)}
                      style={{
                        backgroundColor: isSelected 
                          ? 'rgba(6, 182, 212, 0.12)' 
                          : isCurrentActive 
                            ? 'rgba(34, 197, 94, 0.08)' 
                            : 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        #{rank}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                            {p.name}
                          </span>
                          {isCurrentActive && (
                            <span style={{
                              fontSize: '9px',
                              backgroundColor: 'rgba(34, 197, 94, 0.2)',
                              color: 'var(--accent-green)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontWeight: 700,
                            }}>
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>
                        {p.manufacturer}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {p.burn_rate_ba.toFixed(4)} 1/s
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: category.includes('Pistol') ? 'rgba(245, 158, 11, 0.12)' : category.includes('Fast Rifle') ? 'rgba(6, 182, 212, 0.12)' : category.includes('Medium') ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                          color: category.includes('Pistol') ? 'var(--accent-gold)' : category.includes('Fast Rifle') ? 'var(--accent-cyan)' : category.includes('Medium') ? '#60a5fa' : '#c084fc',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}>
                          {category}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right: Selected Propellant & Substitution Matrix */}
          <div style={{ width: '360px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', overflowY: 'auto', padding: '16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  Rank #{inspectedPropellant.burn_chart_ranking || 999}
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: inspectedPropellant.chemical_base === 'single_base' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: inspectedPropellant.chemical_base === 'single_base' ? '#60a5fa' : 'var(--accent-gold)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  {inspectedPropellant.chemical_base === 'single_base' ? 'Single Base (Nitrocellulose)' : 'Double Base (Nitroglycerin)'}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>
                {inspectedPropellant.manufacturer} {inspectedPropellant.name}
              </div>
            </div>

            {/* Ballistic Thermochemistry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>VIVACITY (Ba)</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {inspectedPropellant.burn_rate_ba.toFixed(4)} 1/s
                </div>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>HEAT OF EXPLOSION</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
                  {inspectedPropellant.heat_of_explosion_j_g} J/g
                </div>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>BULK DENSITY</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {inspectedPropellant.bulk_density_g_cm3} g/cm³
                </div>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>GRAIN GEOMETRY</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {inspectedPropellant.grain_geometry || 'Extruded'}
                </div>
              </div>
            </div>

            {/* Adjacent Powder Substitutions Box */}
            <div style={{ marginBottom: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ArrowUpDown size={13} />
                <span>Adjacent Powder Equivalents (±3 Positions)</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Closest alternatives during powder shortages. Always drop charge 10% and work up:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {adjacentSubstitutes.map((sub) => {
                  const isCurrent = sub.id === inspectedPropellant.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedPropellantId(sub.id)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${isCurrent ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        backgroundColor: isCurrent ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: '26px' }}>
                          #{sub.burn_chart_ranking || 999}
                        </span>
                        <span style={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                          {sub.manufacturer} {sub.name}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {sub.burn_rate_ba.toFixed(3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Apply Button */}
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => handleApply(inspectedPropellant)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Check size={15} />
                <span>Load into Workbench</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
