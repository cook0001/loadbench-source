import React, { useState } from 'react';
import { X, Layers, Compass, ExternalLink, Download, Check, FileText, Copy } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';
import { SimulationResult } from '../../types/ballistics';

interface EcosystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  seatingDepthInches: number;
  primer: PrimerSpec;
  barrelLengthInches: number;
  result: SimulationResult;
  isMetric: boolean;
}

export const EcosystemModal: React.FC<EcosystemModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  chargeGrains,
  seatingDepthInches,
  primer,
  barrelLengthInches,
  result,
  isMetric: _isMetric,
}) => {
  const [activeTab, setActiveTab] = useState<'armoryvault' | 'wildcat' | 'armstrader'>('armoryvault');
  const [roundCount, setRoundCount] = useState<number>(50);
  const [firearmName, setFirearmName] = useState<string>('Custom Rifle');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Build ArmoryVault Ammo JSON record
  const armoryVaultRecord = {
    caliber: cartridge.name,
    category: cartridge.category || 'Rifle',
    type: 'handload' as const,
    count: roundCount,
    manufacturer: 'LoadBench Handload',
    bullet_manufacturer: projectile.manufacturer,
    grain: projectile.weight_grains,
    projectile: projectile.name,
    powder: `${propellant.manufacturer} ${propellant.name}`,
    powderCharge: chargeGrains,
    primer_type: primer.pocket_size,
    primer: `${primer.manufacturer} ${primer.name}`,
    brass: 'Custom Prepped',
    oal: cartridge.coal_in || (cartridge.case_length_in + projectile.length_in - seatingDepthInches),
    notes: `LoadBench Simulated Load | Muzzle Vel: ${Math.round(result.muzzle_velocity_fps)} fps | Peak Press: ${Math.round(result.max_pressure_psi).toLocaleString()} psi (${result.max_pressure_bar.toFixed(0)} bar) | Barrel: ${barrelLengthInches}" | Seating: ${seatingDepthInches}"`,
    isPlusP: result.max_pressure_bar > cartridge.max_pressure_bar,
  };

  // Build CSV Row
  const csvHeaders = 'caliber,manufacturer,name,bullet_type,grain_weight,quantity,rounds_per_box,box_price,cost_per_round,location,lot_number,notes';
  const csvRow = `"${cartridge.name}","LoadBench Handload","${projectile.name}","Handload",${projectile.weight_grains},${roundCount},${roundCount},0,0,"Bench Lot 1","LB-${Date.now().toString().slice(-6)}","${armoryVaultRecord.notes.replace(/"/g, '""')}"`;
  const armoryVaultCsv = `${csvHeaders}\n${csvRow}`;

  // Build Wildcat Studio JSON record
  const wildcatStudioRecord = {
    id: cartridge.id,
    name: cartridge.name,
    category: cartridge.category || '⭐ Custom Wildcats & User Designs',
    standard: 'Wildcat',
    units: 'imperial',
    rim_type: 'rimless',
    rim_diameter: cartridge.rim_diameter_in || cartridge.base_diameter_in || 0.473,
    rim_thickness: 0.054,
    base_diameter: cartridge.base_diameter_in || 0.470,
    shoulder_start_diameter: cartridge.base_diameter_in ? cartridge.base_diameter_in * 0.96 : 0.450,
    body_length: cartridge.case_length_in * 0.70,
    shoulder_length: cartridge.case_length_in * 0.12,
    shoulder_angle: 30.0,
    neck_diameter_base: cartridge.bullet_diameter_in + 0.024,
    neck_diameter_mouth: cartridge.bullet_diameter_in + 0.024,
    case_length: cartridge.case_length_in,
    case_length_in: cartridge.case_length_in,
    bullet_diameter: cartridge.bullet_diameter_in,
    bullet_diameter_in: cartridge.bullet_diameter_in,
    bullet_length: projectile.length_in,
    bullet_weight_grains: projectile.weight_grains,
    coal: cartridge.coal_in || 2.800,
    seating_depth: seatingDepthInches,
    max_pressure_bar: cartridge.max_pressure_bar,
    overflow_capacity_grains_h2o: cartridge.overflow_capacity_gr_h2o,
  };

  // Build universal .vol line
  const volLine = `"${cartridge.name}",${cartridge.overflow_capacity_gr_h2o.toFixed(1)},${cartridge.case_length_in.toFixed(3)},${cartridge.bullet_diameter_in.toFixed(3)},${(cartridge.bore_area_sq_in * 6.4516).toFixed(3)},${cartridge.groove_diameter_in || cartridge.bullet_diameter_in},${cartridge.max_pressure_bar},"Wildcat",${cartridge.coal_in?.toFixed(3) || '2.800'}`;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '95vw', maxHeight: '88vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              LoadBench Ecosystem Bridge &amp; Integration Hub
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <button
            onClick={() => setActiveTab('armoryvault')}
            style={{
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              borderBottom: activeTab === 'armoryvault' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              backgroundColor: activeTab === 'armoryvault' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'armoryvault' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <Layers size={14} />
            <span>ArmoryVault Reloading Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('wildcat')}
            style={{
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              borderBottom: activeTab === 'wildcat' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              backgroundColor: activeTab === 'wildcat' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'wildcat' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <Compass size={14} />
            <span>Wildcat Studio (.qdf &amp; .vol)</span>
          </button>

          <button
            onClick={() => setActiveTab('armstrader')}
            style={{
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              borderBottom: activeTab === 'armstrader' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              backgroundColor: activeTab === 'armstrader' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'armstrader' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={14} />
            <span>ArmsTrader Store &amp; Community</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTab === 'armoryvault' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  Export Handload to ArmoryVault Desktop &amp; Companion
                </h4>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                  Generate an ArmoryVault Handload Card to automatically import this load recipe into your Ammo &amp; Reloading inventory.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label className="input-label">Batch Round Count to Add</label>
                  <input
                    type="number"
                    className="input-control"
                    value={roundCount}
                    onChange={(e) => setRoundCount(parseInt(e.target.value, 10) || 50)}
                  />
                </div>
                <div>
                  <label className="input-label">Target Firearm Assignment (Optional)</label>
                  <input
                    type="text"
                    className="input-control"
                    value={firearmName}
                    onChange={(e) => setFirearmName(e.target.value)}
                    placeholder="e.g. Tikka T3x Tac A1"
                  />
                </div>
              </div>

              {/* JSON Card Preview */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    ArmoryVault Handload Card Payload Preview
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(armoryVaultRecord, null, 2))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                  >
                    {copied ? <Check size={11} color="var(--status-safe)" /> : <Copy size={11} />}
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre style={{ margin: 0, maxHeight: '160px', overflowY: 'auto', fontSize: '10px', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--bg-tertiary)', padding: '8px', borderRadius: '4px', color: 'var(--text-primary)' }}>
                  {JSON.stringify(armoryVaultRecord, null, 2)}
                </pre>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={() => downloadFile(JSON.stringify(armoryVaultRecord, null, 2), `${cartridge.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_handload.avr`, 'application/json')}
                  className="btn-primary"
                  style={{ flex: 1, padding: '9px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Download size={13} />
                  <span>Download ArmoryVault Handload Card (.avr / .json)</span>
                </button>

                <button
                  onClick={() => downloadFile(armoryVaultCsv, `${cartridge.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_armoryvault.csv`, 'text/csv')}
                  className="btn-action"
                  style={{ flex: 1, padding: '9px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <FileText size={13} />
                  <span>Download ArmoryVault Import CSV (.csv)</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'wildcat' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  Wildcat Studio Interchange (.qdf &amp; .vol)
                </h4>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                  Export this chamber and load directly into Wildcat Studio format for parametric blueprinting and reamer design.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                  Standard .vol Format String:
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', backgroundColor: 'var(--bg-tertiary)', padding: '8px', borderRadius: '4px', wordBreak: 'break-all' }}>
                  {volLine}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => downloadFile(JSON.stringify(wildcatStudioRecord, null, 2), `${cartridge.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.wildcat.json`, 'application/json')}
                  className="btn-primary"
                  style={{ flex: 1, padding: '9px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Download size={13} />
                  <span>Export Wildcat Studio JSON (.wildcat.json)</span>
                </button>

                <button
                  onClick={() => downloadFile(volLine, `${cartridge.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.vol`, 'text/plain')}
                  className="btn-action"
                  style={{ flex: 1, padding: '9px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Download size={13} />
                  <span>Export Standard .vol File</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'armstrader' && (
            <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <ExternalLink size={32} color="var(--accent-cyan)" />
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  ArmsTrader Store &amp; Community Hub
                </h4>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', maxWidth: '460px', lineHeight: '1.5' }}>
                  Access online ballistic databases, verified manufacturer load recipes, wildcat cartridge blueprints, and the armstrader.store community portal.
                </p>
              </div>
              <a
                href="https://armstrader.store"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Visit armstrader.store</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
