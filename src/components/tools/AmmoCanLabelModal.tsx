import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Tag } from 'lucide-react';
import QRCode from 'qrcode';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';
import { SimulationResult } from '../../types/ballistics';

interface AmmoCanLabelModalProps {
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

export const AmmoCanLabelModal: React.FC<AmmoCanLabelModalProps> = ({
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
  isMetric,
}) => {
  const [labelSize, setLabelSize] = useState<'box' | 'can'>('box'); // box: 2x4, can: 3x5
  const [lotNumber, setLotNumber] = useState<string>(`LB-${Date.now().toString().slice(-6)}`);
  const [dateLoaded, setDateLoaded] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Match Target Load');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const qrPayload = JSON.stringify({
        app: 'ArmoryVault',
        type: 'handload',
        cal: cartridge.name,
        bullet: `${projectile.weight_grains}gr ${projectile.name}`,
        powder: `${propellant.name} ${chargeGrains}gr`,
        primer: primer.name,
        fps: Math.round(result.muzzle_velocity_fps),
        psi: Math.round(result.max_pressure_psi),
        lot: lotNumber,
      });

      QRCode.toDataURL(qrPayload, { width: 140, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, cartridge, projectile, propellant, chargeGrains, primer, result, lotNumber]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const coal = cartridge.coal_in || (cartridge.case_length_in + projectile.length_in - seatingDepthInches);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '95vw', maxHeight: '88vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Printable Ammo Can &amp; Box Label Generator
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Configuration Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="input-label" style={{ margin: 0 }}>Format:</label>
            <button
              onClick={() => setLabelSize('box')}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                border: labelSize === 'box' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                backgroundColor: labelSize === 'box' ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                color: labelSize === 'box' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              2" × 4" Cartridge Box
            </button>
            <button
              onClick={() => setLabelSize('can')}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                border: labelSize === 'can' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                backgroundColor: labelSize === 'can' ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                color: labelSize === 'can' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              3" × 5" Metal Ammo Can
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="input-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Label Note"
              style={{ width: '130px', fontSize: '11px', padding: '4px 8px' }}
            />
            <input
              type="text"
              className="input-control"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="Lot #"
              style={{ width: '90px', fontSize: '11px', padding: '4px 8px' }}
            />
            <input
              type="date"
              className="input-control"
              value={dateLoaded}
              onChange={(e) => setDateLoaded(e.target.value)}
              style={{ width: '115px', fontSize: '11px', padding: '4px 8px' }}
            />
          </div>
        </div>

        {/* Printable Label Preview Area */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-primary)', overflowY: 'auto' }}>
          <div
            ref={printAreaRef}
            className="printable-label"
            style={{
              width: labelSize === 'box' ? '400px' : '480px',
              backgroundColor: '#ffffff',
              color: '#111827',
              borderRadius: '6px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              border: '2px solid #111827',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            {/* Top Label Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '8px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#4b5563' }}>
                  LOADBENCH PRECISION HANDLOAD
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
                  {cartridge.name}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10px', color: '#4b5563' }}>
                <div><strong>LOT:</strong> {lotNumber}</div>
                <div><strong>DATE:</strong> {dateLoaded}</div>
              </div>
            </div>

            {/* Main Label Body & QR Code */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '10px', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>PROJECTILE: </span>
                  <strong style={{ color: '#111827' }}>{projectile.weight_grains} gr {projectile.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>POWDER: </span>
                  <strong style={{ color: '#111827' }}>{propellant.name} — {chargeGrains} gr</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>PRIMER: </span>
                  <strong style={{ color: '#111827' }}>{primer.name} ({primer.pocket_size.replace('_', ' ')})</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>COAL / SEATING: </span>
                  <strong style={{ color: '#111827' }}>{coal.toFixed(3)}" (Seat: {seatingDepthInches.toFixed(3)}")</strong>
                </div>
                {notes && (
                  <div>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>NOTE: </span>
                    <span style={{ color: '#374151', fontStyle: 'italic' }}>{notes}</span>
                  </div>
                )}
                <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #d1d5db', display: 'flex', gap: '12px' }}>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '10px' }}>MUZZLE VEL: </span>
                    <strong style={{ color: '#047857' }}>
                      {isMetric ? `${Math.round(result.muzzle_velocity_fps * 0.3048)} m/s` : `${Math.round(result.muzzle_velocity_fps)} fps`}
                    </strong>
                    <span style={{ color: '#6b7280', fontSize: '9px', marginLeft: '3px' }}>({barrelLengthInches}" bbl)</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '10px' }}>PEAK PRESS: </span>
                    <strong style={{ color: '#b91c1c' }}>
                      {isMetric ? `${Math.round(result.max_pressure_bar)} bar` : `${Math.round(result.max_pressure_psi).toLocaleString()} psi`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="ArmoryVault QR Code"
                    style={{ width: '80px', height: '80px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                  />
                )}
                <span style={{ fontSize: '8px', color: '#6b7280', fontWeight: 700, marginTop: '2px' }}>
                  ARMORYVAULT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Scannable with ArmoryVault Companion App &amp; Desktop Scanner
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn-action" style={{ padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}>
              Close
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Printer size={13} />
              <span>Print Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
