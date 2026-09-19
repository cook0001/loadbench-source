import React, { useMemo } from 'react';
import { Target, Droplets, ShieldAlert, Zap } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { PrimerSpec, PrimerPocketSize } from '../../types/primer';
import { formatLength } from '../../utils/formatters';

interface CartridgeDeckProps {
  cartridge: CartridgeSpec;
  onChangeCartridge: (updated: CartridgeSpec) => void;
  barrelLength: number;
  onChangeBarrelLength: (val: number) => void;
  selectedPrimerPocket: PrimerPocketSize;
  onChangePrimerPocket: (pocket: PrimerPocketSize) => void;
  selectedPrimer: PrimerSpec;
  onChangePrimer: (primer: PrimerSpec) => void;
  primers: PrimerSpec[];
  onOpenCaseWaterModal?: () => void;
  isMetric: boolean;
}

export const CartridgeDeck: React.FC<CartridgeDeckProps> = ({
  cartridge,
  onChangeCartridge,
  barrelLength,
  onChangeBarrelLength,
  selectedPrimerPocket,
  onChangePrimerPocket,
  selectedPrimer,
  onChangePrimer,
  primers,
  onOpenCaseWaterModal,
  isMetric,
}) => {
  const supportedPockets = cartridge.supported_primer_pockets || [cartridge.default_primer_pocket || 'large_rifle'];
  const hasDualPockets = supportedPockets.length > 1;

  // Filter primers by active pocket size and group by manufacturer
  const availablePrimers = useMemo(() => {
    return primers.filter(p => p.pocket_size === selectedPrimerPocket);
  }, [primers, selectedPrimerPocket]);

  const primersByManufacturer = useMemo(() => {
    const groups: Record<string, PrimerSpec[]> = {};
    for (const p of availablePrimers) {
      if (!groups[p.manufacturer]) groups[p.manufacturer] = [];
      groups[p.manufacturer].push(p);
    }
    return groups;
  }, [availablePrimers]);

  // Cup piercing warning: if MAP > 60k psi and cup <= 0.020" in rifle
  const isHighPressure = cartridge.max_pressure_psi >= 60000;
  const isThinCup = selectedPrimer.cup_thickness_in <= 0.020 && selectedPrimer.pocket_size.includes('rifle');
  const showPiercingWarning = isHighPressure && isThinCup;

  return (
    <section className="deck-card">
      <div className="deck-header">
        <div className="deck-title">
          <Target size={14} style={{ flexShrink: 0 }} />
          <span>1. Cartridge &amp; Primer Ignition</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
          Standard: <strong style={{ color: 'var(--text-primary)' }}>{cartridge.standard}</strong>
        </span>
      </div>

      <div className="deck-grid">
        {/* Case Length */}
        <div className="input-field">
          <label className="input-label">Case Length (Trim-To) ({isMetric ? 'mm' : 'in'})</label>
          <input
            type="number"
            step="0.001"
            className="input-control"
            value={isMetric ? Number((cartridge.case_length_in * 25.4).toFixed(2)) : cartridge.case_length_in}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChangeCartridge({
                ...cartridge,
                case_length_in: isMetric ? val / 25.4 : val,
              });
            }}
          />
        </div>

        {/* Cartridge Overall Length (COAL) */}
        <div className="input-field">
          <label className="input-label">Cartridge Overall Length (COAL) ({isMetric ? 'mm' : 'in'})</label>
          <input
            type="number"
            step="0.001"
            className="input-control"
            value={isMetric ? Number((cartridge.coal_in * 25.4).toFixed(2)) : cartridge.coal_in}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChangeCartridge({
                ...cartridge,
                coal_in: isMetric ? val / 25.4 : val,
              });
            }}
          />
        </div>

        {/* Case Capacity (gr H2O) with Water Calibrate trigger */}
        <div className="input-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <label className="input-label" style={{ margin: 0 }}>Gross Case Capacity (gr H₂O)</label>
            {onOpenCaseWaterModal && (
              <button
                type="button"
                onClick={onOpenCaseWaterModal}
                title="Calibrate case water volume with dry/wet scale measurements"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                <Droplets size={11} />
                <span>Calibrate H₂O</span>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              step="0.1"
              className="input-control"
              style={{ flex: 1, minWidth: 0 }}
              value={cartridge.overflow_capacity_gr_h2o}
              onChange={(e) => {
                onChangeCartridge({
                  ...cartridge,
                  overflow_capacity_gr_h2o: parseFloat(e.target.value) || 1,
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
              {(cartridge.overflow_capacity_gr_h2o * 0.06479891).toFixed(2)} cm³
            </span>
          </div>
        </div>

        {/* Max Rated Chamber Pressure */}
        <div className="input-field">
          <label className="input-label">Max Allowable Pressure (MAP Limit)</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              step="10"
              className="input-control"
              style={{ flex: 1, minWidth: 0 }}
              value={isMetric ? cartridge.max_pressure_bar : cartridge.max_pressure_psi}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 1000;
                onChangeCartridge({
                  ...cartridge,
                  max_pressure_bar: isMetric ? val : Math.round(val / 14.5038),
                  max_pressure_psi: isMetric ? Math.round(val * 14.5038) : val,
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
              {isMetric ? 'bar' : 'psi'}
            </span>
          </div>
        </div>

        {/* Barrel Length */}
        <div className="input-field" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <label className="input-label">Rifled Barrel Length</label>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {formatLength(barrelLength, 1, isMetric)}
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="2"
              max="36"
              step="0.25"
              className="range-slider"
              value={barrelLength}
              onChange={(e) => onChangeBarrelLength(parseFloat(e.target.value))}
            />
            <input
              type="number"
              step="0.1"
              className="input-control"
              style={{ width: '62px', textAlign: 'right', flexShrink: 0 }}
              value={barrelLength}
              onChange={(e) => onChangeBarrelLength(parseFloat(e.target.value) || 1)}
            />
          </div>
        </div>
      </div>

      {/* --- PRIMER & IGNITION SYSTEM SECTION --- */}
      <div style={{
        marginTop: '6px',
        padding: '10px 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            <Zap size={13} />
            <span>PRIMER &amp; IGNITION DYNAMICS</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Pre-Impulse: +{selectedPrimer.initial_pressure_bar} bar ({Math.round(selectedPrimer.initial_pressure_bar * 14.5038)} psi)
          </div>
        </div>

        {/* Dual Pocket Selector (e.g. 6.5 PRC, 6.5 CM, .308 Palma, .45 ACP) */}
        {hasDualPockets && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '110px', flexShrink: 0 }}>Brass Primer Pocket:</span>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              {supportedPockets.map((p) => {
                const isActive = p === selectedPrimerPocket;
                const label = p === 'small_rifle' ? 'Small Rifle (SRP Brass)' :
                              p === 'large_rifle' ? 'Large Rifle (Factory LRP)' :
                              p === 'small_pistol' ? 'Small Pistol (NT Brass)' : 'Large Pistol (Standard)';
                return (
                  <button
                    key={p}
                    onClick={() => {
                      onChangePrimerPocket(p);
                      // Auto pick matching primer in new pocket
                      const match = primers.find(pr => pr.pocket_size === p && pr.is_magnum === selectedPrimer.is_magnum) ||
                                    primers.find(pr => pr.pocket_size === p);
                      if (match) onChangePrimer(match);
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '10px',
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: '4px',
                      border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      backgroundColor: isActive ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-tertiary)',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Primer Model Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <select
            className="input-control"
            style={{ width: '100%', fontSize: '11px' }}
            value={selectedPrimer.id}
            onChange={(e) => {
              const found = primers.find(p => p.id === e.target.value);
              if (found) onChangePrimer(found);
            }}
          >
            {Object.keys(primersByManufacturer).length > 0 ? (
              Object.entries(primersByManufacturer).map(([mfg, list]) => (
                <optgroup key={mfg} label={`${mfg} (${list.length})`}>
                  {list.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.is_magnum ? '[MAGNUM]' : ''} (Cup: {p.cup_thickness_in}", Brisance: {p.brisance_rating})
                    </option>
                  ))}
                </optgroup>
              ))
            ) : (
              <optgroup label={`${selectedPrimerPocket.replace('_', ' ').toUpperCase()} PRIMERS`}>
                {availablePrimers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_magnum ? '[MAGNUM]' : ''} (Cup: {p.cup_thickness_in}", Brisance: {p.brisance_rating})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {selectedPrimer.description && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3', paddingLeft: '2px' }}>
              {selectedPrimer.description}
            </span>
          )}
        </div>

        {/* Thin Cup Piercing Warning */}
        {showPiercingWarning && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '10px',
            color: 'var(--status-danger)',
          }}>
            <ShieldAlert size={13} style={{ flexShrink: 0 }} />
            <span>
              <strong>Warning:</strong> Thin cup ({selectedPrimer.cup_thickness_in}") risks cratering/piercing at {cartridge.max_pressure_psi.toLocaleString()} psi. Recommend 0.025" thick-cup magnum primer (CCI 450 or Rem 7 1/2).
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
