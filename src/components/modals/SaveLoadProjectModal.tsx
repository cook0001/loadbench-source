import React, { useState, useEffect } from 'react';
import { X, Save, Download, Copy, Check } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec, PrimerPocketSize } from '../../types/primer';
import { SimulationResult } from '../../types/ballistics';

interface SaveLoadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  primer: PrimerSpec;
  primerPocket: PrimerPocketSize;
  chargeGrains: number;
  barrelLengthInches: number;
  barrelTwistInches: number;
  seatingDepthInches: number;
  powderTemperatureF: number;
  isTouchingLands: boolean;
  baOffsetPct: number;
  simulationResult: SimulationResult;
  defaultAuthor?: string;
  defaultLotPrefix?: string;
  defaultTargetRifle?: string;
}

export const SaveLoadProjectModal: React.FC<SaveLoadProjectModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  primer,
  primerPocket,
  chargeGrains,
  barrelLengthInches,
  barrelTwistInches,
  seatingDepthInches,
  powderTemperatureF,
  isTouchingLands,
  baOffsetPct,
  simulationResult,
  defaultAuthor,
  defaultLotPrefix = 'LOT-',
  defaultTargetRifle,
}) => {
  const [recipeTitle, setRecipeTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [batchSize, setBatchSize] = useState(50);
  const [targetFirearm, setTargetFirearm] = useState('');
  const [cbtoInches, setCbtoInches] = useState('');
  const [jumpToLandsInches, setJumpToLandsInches] = useState('');
  const [notes, setNotes] = useState('');
  const [fileExt, setFileExt] = useState<'.loadbench' | '.ldb'>('.loadbench');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = defaultLotPrefix || 'LOT-';
      setRecipeTitle(`${cartridge.name} - ${projectile.weight_grains}gr ${projectile.name}`);
      const storedAuthor =
        defaultAuthor ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('loadbench_author_name') || '' : '');
      const storedRifle =
        defaultTargetRifle ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('loadbench_default_rifle') || '' : '');
      setAuthor(storedAuthor);
      setTargetFirearm(storedRifle);
      setLotNumber(`${prefix}${todayStr}-01`);
      setBatchSize(50);
      // Auto-compute baseline CBTO and jump estimates
      const estCbto = Number((cartridge.coal_in - (projectile.length_in * 0.42)).toFixed(3));
      setCbtoInches(String(estCbto));
      setJumpToLandsInches(isTouchingLands ? '0.000' : '0.020');
      setNotes('');
      setCopied(false);
    }
  }, [isOpen, cartridge, projectile, defaultAuthor, defaultLotPrefix, defaultTargetRifle, isTouchingLands]);

  if (!isOpen) return null;

  const buildPayload = () => {
    const coal = cartridge.case_length_in + (projectile.length_in - seatingDepthInches);
    const chargeGrams = Number((chargeGrains * 0.06479891).toFixed(4));
    const grossCaseH2o = cartridge.overflow_capacity_gr_h2o;
    const grossCaseCm3 = grossCaseH2o * 0.06479891;
    const seatedBulletVolCm3 =
      Math.PI * Math.pow((cartridge.bullet_diameter_in * 2.54) / 2, 2) * (seatingDepthInches * 2.54) * 0.95;
    const netCaseCm3 = Math.max(0.1, grossCaseCm3 - seatedBulletVolCm3);
    const powderBulkVolCm3 = chargeGrams / (propellant.bulk_density_g_cm3 || 0.92);
    const fillRatioPct = Number(((powderBulkVolCm3 / netCaseCm3) * 100).toFixed(1));

    return {
      $schema: 'https://armstrader.store/schemas/loadbench-recipe-v1.json',
      format: 'loadbench_recipe',
      version: '1.0.0',
      metadata: {
        recipe_title: recipeTitle || `${cartridge.name} Load Recipe`,
        author: author || 'Bench Ballistician',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lot_number: lotNumber || 'LOT-DEFAULT',
        batch_size: batchSize || 50,
        target_firearm: targetFirearm || null,
        notes: notes || '',
      },
      cartridge: {
        id: cartridge.id,
        name: cartridge.name,
        standard: cartridge.standard,
        case_length_in: cartridge.case_length_in,
        bullet_diameter_in: cartridge.bullet_diameter_in,
        overflow_capacity_gr_h2o: cartridge.overflow_capacity_gr_h2o,
        max_pressure_psi: cartridge.max_pressure_psi,
        max_pressure_bar: cartridge.max_pressure_bar,
      },
      projectile: {
        id: projectile.id,
        name: projectile.name,
        manufacturer: projectile.manufacturer,
        weight_grains: projectile.weight_grains,
        length_in: projectile.length_in,
        bc_g1: projectile.bc_g1,
        bc_g7: projectile.bc_g7 || null,
      },
      propellant: {
        id: propellant.id,
        name: propellant.name,
        manufacturer: propellant.manufacturer,
        burn_rate_ba: propellant.burn_rate_ba,
        heat_of_explosion_j_g: propellant.heat_of_explosion_j_g,
        bulk_density_g_cm3: propellant.bulk_density_g_cm3,
      },
      primer: {
        id: primer.id,
        name: primer.name,
        manufacturer: primer.manufacturer,
        pocket_size: primerPocket,
        category: primer.category,
        is_magnum: primer.is_magnum,
      },
      charge: {
        charge_grains: chargeGrains,
        charge_grams: chargeGrams,
        filling_ratio_pct: fillRatioPct,
        compressed: fillRatioPct > 100,
        temperature_f: powderTemperatureF,
        ba_offset_pct: baOffsetPct,
      },
      dimensions: {
        barrel_length_in: barrelLengthInches,
        barrel_twist_in: barrelTwistInches,
        seating_depth_in: seatingDepthInches,
        coal_in: Number(coal.toFixed(3)),
        cbto_in: cbtoInches ? parseFloat(cbtoInches) : null,
        jump_to_lands_in: jumpToLandsInches ? parseFloat(jumpToLandsInches) : null,
        is_touching_lands: isTouchingLands,
      },
      performance: {
        muzzle_velocity_fps: Math.round(simulationResult.muzzle_velocity_fps),
        muzzle_velocity_ms: Number((simulationResult.muzzle_velocity_fps * 0.3048).toFixed(1)),
        max_pressure_psi: Math.round(simulationResult.max_pressure_psi),
        max_pressure_bar: Number(simulationResult.max_pressure_bar.toFixed(1)),
        muzzle_energy_ft_lbs: Math.round(simulationResult.muzzle_energy_ft_lbs),
        propellant_burned_pct: Number(simulationResult.propellant_burnt_pct.toFixed(1)),
        barrel_time_ms: Number(simulationResult.barrel_time_ms.toFixed(4)),
      },
    };
  };

  const handleDownload = () => {
    const payload = buildPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/vnd.loadbench.recipe+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeCartridge = cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeLot = (lotNumber || 'RECIPE').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeCartridge}_${projectile.weight_grains}gr_${safeLot}${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save author name preference if altered
    if (author && typeof localStorage !== 'undefined') {
      localStorage.setItem('loadbench_author_name', author);
    }
    onClose();
  };

  const handleCopy = () => {
    const payload = buildPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Save Load Recipe (.loadbench / .ldb)
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Export this complete handloading project to a standalone file. Fully compatible with{' '}
            <strong>ArmoryVault Desktop &amp; Tauri</strong> ammo inventory ingestion, and printable on benchrest range cards.
          </div>

          {/* Section 1: Recipe Identity */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label">Recipe Title</label>
              <input
                type="text"
                className="input-control"
                value={recipeTitle}
                onChange={(e) => setRecipeTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">File Format</label>
              <select
                className="input-control"
                value={fileExt}
                onChange={(e) => setFileExt(e.target.value as '.loadbench' | '.ldb')}
              >
                <option value=".loadbench">.loadbench (Standard)</option>
                <option value=".ldb">.ldb (Compact)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Author, Lot & Batch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '10px' }}>
            <div>
              <label className="input-label">Author / Ballistician</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Daniel C."
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Production Lot #</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. LOT-20260918-01"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Batch Size</label>
              <input
                type="number"
                min="1"
                max="10000"
                className="input-control"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          {/* Section 3: Rifle & Seating Geometry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label">Target Firearm / Rifle</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Tikka T3x Tac A1"
                value={targetFirearm}
                onChange={(e) => setTargetFirearm(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">CBTO (in)</label>
              <input
                type="number"
                step="0.001"
                className="input-control"
                placeholder="e.g. 2.185"
                value={cbtoInches}
                onChange={(e) => setCbtoInches(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Jump to Lands (in)</label>
              <input
                type="number"
                step="0.001"
                className="input-control"
                placeholder="e.g. 0.020"
                value={jumpToLandsInches}
                onChange={(e) => setJumpToLandsInches(e.target.value)}
              />
            </div>
          </div>

          {/* Section 4: Ballistics Summary Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '11px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Muzzle Velocity:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(simulationResult.muzzle_velocity_fps)} fps
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Chamber Pressure:</span>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {Math.round(simulationResult.max_pressure_psi)} psi
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Charge / Powder:</span>
              <div style={{ fontWeight: 600 }}>
                {chargeGrains} gr {propellant.name}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Primer:</span>
              <div style={{ fontWeight: 600 }}>
                {primer.name}
              </div>
            </div>
          </div>

          {/* Section 5: Engineering & Range Notes */}
          <div>
            <label className="input-label">Engineering &amp; Range Notes</label>
            <textarea
              className="input-control"
              rows={3}
              style={{ resize: 'vertical', fontSize: '11px' }}
              placeholder="e.g. Virgin Alpha brass, 0.002 neck tension, tested at 65°F elevation 1200ft, SD 4.2 fps across 10 rounds..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: 'none',
              color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied JSON to Clipboard!' : 'Copy JSON'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn-action" style={{ padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Download size={13} />
              <span>Download {fileExt}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
