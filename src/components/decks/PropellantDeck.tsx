import React, { useState, useMemo } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { PropellantSpec } from '../../types/propellant';
import { formatWeight } from '../../utils/formatters';

interface PropellantDeckProps {
  propellants: PropellantSpec[];
  propellant: PropellantSpec;
  onChangePropellant: (updated: PropellantSpec) => void;
  chargeGrains: number;
  onChangeChargeGrains: (val: number) => void;
  loadingDensityPct: number;
  baOffsetPct: number;
  onChangeBaOffsetPct: (val: number) => void;
  isMetric: boolean;
}

export const PropellantDeck: React.FC<PropellantDeckProps> = ({
  propellants,
  propellant,
  onChangePropellant,
  chargeGrains,
  onChangeChargeGrains,
  loadingDensityPct,
  baOffsetPct,
  onChangeBaOffsetPct,
  isMetric,
}) => {
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    propellants.forEach(p => set.add(p.manufacturer));
    return Array.from(set).sort();
  }, [propellants]);

  const filteredPropellants = useMemo(() => {
    if (brandFilter === 'all') return propellants;
    return propellants.filter(p => p.manufacturer === brandFilter);
  }, [propellants, brandFilter]);

  const groupedPropellants = useMemo(() => {
    const groups: Record<string, PropellantSpec[]> = {};
    filteredPropellants.forEach(p => {
      if (!groups[p.manufacturer]) groups[p.manufacturer] = [];
      groups[p.manufacturer].push(p);
    });
    return groups;
  }, [filteredPropellants]);

  // Color code filling ratio: <85% light blue, 85-100% emerald, 100-105% amber (compressed), >105% red (heavy compression)
  const getFillColor = (pct: number) => {
    if (pct > 105) return 'var(--status-danger)';
    if (pct > 100) return 'var(--status-caution)';
    if (pct >= 85) return 'var(--status-safe)';
    return 'var(--accent-blue)';
  };

  return (
    <section className="deck-card">
      <div className="deck-header">
        <div className="deck-title">
          <Flame size={14} color="#f97316" style={{ flexShrink: 0 }} />
          <span>3. Propellant & Powder Charge</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
          Geometry: <strong>{propellant.grain_geometry}</strong>
        </span>
      </div>

      {/* Powder Selector & Brand Filter */}
      <div className="input-field">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <label className="input-label">Select Propellant ({filteredPropellants.length} of {propellants.length})</label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '10px',
              padding: '2px 6px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Brands ({propellants.length})</option>
            {manufacturers.map(m => (
              <option key={m} value={m}>
                {m} ({propellants.filter(p => p.manufacturer === m).length})
              </option>
            ))}
          </select>
        </div>

        <select
          className="input-control"
          value={propellant.id}
          onChange={(e) => {
            const found = propellants.find(p => p.id === e.target.value);
            if (found) onChangePropellant(found);
          }}
          style={{ width: '100%', minWidth: 0, maxWidth: '100%', textOverflow: 'ellipsis' }}
        >
          {Object.entries(groupedPropellants).map(([mfg, list]) => (
            <optgroup key={mfg} label={`── ${mfg.toUpperCase()} (${list.length}) ──`}>
              {list.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Ba: {p.burn_rate_ba} | {p.grain_geometry})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Charge Weight Slider & Stepper */}
      <div className="input-field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <label className="input-label">Charge Weight</label>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {formatWeight(chargeGrains, 1, isMetric)}
          </span>
        </div>
        <div className="slider-container">
          <button
            onClick={() => onChangeChargeGrains(Number((chargeGrains - 0.1).toFixed(1)))}
            style={{ ...stepBtnStyle, flexShrink: 0 }}
            title="Step -0.1 gr"
          >
            -0.1
          </button>
          <input
            type="range"
            min="5"
            max="120"
            step="0.1"
            className="range-slider"
            value={chargeGrains}
            onChange={(e) => onChangeChargeGrains(parseFloat(e.target.value))}
          />
          <button
            onClick={() => onChangeChargeGrains(Number((chargeGrains + 0.1).toFixed(1)))}
            style={{ ...stepBtnStyle, flexShrink: 0 }}
            title="Step +0.1 gr"
          >
            +0.1
          </button>
          <input
            type="number"
            step="0.1"
            className="input-control"
            style={{ width: '62px', textAlign: 'right', flexShrink: 0 }}
            value={chargeGrains}
            onChange={(e) => onChangeChargeGrains(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Loading Density / Fill Ratio Progress Meter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Filling Ratio (Loading Density):</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: getFillColor(loadingDensityPct),
            flexShrink: 0
          }}>
            {loadingDensityPct.toFixed(1)}% {loadingDensityPct > 100 ? '(Compressed)' : ''}
          </span>
        </div>
        <div style={{
          height: '6px',
          width: '100%',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '3px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, loadingDensityPct)}%`,
            backgroundColor: getFillColor(loadingDensityPct),
            borderRadius: '3px',
            transition: 'width 0.15s ease',
          }} />
        </div>
      </div>

      {/* Burn Rate Factor (Ba) Calibration Slider */}
      <div className="input-field" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <Sparkles size={12} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Ba Calibration Offset
            </label>
          </div>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: baOffsetPct === 0 ? 'var(--text-muted)' : (baOffsetPct > 0 ? 'var(--status-caution)' : 'var(--accent-blue)'),
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {baOffsetPct >= 0 ? `+${baOffsetPct.toFixed(1)}%` : `${baOffsetPct.toFixed(1)}%`} (Ba: {(propellant.burn_rate_ba * (1 + baOffsetPct / 100)).toFixed(4)})
          </span>
        </div>
        <div className="slider-container">
          <input
            type="range"
            min="-15"
            max="15"
            step="0.5"
            className="range-slider"
            value={baOffsetPct}
            onChange={(e) => onChangeBaOffsetPct(parseFloat(e.target.value))}
          />
          <button
            onClick={() => onChangeBaOffsetPct(0)}
            style={{
              ...stepBtnStyle,
              fontSize: '10px',
              padding: '2px 6px',
              flexShrink: 0
            }}
            title="Reset to factory baseline Ba"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};

const stepBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '3px 8px',
  fontSize: '11px',
  fontFamily: 'var(--font-mono)',
};
