import React, { useState, useMemo } from 'react';
import { X, Search, SlidersHorizontal } from 'lucide-react';
import { PropellantRankingItem } from '../../types/ballistics';
import { PropellantSpec } from '../../types/propellant';
import { formatPressure, formatVelocity, formatWeight } from '../../utils/formatters';

interface PowderCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ranking: PropellantRankingItem[];
  propellants: PropellantSpec[];
  onSelectPropellantAndCharge: (propellant: PropellantSpec, charge: number) => void;
  isMetric: boolean;
}

export const PowderCompareModal: React.FC<PowderCompareModalProps> = ({
  isOpen,
  onClose,
  ranking,
  propellants,
  onSelectPropellantAndCharge,
  isMetric,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  // Available brands in the ranking list
  const brands = useMemo(() => {
    const set = new Set<string>();
    ranking.forEach(r => set.add(r.manufacturer));
    return Array.from(set).sort();
  }, [ranking]);

  // Filtered ranking
  const filteredRanking = useMemo(() => {
    return ranking.filter(item => {
      const matchesBrand = brandFilter === 'all' || item.manufacturer === brandFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        item.propellant_name.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q);
      return matchesBrand && matchesSearch;
    });
  }, [ranking, brandFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '960px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Propellant Ranking Matrix ({ranking.length} Powders Evaluated)
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', gap: '10px' }}>
          {/* Subtitle description */}
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Each powder is simulated up to ~98% of maximum allowable chamber pressure (Pmax). Sorted descending by highest achievable muzzle velocity. Click <strong>Load Recipe</strong> to apply immediately to your workbench.
          </div>

          {/* Search & Brand Filter Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '200px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search powder (e.g. 4350, Varget, Reloder, N555)..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  padding: '4px 8px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Brand Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={13} color="var(--accent-cyan)" />
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  padding: '4px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <option value="all">All Brands ({ranking.length})</option>
                {brands.map(b => (
                  <option key={b} value={b}>
                    {b} ({ranking.filter(r => r.manufacturer === b).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Count Badge */}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Showing <strong>{filteredRanking.length}</strong> of {ranking.length}
            </span>
          </div>

          {/* Results Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'right',
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Propellant</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Brand</th>
                  <th style={{ padding: '8px 10px' }}>Max Safe Velocity</th>
                  <th style={{ padding: '8px 10px' }}>Charge at Pmax</th>
                  <th style={{ padding: '8px 10px' }}>Pressure</th>
                  <th style={{ padding: '8px 10px' }}>Fill Ratio</th>
                  <th style={{ padding: '8px 10px' }}>Burn %</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRanking.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No propellants matched your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRanking.map((item, index) => {
                    const propObj = propellants.find(p => p.id === item.propellant_id);
                    const isTop = index === 0 && brandFilter === 'all' && !searchQuery;

                    return (
                      <tr
                        key={item.propellant_id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: isTop ? 'rgba(16, 185, 129, 0.08)' : (index % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'),
                        }}
                      >
                        <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: isTop ? 'var(--status-safe)' : 'var(--text-primary)' }}>
                          {item.propellant_name} {isTop ? '★ Top Performer' : ''}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)' }}>
                          {item.manufacturer}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '12px' }}>
                          {formatVelocity(item.max_velocity_fps, isMetric)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {formatWeight(item.charge_at_pmax_grains, 1, isMetric)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {formatPressure(item.pressure_bar, isMetric)}
                        </td>
                        <td style={{ padding: '8px 10px', color: item.fill_ratio_pct > 100 ? 'var(--status-caution)' : 'inherit' }}>
                          {item.fill_ratio_pct.toFixed(1)}% {item.fill_ratio_pct > 100 ? '(Comp)' : ''}
                        </td>
                        <td style={{ padding: '8px 10px', color: item.burn_pct < 95 ? 'var(--status-caution)' : 'inherit' }}>
                          {item.burn_pct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              if (propObj) {
                                onSelectPropellantAndCharge(propObj, item.charge_at_pmax_grains);
                                onClose();
                              }
                            }}
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Load Recipe
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} style={btnSecondaryStyle}>Close</button>
        </div>
      </div>
    </div>
  );
};

const btnSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '6px 14px',
  fontSize: '12px',
};
