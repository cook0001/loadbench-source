import React, { useState, useMemo } from 'react';
import { X, Search, Zap, Check, ShieldAlert, Flame, Gauge } from 'lucide-react';
import { PrimerSpec, PrimerPocketSize } from '../../types/primer';

interface PrimerDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  primers: PrimerSpec[];
  activePrimer: PrimerSpec;
  onSelectPrimer: (primer: PrimerSpec) => void;
  activePocketSize: PrimerPocketSize;
  onChangePocketSize?: (pocket: PrimerPocketSize) => void;
}

export const PrimerDatabaseModal: React.FC<PrimerDatabaseModalProps> = ({
  isOpen,
  onClose,
  primers,
  activePrimer,
  onSelectPrimer,
  activePocketSize,
  onChangePocketSize,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pocketFilter, setPocketFilter] = useState<string>(activePocketSize);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [selectedPrimerId, setSelectedPrimerId] = useState<string>(activePrimer.id);

  // Available manufacturers
  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    primers.forEach(p => set.add(p.manufacturer));
    return Array.from(set).sort();
  }, [primers]);

  // Filtered primers
  const filteredPrimers = useMemo(() => {
    return primers.filter(p => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesBrand = p.manufacturer.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc) return false;
      }
      // Pocket size
      if (pocketFilter !== 'all' && p.pocket_size !== pocketFilter) return false;
      // Category
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      // Brand
      if (brandFilter !== 'all' && p.manufacturer !== brandFilter) return false;
      return true;
    });
  }, [primers, searchTerm, pocketFilter, categoryFilter, brandFilter]);

  const inspectedPrimer = useMemo(() => {
    return primers.find(p => p.id === selectedPrimerId) || filteredPrimers[0] || primers[0];
  }, [primers, selectedPrimerId, filteredPrimers]);

  if (!isOpen) return null;

  const handleApply = (primer: PrimerSpec) => {
    if (primer.pocket_size !== activePocketSize && onChangePocketSize) {
      onChangePocketSize(primer.pocket_size);
    }
    onSelectPrimer(primer);
    onClose();
  };

  const getPocketLabel = (pocket: PrimerPocketSize) => {
    switch (pocket) {
      case 'small_rifle': return 'Small Rifle';
      case 'large_rifle': return 'Large Rifle';
      case 'small_pistol': return 'Small Pistol';
      case 'large_pistol': return 'Large Pistol';
      case 'bmg_50': return '.50 BMG Heavy Rifle';
      default: return pocket;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '960px', width: '95vw', height: '88vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>
                Global Primer Library &amp; Ignition Dynamics
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                109 verified rifle &amp; pistol primers across 15 manufacturers • Thermochemical impulse &amp; cup rigidity models
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
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Top Row: Search & Brand */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by primer name, model (e.g., 205MAR, BR-4, 450, KVB), brand..."
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
                <option value="all">All Brands ({manufacturers.length})</option>
                {manufacturers.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>Category:</span>
              <select
                className="input-control"
                style={{ fontSize: '11px', minWidth: '130px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="standard">Standard</option>
                <option value="magnum">Magnum</option>
                <option value="match_standard">Match Standard</option>
                <option value="match_magnum">Match Magnum</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Pocket Size Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
              Pocket Size:
            </span>
            {[
              { id: 'all', label: 'All Pockets' },
              { id: 'small_rifle', label: 'Small Rifle (SRP)' },
              { id: 'large_rifle', label: 'Large Rifle (LRP)' },
              { id: 'small_pistol', label: 'Small Pistol (SPP)' },
              { id: 'large_pistol', label: 'Large Pistol (LPP)' },
              { id: 'bmg_50', label: '.50 BMG Heavy' },
            ].map(p => {
              const isActive = pocketFilter === p.id;
              const count = p.id === 'all' 
                ? primers.length 
                : primers.filter(pr => pr.pocket_size === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setPocketFilter(p.id)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '4px',
                    border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    backgroundColor: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Split View */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column: Primer List */}
          <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid var(--border-color)', padding: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Showing {filteredPrimers.length} of {primers.length} primers</span>
              {filteredPrimers.length === 0 && <span style={{ color: 'var(--accent-orange)' }}>No matches found</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredPrimers.map((p) => {
                const isSelected = p.id === inspectedPrimer.id;
                const isCurrentActive = p.id === activePrimer.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPrimerId(p.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '5px',
                      border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                          {p.name}
                        </span>
                        {isCurrentActive && (
                          <span style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--accent-green)',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}>
                            Active Load
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: p.is_magnum ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-tertiary)',
                        color: p.is_magnum ? 'var(--status-danger)' : 'var(--text-muted)',
                        border: `1px solid ${p.is_magnum ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)'}`,
                      }}>
                        {p.is_magnum ? 'MAGNUM' : 'STANDARD'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>Mfg: <strong style={{ color: 'var(--text-secondary)' }}>{p.manufacturer}</strong></span>
                      <span>Cup: <strong style={{ color: p.cup_thickness_in >= 0.025 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>{p.cup_thickness_in}"</strong></span>
                      <span>Brisance: <strong style={{ color: 'var(--accent-cyan)' }}>{p.brisance_rating}</strong></span>
                      <span>Impulse: <strong style={{ color: 'var(--text-secondary)' }}>+{p.initial_pressure_bar} bar</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Primer Inspector & Physics Card */}
          <div style={{ width: '380px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {inspectedPrimer.manufacturer} Priming System
                </span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {inspectedPrimer.name}
                </div>
              </div>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}>
                {getPocketLabel(inspectedPrimer.pocket_size)}
              </span>
            </div>

            {/* Description Box */}
            <div style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: '1.45',
              marginBottom: '14px',
            }}>
              {inspectedPrimer.description}
            </div>

            {/* Ballistic & Thermochemical Properties Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                  <Zap size={11} color="var(--accent-cyan)" />
                  <span>BRISANCE RATING</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {inspectedPrimer.brisance_rating.toFixed(2)}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  {inspectedPrimer.brisance_rating > 1.1 ? 'Hot Magnum Flame' : inspectedPrimer.brisance_rating >= 0.95 ? 'Standard Rifle Baseline' : 'Mild / Pistol Velocity'}
                </div>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                  <ShieldAlert size={11} color={inspectedPrimer.cup_thickness_in >= 0.025 ? 'var(--accent-green)' : 'var(--accent-orange)'} />
                  <span>CUP THICKNESS</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: inspectedPrimer.cup_thickness_in >= 0.025 ? 'var(--accent-green)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {inspectedPrimer.cup_thickness_in}"
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  {inspectedPrimer.cup_thickness_in >= 0.025 ? 'Heavy AR/Magnum Cup' : inspectedPrimer.cup_thickness_in >= 0.020 ? 'Standard Rifle Cup' : 'Pistol / Low Pressure'}
                </div>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                  <Gauge size={11} color="var(--accent-gold)" />
                  <span>PRE-IGNITION IMPULSE</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  +{inspectedPrimer.initial_pressure_bar} bar
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ~{Math.round(inspectedPrimer.initial_pressure_bar * 14.5038).toLocaleString()} psi pre-charge
                </div>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                  <Flame size={11} color="var(--accent-orange)" />
                  <span>FLAME TEMPERATURE</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {inspectedPrimer.flash_temp_k} K
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Gas Vol: {inspectedPrimer.gas_volume_cm3} cm³
                </div>
              </div>
            </div>

            {/* Suitability & Pressure Advisory */}
            <div style={{
              padding: '10px 12px',
              backgroundColor: inspectedPrimer.cup_thickness_in < 0.022 && inspectedPrimer.pocket_size.includes('rifle') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.08)',
              borderRadius: '6px',
              border: `1px solid ${inspectedPrimer.cup_thickness_in < 0.022 && inspectedPrimer.pocket_size.includes('rifle') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.25)'}`,
              marginBottom: 'auto',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: inspectedPrimer.cup_thickness_in < 0.022 && inspectedPrimer.pocket_size.includes('rifle') ? 'var(--status-danger)' : 'var(--accent-cyan)', marginBottom: '4px' }}>
                {inspectedPrimer.cup_thickness_in < 0.022 && inspectedPrimer.pocket_size.includes('rifle')
                  ? 'Pressure Alert: Thin Cup Warning'
                  : 'Chamber Ignition Dynamics'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {inspectedPrimer.pocket_size.includes('rifle') ? (
                  inspectedPrimer.cup_thickness_in >= 0.025
                    ? 'Engineered for high chamber pressures (>60,000 psi) and semi-automatic floating firing pins (eliminates slamfires and cratering).'
                    : 'Recommended for moderate pressure rifle cartridges (<55,000 psi). At higher pressures, primer cup cratering or piercing risk increases.'
                ) : (
                  'Tuned for handgun striker mechanisms and hammer springs. Provides rapid flame propagation in compact combustion spaces.'
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handleApply(inspectedPrimer)}
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
              {inspectedPrimer.pocket_size !== activePocketSize && (
                <div style={{ fontSize: '10px', color: 'var(--accent-orange)', textAlign: 'center' }}>
                  Pocket size differs from active brass ({getPocketLabel(activePocketSize)}). Applying will switch brass pocket.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
