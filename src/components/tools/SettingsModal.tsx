import React, { useState, useEffect } from 'react';
import { X, Settings, Sliders, Thermometer, ShieldAlert, Check, RotateCcw, User } from 'lucide-react';

export interface LoadBenchSettings {
  isMetric: boolean;
  pressureUnit: 'psi' | 'bar' | 'mpa';
  temperatureUnit: 'f' | 'c';
  odeStepSizeInches: number;
  lagrangeFactor: number;
  heatLossPct: number;
  mapWarningThresholdPct: number;
  defaultAmbientTempF: number;
  defaultAmbientPressureInHg: number;
  monolithicEngravingBar: number;
  enableSoundAlerts: boolean;
  authorName?: string;
  defaultLotPrefix?: string;
  defaultTargetRifle?: string;
}

export const DEFAULT_SETTINGS: LoadBenchSettings = {
  isMetric: false,
  pressureUnit: 'psi',
  temperatureUnit: 'f',
  odeStepSizeInches: 0.05,
  lagrangeFactor: 0.333,
  heatLossPct: 3.5,
  mapWarningThresholdPct: 95,
  defaultAmbientTempF: 70,
  defaultAmbientPressureInHg: 29.92,
  monolithicEngravingBar: 380,
  enableSoundAlerts: false,
  authorName: typeof localStorage !== 'undefined' ? (localStorage.getItem('loadbench_author_name') || '') : '',
  defaultLotPrefix: 'LOT-',
  defaultTargetRifle: '',
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LoadBenchSettings;
  onSaveSettings: (newSettings: LoadBenchSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<LoadBenchSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setForm(settings);
      setSavedSuccess(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(form);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('loadbench_author_name', form.authorName || '');
      localStorage.setItem('loadbench_default_lot_prefix', form.defaultLotPrefix || 'LOT-');
      localStorage.setItem('loadbench_default_rifle', form.defaultTargetRifle || '');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleResetDefaults = () => {
    setForm(DEFAULT_SETTINGS);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95vw', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              LoadBench Workstation Settings &amp; Solver Preferences
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Units & Display */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} />
              <span>Units &amp; Numerical Display</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label className="input-label">Default Unit System</label>
                <select
                  className="input-control"
                  value={form.isMetric ? 'metric' : 'imperial'}
                  onChange={(e) => setForm({ ...form, isMetric: e.target.value === 'metric' })}
                >
                  <option value="imperial">US Imperial (grains, inches, fps, psi)</option>
                  <option value="metric">Metric / European (grams, mm, m/s, bar)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Primary Pressure Unit</label>
                <select
                  className="input-control"
                  value={form.pressureUnit}
                  onChange={(e) => setForm({ ...form, pressureUnit: e.target.value as any })}
                >
                  <option value="psi">PSI (Pounds per square inch)</option>
                  <option value="bar">Bar (CIP standard)</option>
                  <option value="mpa">MPa (Megapascals)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Temperature Scale</label>
                <select
                  className="input-control"
                  value={form.temperatureUnit}
                  onChange={(e) => setForm({ ...form, temperatureUnit: e.target.value as any })}
                >
                  <option value="f">Fahrenheit (°F)</option>
                  <option value="c">Celsius (°C)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Safety Overpressure Threshold</label>
                <select
                  className="input-control"
                  value={form.mapWarningThresholdPct}
                  onChange={(e) => setForm({ ...form, mapWarningThresholdPct: parseInt(e.target.value, 10) })}
                >
                  <option value="90">90% of MAP (Strict Safety Margin)</option>
                  <option value="95">95% of MAP (Standard Industry Safety Alert)</option>
                  <option value="100">100% of MAP (SAAMI Maximum Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Interior Ballistics Solver Fidelity */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} />
              <span>Interior Ballistics Solver Parameters</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="input-label">ODE Integration Step Size</label>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {form.odeStepSizeInches}"
                  </span>
                </div>
                <select
                  className="input-control"
                  value={form.odeStepSizeInches}
                  onChange={(e) => setForm({ ...form, odeStepSizeInches: parseFloat(e.target.value) })}
                >
                  <option value="0.05">0.05" Standard (Fast, High Accuracy)</option>
                  <option value="0.02">0.02" High Resolution (Ultra-Fine Curves)</option>
                  <option value="0.01">0.01" Lab Benchmark</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="input-label">Lagrange Inertia Factor</label>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {form.lagrangeFactor}
                  </span>
                </div>
                <select
                  className="input-control"
                  value={form.lagrangeFactor}
                  onChange={(e) => setForm({ ...form, lagrangeFactor: parseFloat(e.target.value) })}
                >
                  <option value="0.333">0.333 (Lagrange 1/3 Gradient - Standard)</option>
                  <option value="0.350">0.350 (Heavy Ejecta Gas Mass)</option>
                  <option value="0.315">0.315 (Light Gas Gradient)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="input-label">Bore Convective Heat Loss</label>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {form.heatLossPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="0.5"
                  value={form.heatLossPct}
                  onChange={(e) => setForm({ ...form, heatLossPct: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="input-label">Monolithic Engraving P0 (bar)</label>
                <input
                  type="number"
                  className="input-control"
                  value={form.monolithicEngravingBar}
                  onChange={(e) => setForm({ ...form, monolithicEngravingBar: parseInt(e.target.value, 10) || 380 })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ambient Weather Defaults */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Thermometer size={14} />
              <span>Default Ambient Weather Standards</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label className="input-label">Ambient Baseline Temp (°F)</label>
                <input
                  type="number"
                  className="input-control"
                  value={form.defaultAmbientTempF}
                  onChange={(e) => setForm({ ...form, defaultAmbientTempF: parseFloat(e.target.value) || 70 })}
                />
              </div>

              <div>
                <label className="input-label">Barometric Pressure (inHg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-control"
                  value={form.defaultAmbientPressureInHg}
                  onChange={(e) => setForm({ ...form, defaultAmbientPressureInHg: parseFloat(e.target.value) || 29.92 })}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Reloader & Ballistician Profile */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} />
              <span>Reloader &amp; Ballistician Profile</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label className="input-label">Author / Reloader Name</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Daniel C."
                  value={form.authorName || ''}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label">Default Lot Prefix</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. LOT-"
                  value={form.defaultLotPrefix || ''}
                  onChange={(e) => setForm({ ...form, defaultLotPrefix: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label">Primary Target Rifle</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Tikka T3x 6.5 CM"
                  value={form.defaultTargetRifle || ''}
                  onChange={(e) => setForm({ ...form, defaultTargetRifle: e.target.value })}
                />
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Used for auto-populating metadata in <code>.loadbench</code> recipe exports, ArmoryVault ingestion payloads, and benchrest range cards.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <button
            onClick={handleResetDefaults}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} />
            <span>Reset to Factory Defaults</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              className="btn-action"
              style={{ padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Check size={13} />
              <span>{savedSuccess ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
