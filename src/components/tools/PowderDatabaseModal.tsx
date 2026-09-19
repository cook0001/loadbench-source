import React, { useState, useMemo } from 'react';
import { X, Search, Database, Flame, Check, SlidersHorizontal, Info } from 'lucide-react';
import { PropellantSpec } from '../../types/propellant';

interface PowderDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  propellants: PropellantSpec[];
  activePropellant: PropellantSpec;
  onSelectPropellant: (propellant: PropellantSpec) => void;
}

export const PowderDatabaseModal: React.FC<PowderDatabaseModalProps> = ({
  isOpen,
  onClose,
  propellants,
  activePropellant,
  onSelectPropellant,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [selectedPowderId, setSelectedPowderId] = useState<string>(activePropellant.id);

  // Available brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    propellants.forEach(p => set.add(p.manufacturer));
    return Array.from(set).sort();
  }, [propellants]);

  // Filtered powder list
  const filteredPowders = useMemo(() => {
    return propellants.filter(p => {
      const matchesBrand = brandFilter === 'all' || p.manufacturer === brandFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.grain_geometry.toLowerCase().includes(q);
      return matchesBrand && matchesSearch;
    });
  }, [propellants, brandFilter, searchQuery]);

  // Selected powder object
  const inspectedPowder = useMemo(() => {
    return propellants.find(p => p.id === selectedPowderId) || filteredPowders[0] || propellants[0];
  }, [propellants, selectedPowderId, filteredPowders]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1080px', width: '95vw', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              LoadBench Propellant Database ({propellants.length} Powders Loaded)
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by powder name or brand (e.g. H4350, Reloder 16, N555, Varget)..."
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                padding: '5px 10px',
                outline: 'none',
              }}
            />
          </div>

          {/* Brand Filter */}
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
              <option value="all">All Manufacturers ({propellants.length})</option>
              {brands.map(b => (
                <option key={b} value={b}>
                  {b} ({propellants.filter(p => p.manufacturer === b).length})
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Showing <strong>{filteredPowders.length}</strong> of {propellants.length}
          </span>
        </div>

        {/* Master-Detail Body Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Table: Propellant Browser List */}
          <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
            <table className="ladder-table" style={{
              textAlign: 'right',
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Propellant</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Brand</th>
                  <th style={{ padding: '8px 10px' }}>Ba [1/bar·s]</th>
                  <th style={{ padding: '8px 10px' }}>Rank #</th>
                  <th style={{ padding: '8px 10px' }}>Geometry</th>
                  <th style={{ padding: '8px 10px' }}>Bulk [g/cm³]</th>
                </tr>
              </thead>
              <tbody>
                {filteredPowders.map(p => {
                  const isSelected = p.id === inspectedPowder?.id;
                  const isActive = p.id === activePropellant.id;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPowderId(p.id)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : (isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent'),
                      }}
                    >
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: isActive ? 'var(--status-safe)' : (isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)')
                      }}>
                        {p.name} {isActive && '(Active)'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)' }}>
                        {p.manufacturer}
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {p.burn_rate_ba.toFixed(3)}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {p.burn_chart_ranking ? `#${p.burn_chart_ranking}` : '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {p.grain_geometry.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                        {p.bulk_density_g_cm3.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Panel: Powder Thermochemical Inspector */}
          {inspectedPowder && (
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <Flame size={16} color="#f97316" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {inspectedPowder.name}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Manufacturer: <strong>{inspectedPowder.manufacturer}</strong> | Geometry: <strong>{inspectedPowder.grain_geometry}</strong>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onSelectPropellant(inspectedPowder);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: inspectedPowder.id === activePropellant.id ? 'var(--status-safe-bg)' : 'var(--accent-blue)',
                  color: inspectedPowder.id === activePropellant.id ? 'var(--status-safe)' : '#ffffff',
                  border: `1px solid ${inspectedPowder.id === activePropellant.id ? 'var(--status-safe-border)' : 'var(--accent-blue)'}`,
                  borderRadius: '5px',
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {inspectedPowder.id === activePropellant.id ? (
                  <>
                    <Check size={14} />
                    <span>Currently Loaded on Workbench</span>
                  </>
                ) : (
                  <>
                    <Flame size={14} />
                    <span>Load {inspectedPowder.name} into Workbench</span>
                  </>
                )}
              </button>

              {/* Thermochemical Specs Card */}
              <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Interior Ballistics Thermochemical Constants
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Burn Rate (Ba):</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{inspectedPowder.burn_rate_ba.toFixed(4)} 1/bar·s</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Relative Burn Ranking:</span>
                  <strong>#{inspectedPowder.burn_chart_ranking || '-'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Heat of Explosion (Qex):</span>
                  <strong>{inspectedPowder.heat_of_explosion_j_g} J/g</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Force Constant (f):</span>
                  <strong>{inspectedPowder.force_constant_j_g} J/g</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Specific Heat Ratio (γ):</span>
                  <strong>{inspectedPowder.ratio_specific_heats.toFixed(3)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Co-Volume (η):</span>
                  <strong>{inspectedPowder.co_volume_cm3_g.toFixed(3)} cm³/g</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Solid Density (ρs):</span>
                  <strong>{inspectedPowder.solid_density_g_cm3.toFixed(3)} g/cm³</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bulk Density (ρbulk):</span>
                  <strong>{inspectedPowder.bulk_density_g_cm3.toFixed(3)} g/cm³</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Form Factor (z0 / z1):</span>
                  <strong>{inspectedPowder.progressivity_z0.toFixed(2)} / {inspectedPowder.progressivity_z1.toFixed(2)}</strong>
                </div>
              </div>

              {/* Real-World Manufacturer Specifications Card */}
              <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '11px',
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  Real-World Manufacturer Specifications
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Volumetric Measure (VMD):</span>
                  <strong>{inspectedPowder.vmd_cc_gr ?? (1 / (inspectedPowder.bulk_density_g_cm3 * 15.432358)).toFixed(4)} cc/gr</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Chemical Base:</span>
                  <span style={{ fontWeight: 600, color: inspectedPowder.chemical_base === 'double_base' ? 'var(--status-caution)' : 'var(--status-safe)' }}>
                    {inspectedPowder.chemical_base === 'double_base' ? `Double-Base (${inspectedPowder.ng_content_pct || 12}% NG)` : 'Single-Base (100% NC)'}
                  </span>
                </div>

                {inspectedPowder.reference_loads && inspectedPowder.reference_loads.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                      VERIFIED LAB REFERENCE TEST POINT:
                    </div>
                    {inspectedPowder.reference_loads.map((ref, idx) => (
                      <div key={idx} style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '10px',
                        marginBottom: '4px',
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ref.cartridge_name} &bull; {ref.charge_grains} gr &rarr; {ref.muzzle_velocity_fps} fps
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {ref.bullet_weight_grains} gr {ref.bullet_name} | {ref.max_pressure_psi.toLocaleString()} psi ({ref.source})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informational Tip */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.15)',
              }}>
                <Info size={14} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Burn Rate (Ba) dictates combustion speed under pressure. VMD (Volume Measured Density) enables precise calibration with volumetric powder measures.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

