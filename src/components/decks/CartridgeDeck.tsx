import React from 'react';
import { Target } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { formatLength } from '../../utils/formatters';

interface CartridgeDeckProps {
  cartridge: CartridgeSpec;
  onChangeCartridge: (updated: CartridgeSpec) => void;
  barrelLength: number;
  onChangeBarrelLength: (val: number) => void;
  isMetric: boolean;
}

export const CartridgeDeck: React.FC<CartridgeDeckProps> = ({
  cartridge,
  onChangeCartridge,
  barrelLength,
  onChangeBarrelLength,
  isMetric,
}) => {
  return (
    <section className="deck-card">
      <div className="deck-header">
        <div className="deck-title">
          <Target size={14} />
          <span>1. Cartridge & Chamber Geometry</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Standard: <strong>{cartridge.standard}</strong>
        </span>
      </div>

      <div className="deck-grid">
        {/* Case Length */}
        <div className="input-field">
          <label className="input-label">Case Length ({isMetric ? 'mm' : 'in'})</label>
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
          <label className="input-label">Cartridge OAL / COAL ({isMetric ? 'mm' : 'in'})</label>
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

        {/* Case Capacity (gr H2O) */}
        <div className="input-field">
          <label className="input-label">Case Capacity (gr H₂O / cm³)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="number"
              step="0.1"
              className="input-control"
              style={{ flex: 1 }}
              value={cartridge.overflow_capacity_gr_h2o}
              onChange={(e) => {
                onChangeCartridge({
                  ...cartridge,
                  overflow_capacity_gr_h2o: parseFloat(e.target.value) || 1,
                });
              }}
            />
            <span style={{
              alignSelf: 'center',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              minWidth: '50px',
            }}>
              {(cartridge.overflow_capacity_gr_h2o * 0.06479891).toFixed(2)} cm³
            </span>
          </div>
        </div>

        {/* Max Rated Chamber Pressure */}
        <div className="input-field">
          <label className="input-label">Max Allowable Pressure (MAP)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="number"
              step="10"
              className="input-control"
              style={{ flex: 1 }}
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
              alignSelf: 'center',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              {isMetric ? 'bar' : 'psi'}
            </span>
          </div>
        </div>

        {/* Barrel Length */}
        <div className="input-field" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <label className="input-label">Barrel Length</label>
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
              style={{ width: '70px', textAlign: 'right' }}
              value={barrelLength}
              onChange={(e) => onChangeBarrelLength(parseFloat(e.target.value) || 1)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
