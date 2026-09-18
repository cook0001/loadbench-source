import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { PrimerPocketSize } from '../../types/primer';

interface CustomWildcatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWildcat: (cartridge: CartridgeSpec) => void;
  isMetric?: boolean;
}

export const CustomWildcatModal: React.FC<CustomWildcatModalProps> = ({
  isOpen,
  onClose,
  onSaveWildcat,
  isMetric: _isMetric,
}) => {
  const [name, setName] = useState<string>('My Custom Wildcat');
  const [bulletDiaIn, setBulletDiaIn] = useState<number>(0.264);
  const [caseLengthIn, setCaseLengthIn] = useState<number>(2.000);
  const [coalIn, setCoalIn] = useState<number>(2.800);
  const [overflowCapacityGrH2O, setOverflowCapacityGrH2O] = useState<number>(55.0);
  const [maxPressurePsi, setMaxPressurePsi] = useState<number>(62000);
  const [barrelLengthIn, setBarrelLengthIn] = useState<number>(24.0);
  const [primerPocket, setPrimerPocket] = useState<PrimerPocketSize>('large_rifle');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const maxBar = Math.round(maxPressurePsi / 14.5038);
    const boreArea = Math.PI * Math.pow(bulletDiaIn / 2, 2) * 0.988;

    const newCartridge: CartridgeSpec = {
      id: `custom_wildcat_${Date.now()}`,
      name: name.trim(),
      standard: 'Wildcat',
      category: 'User Custom Wildcats',
      max_pressure_bar: maxBar,
      max_pressure_psi: maxPressurePsi,
      case_length_in: caseLengthIn,
      coal_in: coalIn,
      bullet_diameter_in: bulletDiaIn,
      bore_diameter_in: Number((bulletDiaIn - 0.008).toFixed(4)),
      groove_diameter_in: bulletDiaIn,
      bore_area_sq_in: Number(boreArea.toFixed(4)),
      overflow_capacity_gr_h2o: overflowCapacityGrH2O,
      default_barrel_length_in: barrelLengthIn,
      default_primer_pocket: primerPocket,
      supported_primer_pockets: [primerPocket],
      default_primer_id: primerPocket === 'small_rifle' ? 'cci_450' : 'fed_210m',
      is_custom: true,
    };

    onSaveWildcat(newCartridge);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '640px', maxWidth: '95vw', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              Create Custom Wildcat Cartridge
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            Enter your custom or proprietary wildcat dimensions below. Once saved, it will be added to your cartridge library and saved in local storage for load development.
          </p>

          <div className="input-field">
            <label className="input-label">Wildcat Cartridge Name</label>
            <input
              type="text"
              className="input-control"
              value={name}
              placeholder="e.g. 6.5 Sherman Short, .25-06 AI, 6 GT Improved"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="input-field">
              <label className="input-label">Bullet Diameter (in)</label>
              <input
                type="number"
                step="0.001"
                className="input-control"
                value={bulletDiaIn}
                onChange={(e) => setBulletDiaIn(parseFloat(e.target.value) || 0.264)}
              />
            </div>

            <div className="input-field">
              <label className="input-label">Case Length (in)</label>
              <input
                type="number"
                step="0.001"
                className="input-control"
                value={caseLengthIn}
                onChange={(e) => setCaseLengthIn(parseFloat(e.target.value) || 2.0)}
              />
            </div>

            <div className="input-field">
              <label className="input-label">Cartridge OAL (in)</label>
              <input
                type="number"
                step="0.001"
                className="input-control"
                value={coalIn}
                onChange={(e) => setCoalIn(parseFloat(e.target.value) || 2.8)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="input-field">
              <label className="input-label">Water Capacity (gr H₂O)</label>
              <input
                type="number"
                step="0.1"
                className="input-control"
                value={overflowCapacityGrH2O}
                onChange={(e) => setOverflowCapacityGrH2O(parseFloat(e.target.value) || 50)}
              />
            </div>

            <div className="input-field">
              <label className="input-label">Max Pressure MAP (psi)</label>
              <input
                type="number"
                step="500"
                className="input-control"
                value={maxPressurePsi}
                onChange={(e) => setMaxPressurePsi(parseFloat(e.target.value) || 60000)}
              />
            </div>

            <div className="input-field">
              <label className="input-label">Default Barrel Length (in)</label>
              <input
                type="number"
                step="0.5"
                className="input-control"
                value={barrelLengthIn}
                onChange={(e) => setBarrelLengthIn(parseFloat(e.target.value) || 24)}
              />
            </div>
          </div>

          <div className="input-field">
            <label className="input-label">Primer Pocket Specification</label>
            <select
              className="input-control"
              value={primerPocket}
              onChange={(e) => setPrimerPocket(e.target.value as PrimerPocketSize)}
            >
              <option value="large_rifle">Large Rifle (Standard Rifle / Magnum)</option>
              <option value="small_rifle">Small Rifle (Benchrest / High Pressure SRP)</option>
              <option value="large_pistol">Large Pistol (.45 / .44 / Handgun)</option>
              <option value="small_pistol">Small Pistol (9mm / .38 / .40 S&amp;W)</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              padding: '10px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              marginTop: '6px',
            }}
          >
            <Check size={16} />
            <span>Save &amp; Load Custom Wildcat into Workbench</span>
          </button>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
