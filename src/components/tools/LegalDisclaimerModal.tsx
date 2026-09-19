import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Check, AlertTriangle } from 'lucide-react';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalDisclaimerModal: React.FC<LegalDisclaimerModalProps> = ({ isOpen, onClose }) => {
  const [acknowledged, setAcknowledged] = useState<boolean>(() => {
    return localStorage.getItem('loadbench_disclaimer_ack') === 'true';
  });

  useEffect(() => {
    if (isOpen) {
      setAcknowledged(localStorage.getItem('loadbench_disclaimer_ack') === 'true');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    localStorage.setItem('loadbench_disclaimer_ack', 'true');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95vw', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="#ef4444" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>
              Safety Guidelines &amp; Legal Reloading Disclaimer
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px' }}>
            <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#f59e0b' }}>Simulation Software Notice:</strong> LoadBench is a mathematical ballistics calculation suite. Computer simulations are estimates and CANNOT replace certified physical proof-testing with piezoelectric transducers or copper crushers.
            </div>
          </div>

          <div>
            <h5 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '12px' }}>1. Component Variance Warning</h5>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Physical reloading components fluctuate substantially from batch to batch. Propellant relative quickness (Ba) varies by ±3–5% between manufacturer powder lots. Primer brisance, case internal water capacity, and firearm chamber dimensions differ widely.
            </p>
          </div>

          <div>
            <h5 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '12px' }}>2. Mandatory 10% Reduction Rule</h5>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Always reduce starting charge weights by a minimum of <strong>10% below any estimated maximum charge</strong> and work up incrementally in steps of 0.2 to 0.5 grains while inspecting cases for overpressure signs (cratered/flattened primers, stiff bolt lift, ejector extrusion marks).
            </p>
          </div>

          <div>
            <h5 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '12px' }}>3. Limitation of Liability</h5>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              The creators and distributors of LoadBench assume no responsibility or liability for equipment damage, personal injury, disability, or death resulting from the assembly or firing of ammunition calculated with this software. The handloader assumes 100% of the risk.
            </p>
          </div>

          {/* Acknowledgment Checkbox */}
          <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="cb-ack"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="cb-ack" style={{ cursor: 'pointer', fontSize: '11px', color: 'var(--text-primary)' }}>
              I understand that LoadBench is a theoretical simulation tool and agree to follow all SAAMI/CIP handloading safety standards.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-action" style={{ padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}>
            Dismiss
          </button>
          <button
            onClick={handleConfirm}
            disabled={!acknowledged}
            className="btn-primary"
            style={{
              padding: '6px 16px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: acknowledged ? 1 : 0.5,
              cursor: acknowledged ? 'pointer' : 'not-allowed',
            }}
          >
            <Check size={13} />
            <span>Acknowledge &amp; Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
