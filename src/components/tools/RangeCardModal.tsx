import React, { useState, useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';
import { SimulationResult } from '../../types/ballistics';
import { calculateDownrangeTrajectory } from '../../utils/trajectoryEngine';

interface RangeCardModalProps {
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

export const RangeCardModal: React.FC<RangeCardModalProps> = ({
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
}) => {
  const [lotNumber, setLotNumber] = useState<string>(`LB-${Date.now().toString().slice(-6)}`);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [firearmName, setFirearmName] = useState<string>('Custom Precision Rifle');
  const [rangeName, setRangeName] = useState<string>('Benchrest Range 1');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  // 100-500 yard trajectory calculation
  const trajectory = calculateDownrangeTrajectory({
    muzzleVelocityFps: result.muzzle_velocity_fps,
    bc: projectile.bc_g7 || projectile.bc_g1 || 0.400,
    dragModel: projectile.bc_g7 ? 'G7' : 'G1',
    sightHeightInches: 1.75,
    zeroRangeYards: 100,
    bulletWeightGrains: projectile.weight_grains,
    windSpeedMph: 10,
  });

  const trajectorySamples = [100, 200, 300, 400, 500].map((dist) => {
    const pt = trajectory.steps.find((t) => Math.abs(t.rangeYards - dist) < 15);
    return {
      dist,
      dropInches: pt ? pt.dropInches.toFixed(1) : '-',
      dropMoa: pt ? pt.elevationMoa.toFixed(2) : '-',
      dropMil: pt ? pt.elevationMils.toFixed(2) : '-',
      windInches: pt ? pt.windDriftInches.toFixed(1) : '-',
      windMoa: pt ? pt.windDriftMoa.toFixed(2) : '-',
      velocity: pt ? Math.round(pt.velocityFps) : '-',
      energy: pt ? Math.round(pt.energyFtLbs) : '-',
    };
  });

  useEffect(() => {
    if (isOpen) {
      const qrPayload = JSON.stringify({
        app: 'ArmoryVault',
        source: 'LoadBench',
        type: 'handload',
        cal: cartridge.name,
        bullet: `${projectile.weight_grains}gr ${projectile.name}`,
        grain: projectile.weight_grains,
        powder: `${propellant.name} ${chargeGrains}gr`,
        powder_charge: chargeGrains,
        primer: primer.name,
        fps: Math.round(result.muzzle_velocity_fps),
        psi: Math.round(result.max_pressure_psi),
        lot: lotNumber,
        count: 50,
        notes: `LoadBench Range Card • Barrel: ${barrelLengthInches}" • Firearm: ${firearmName}`,
      });

      QRCode.toDataURL(qrPayload, { width: 130, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, cartridge, projectile, propellant, chargeGrains, primer, result, lotNumber, barrelLengthInches, firearmName]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const coal = cartridge.coal_in || (cartridge.case_length_in + projectile.length_in - seatingDepthInches);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '880px', width: '95vw', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Modal Header Controls (Hidden during print) */}
        <div className="modal-header no-print" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>
                Printable Benchrest Range Card &amp; Workup Target Sheet
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                1-Page clipboard workup • 10-shot chrono logger • Downrange trajectory • ArmoryVault QR pairing
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 14px' }}
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Configuration Bar (Hidden during print) */}
        <div className="no-print" style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Lot #:</span>
            <input
              type="text"
              className="input-control"
              style={{ width: '110px', fontSize: '11px', padding: '3px 6px' }}
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Firearm:</span>
            <input
              type="text"
              className="input-control"
              style={{ width: '160px', fontSize: '11px', padding: '3px 6px' }}
              value={firearmName}
              onChange={(e) => setFirearmName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Range:</span>
            <input
              type="text"
              className="input-control"
              style={{ width: '140px', fontSize: '11px', padding: '3px 6px' }}
              value={rangeName}
              onChange={(e) => setRangeName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date:</span>
            <input
              type="date"
              className="input-control"
              style={{ width: '130px', fontSize: '11px', padding: '3px 6px' }}
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
        </div>

        {/* Printable Range Card Sheet */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#ffffff', color: '#111827' }} ref={printAreaRef}>
          <div style={{
            border: '2px solid #111827',
            padding: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}>
            {/* Sheet Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  LoadBench • Precision Range Card &amp; Workup Sheet
                </div>
                <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                  Firearm: <strong>{firearmName}</strong> ({barrelLengthInches}" Barrel) • Range: <strong>{rangeName}</strong> • Date: <strong>{sessionDate}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace' }}>
                  LOT #{lotNumber}
                </div>
                <div style={{ fontSize: '10px', color: '#4b5563' }}>
                  Standard: {cartridge.standard}
                </div>
              </div>
            </div>

            {/* Load Specifications & Physics Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 110px', gap: '12px', borderBottom: '1px solid #9ca3af', paddingBottom: '12px', marginBottom: '12px' }}>
              {/* Load Components */}
              <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                <div><strong>Cartridge:</strong> {cartridge.name}</div>
                <div><strong>Projectile:</strong> {projectile.weight_grains} gr {projectile.name} ({projectile.category || 'Match'})</div>
                <div><strong>Propellant:</strong> {propellant.manufacturer} {propellant.name} • <strong>{chargeGrains.toFixed(1)} gr</strong></div>
                <div><strong>Primer:</strong> {primer.manufacturer} {primer.name} (Cup: {primer.cup_thickness_in}")</div>
                <div><strong>OAL / COAL:</strong> {coal.toFixed(3)}" • <strong>Seating Depth:</strong> {seatingDepthInches.toFixed(3)}"</div>
              </div>

              {/* Ballistic Simulation Summary */}
              <div style={{ fontSize: '11px', lineHeight: '1.6', borderLeft: '1px solid #e5e7eb', paddingLeft: '12px' }}>
                <div><strong>Muzzle Velocity:</strong> {Math.round(result.muzzle_velocity_fps)} fps</div>
                <div><strong>Kinetic Energy:</strong> {Math.round(result.muzzle_energy_ft_lbs)} ft-lbs</div>
                <div><strong>Peak Pressure:</strong> {Math.round(result.max_pressure_psi).toLocaleString()} psi ({(result.max_pressure_psi / cartridge.max_pressure_psi * 100).toFixed(1)}% MAP)</div>
                <div><strong>Burn Completion:</strong> {result.propellant_burnt_pct.toFixed(1)}%</div>
                <div><strong>Barrel Time:</strong> {result.barrel_time_ms.toFixed(3)} ms</div>
              </div>

              {/* QR Code Container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {qrDataUrl && <img src={qrDataUrl} alt="ArmoryVault QR" style={{ width: '95px', height: '95px' }} />}
                <div style={{ fontSize: '8px', fontWeight: 700, marginTop: '2px', color: '#4b5563', textTransform: 'uppercase' }}>
                  ArmoryVault Scan
                </div>
              </div>
            </div>

            {/* Downrange Ballistics Drop & Wind Table */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                Downrange Ballistic Drop &amp; 10 MPH 90° Wind Drift (100yd Zero)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderTop: '1px solid #111827', borderBottom: '1px solid #111827' }}>
                    <th style={{ padding: '4px' }}>Distance</th>
                    <th style={{ padding: '4px' }}>Velocity (fps)</th>
                    <th style={{ padding: '4px' }}>Energy (ft-lbs)</th>
                    <th style={{ padding: '4px' }}>Drop (in)</th>
                    <th style={{ padding: '4px' }}>Drop (MOA)</th>
                    <th style={{ padding: '4px' }}>Drop (MIL)</th>
                    <th style={{ padding: '4px' }}>Wind (in)</th>
                    <th style={{ padding: '4px' }}>Wind (MOA)</th>
                  </tr>
                </thead>
                <tbody>
                  {trajectorySamples.map((s) => (
                    <tr key={s.dist} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '4px', fontWeight: 700 }}>{s.dist} yd</td>
                      <td style={{ padding: '4px' }}>{s.velocity}</td>
                      <td style={{ padding: '4px' }}>{s.energy}</td>
                      <td style={{ padding: '4px' }}>{s.dropInches}</td>
                      <td style={{ padding: '4px', fontWeight: 700 }}>{s.dropMoa}</td>
                      <td style={{ padding: '4px', fontWeight: 700 }}>{s.dropMil}</td>
                      <td style={{ padding: '4px' }}>{s.windInches}</td>
                      <td style={{ padding: '4px' }}>{s.windMoa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 10-Shot Chronograph Recording Table */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                Field Chronograph &amp; Group Size Log
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderTop: '1px solid #111827', borderBottom: '1px solid #111827', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px', width: '60px' }}>Shot #</th>
                    <th style={{ padding: '4px 6px', width: '120px' }}>Velocity (fps)</th>
                    <th style={{ padding: '4px 6px', width: '90px' }}>Deviation (Δ)</th>
                    <th style={{ padding: '4px 6px' }}>Point of Impact / Call Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <tr key={num} style={{ borderBottom: '1px solid #e5e7eb', height: '22px' }}>
                      <td style={{ padding: '4px 6px', fontWeight: 700 }}>Shot {num}</td>
                      <td style={{ padding: '4px 6px' }}></td>
                      <td style={{ padding: '4px 6px' }}></td>
                      <td style={{ padding: '4px 6px' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Range Statistics Summary & Environment Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '10px' }}>
              <div style={{ border: '1px solid #111827', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Chronograph Summary</div>
                <div>Avg Velocity: _________________ fps</div>
                <div style={{ marginTop: '4px' }}>Extreme Spread (ES): _________ fps</div>
                <div style={{ marginTop: '4px' }}>Std Deviation (SD): _________ fps</div>
              </div>

              <div style={{ border: '1px solid #111827', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Target Group Precision</div>
                <div>Group Spread: _______________ in</div>
                <div style={{ marginTop: '4px' }}>Calculated MOA: ____________ MOA</div>
                <div style={{ marginTop: '4px' }}>Distance: _________________ yd/m</div>
              </div>

              <div style={{ border: '1px solid #111827', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Atmospheric Conditions</div>
                <div>Temp: ______ °F / °C • Humidity: ____%</div>
                <div style={{ marginTop: '4px' }}>Pressure: ________ inHg • Alt: ______ ft</div>
                <div style={{ marginTop: '4px' }}>Wind: ______ mph @ ______ o'clock</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
