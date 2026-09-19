import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Crosshair, Check, ShieldAlert, Sparkles, FolderOpen } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';

interface CartridgeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridges: CartridgeSpec[];
  activeCartridge: CartridgeSpec;
  onSelectCartridge: (cartridge: CartridgeSpec) => void;
  isMetric: boolean;
}

type CaliberRange = 'ALL' | 'SMALL' | 'MED_6_65' | 'MED_7_30' | 'LARGE_8_375' | 'BIG_BORE';

export const CartridgeSelectorModal: React.FC<CartridgeSelectorModalProps> = ({
  isOpen,
  onClose,
  cartridges,
  activeCartridge,
  onSelectCartridge,
  isMetric,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [caliberRange, setCaliberRange] = useState<CaliberRange>('ALL');
  const [standardFilter, setStandardFilter] = useState<string>('ALL');
  const [highlightedId, setHighlightedId] = useState<string>(activeCartridge.id);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHighlightedId(activeCartridge.id);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, activeCartridge.id]);

  // Distinct standards and categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    cartridges.forEach(c => {
      if (c.standard) set.add(c.standard);
    });
    return Array.from(set).sort();
  }, [cartridges]);

  // Filtered cartridges
  const filteredCartridges = useMemo(() => {
    return cartridges.filter(c => {
      // Standard filter
      if (standardFilter !== 'ALL' && c.standard !== standardFilter) {
        return false;
      }

      // Caliber range filter
      const dia = c.bullet_diameter_in;
      if (caliberRange === 'SMALL' && dia > 0.225) return false;
      if (caliberRange === 'MED_6_65' && (dia < 0.240 || dia > 0.266)) return false;
      if (caliberRange === 'MED_7_30' && (dia < 0.270 || dia > 0.315)) return false;
      if (caliberRange === 'LARGE_8_375' && (dia < 0.320 || dia > 0.376)) return false;
      if (caliberRange === 'BIG_BORE' && dia < 0.395) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCal = c.bullet_diameter_in.toString().includes(q);
        const matchesStd = (c.standard || '').toLowerCase().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCal && !matchesStd && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [cartridges, standardFilter, caliberRange, searchQuery]);

  // Selected / highlighted cartridge
  const inspectedCartridge = useMemo(() => {
    return cartridges.find(c => c.id === highlightedId) || filteredCartridges[0] || cartridges[0];
  }, [cartridges, highlightedId, filteredCartridges]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1080px', width: '95vw', maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Open Cartridge Specification ({cartridges.length} Reloadable Centerfire Records)
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by cartridge name or caliber (e.g. 6.5 PRC, .308, 45-70, 7mm Rem)..."
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

          {/* Standard Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard:</span>
            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            >
              <option value="ALL">All Standards</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Caliber Range Filter Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Bore Range:
          </span>
          {[
            { key: 'ALL', label: 'All Calibers' },
            { key: 'SMALL', label: 'Small (.172 - .224)' },
            { key: 'MED_6_65', label: 'Medium (6mm - 6.5mm)' },
            { key: 'MED_7_30', label: 'Medium (7mm - .308)' },
            { key: 'LARGE_8_375', label: 'Large (8mm - .375)' },
            { key: 'BIG_BORE', label: 'Big Bore (.400+)' },
          ].map(chip => (
            <button
              key={chip.key}
              onClick={() => setCaliberRange(chip.key as CaliberRange)}
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 600,
                border: caliberRange === chip.key ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                backgroundColor: caliberRange === chip.key ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                color: caliberRange === chip.key ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Main Split Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', height: '540px', overflow: 'hidden' }}>
          {/* Left Column: Cartridges List */}
          <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border-color)', padding: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '4px' }}>
              Showing {filteredCartridges.length} of {cartridges.length} cartridges
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {filteredCartridges.map(c => {
                const isSelected = c.id === inspectedCartridge?.id;
                const isActiveInWorkstation = c.id === activeCartridge.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setHighlightedId(c.id)}
                    onDoubleClick={() => {
                      onSelectCartridge(c);
                      onClose();
                    }}
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
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '12px',
                            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {c.name}
                        </span>
                        {isActiveInWorkstation && (
                          <span
                            style={{
                              fontSize: '9px',
                              backgroundColor: 'rgba(52, 211, 153, 0.15)',
                              color: '#34d399',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              fontWeight: 700,
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>Dia: {c.bullet_diameter_in}"</span>
                        <span>•</span>
                        <span>Case: {c.case_length_in}"</span>
                        <span>•</span>
                        <span>MAP: {c.max_pressure_psi ? `${c.max_pressure_psi.toLocaleString()} psi` : `${c.max_pressure_bar} bar`}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          backgroundColor: c.standard === 'Wildcat' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                          color: c.standard === 'Wildcat' ? '#f59e0b' : 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        {c.standard || 'SAAMI'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredCartridges.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No cartridges found matching your search.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Cartridge Inspector */}
          {inspectedCartridge && (
            <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  {inspectedCartridge.standard || 'Standard'} • {inspectedCartridge.category || 'Centerfire'}
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {inspectedCartridge.name}
                </h3>
              </div>

              {/* Physical Specifications Card */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crosshair size={13} />
                  <span>Chamber &amp; Case Dimensions</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Bullet Diameter: </span>
                    <strong>{inspectedCartridge.bullet_diameter_in}" {isMetric ? `(${(inspectedCartridge.bullet_diameter_in * 25.4).toFixed(2)} mm)` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Case Length: </span>
                    <strong>{inspectedCartridge.case_length_in}" {isMetric ? `(${(inspectedCartridge.case_length_in * 25.4).toFixed(2)} mm)` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Overall Length (COAL): </span>
                    <strong>{inspectedCartridge.coal_in}" {isMetric ? `(${(inspectedCartridge.coal_in * 25.4).toFixed(2)} mm)` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Water Capacity: </span>
                    <strong>{inspectedCartridge.overflow_capacity_gr_h2o} gr H₂O {(inspectedCartridge.overflow_capacity_gr_h2o * 0.06479891).toFixed(2)} cm³</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Bore Cross-Section: </span>
                    <strong>{(inspectedCartridge.bore_area_sq_in * 6.4516).toFixed(3)} cm² ({inspectedCartridge.bore_area_sq_in} in²)</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Standard Barrel: </span>
                    <strong>{inspectedCartridge.default_barrel_length_in}" {isMetric ? `(${(inspectedCartridge.default_barrel_length_in * 25.4).toFixed(0)} mm)` : ''}</strong>
                  </div>
                </div>
              </div>

              {/* Pressure Rating Card */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={13} />
                  <span>Pressure Ratings (MAP Limit)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Max Bar: </span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-safe)' }}>
                      {inspectedCartridge.max_pressure_bar} bar
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Max PSI: </span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-safe)' }}>
                      {inspectedCartridge.max_pressure_psi ? inspectedCartridge.max_pressure_psi.toLocaleString() : Math.round(inspectedCartridge.max_pressure_bar * 14.5038).toLocaleString()} psi
                    </strong>
                  </div>
                </div>
              </div>

              {/* Primer Pocket Info */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={13} />
                  <span>Primer Ignition Setup</span>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Default Primer Pocket: </span>
                  <strong style={{ textTransform: 'capitalize' }}>
                    {(inspectedCartridge.default_primer_pocket || 'large_rifle').replace('_', ' ')}
                  </strong>
                  {inspectedCartridge.supported_primer_pockets && inspectedCartridge.supported_primer_pockets.length > 1 && (
                    <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--accent-amber)' }}>
                      Dual-Pocket Compatible: Supports both Large and Small rifle primer pockets.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  onClick={() => {
                    onSelectCartridge(inspectedCartridge);
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
                  <span>Load Cartridge into Workstation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
