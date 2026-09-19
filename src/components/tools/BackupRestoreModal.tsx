import React, { useState, useRef } from 'react';
import { X, Database, Download, Upload, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCartridges: CartridgeSpec[];
  customPropellants: PropellantSpec[];
  customProjectiles: ProjectileSpec[];
  onRestoreAll: (
    cartridges: CartridgeSpec[],
    propellants: PropellantSpec[],
    projectiles: ProjectileSpec[],
    settings?: Record<string, any>
  ) => void;
  onResetFactory: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  customCartridges,
  customPropellants,
  customProjectiles,
  onRestoreAll,
  onResetFactory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    cartridgesCount: number;
    propellantsCount: number;
    projectilesCount: number;
    payload?: any;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1-Click Export to JSON
  const handleExportBackup = () => {
    let settings: any = {};
    try {
      const savedSettings = localStorage.getItem('loadbench_settings');
      if (savedSettings) settings = JSON.parse(savedSettings);
    } catch (e) {
      console.warn('Could not read settings for backup:', e);
    }

    const backupPayload = {
      app: 'LoadBench',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      customCartridges,
      customPropellants,
      customProjectiles,
      settings,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoadBench-Backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setRestoreStatus('Backup downloaded successfully!');
  };

  // File Upload & Parse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation
        const cList = Array.isArray(parsed.customCartridges) ? parsed.customCartridges : [];
        const pList = Array.isArray(parsed.customPropellants) ? parsed.customPropellants : [];
        const bList = Array.isArray(parsed.customProjectiles) ? parsed.customProjectiles : [];

        setPreviewData({
          cartridgesCount: cList.length,
          propellantsCount: pList.length,
          projectilesCount: bList.length,
          payload: parsed,
        });
      } catch (err: any) {
        setErrorMessage('Failed to parse backup JSON file. Ensure it is a valid LoadBench export.');
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRestore = () => {
    if (!previewData || !previewData.payload) return;
    try {
      const { customCartridges: c, customPropellants: p, customProjectiles: b, settings: s } = previewData.payload;
      onRestoreAll(c || [], p || [], b || [], s || {});
      setRestoreStatus(`Restored: ${previewData.cartridgesCount} cartridges, ${previewData.propellantsCount} powders, ${previewData.projectilesCount} projectiles!`);
      setPreviewData(null);
    } catch (e: any) {
      setErrorMessage(`Restore failed: ${e.message}`);
    }
  };

  const handleConfirmFactoryReset = () => {
    if (window.confirm('Are you sure you want to reset all custom cartridges, wildcats, custom powders, and custom bullets? This cannot be undone.')) {
      onResetFactory();
      setRestoreStatus('Factory reset complete. All default databases restored.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Database Backup &amp; Disaster Recovery Manager
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Current Local Storage Inventory */}
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
              Your Custom Handloading Databases
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {customCartridges.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Custom &amp; Wildcats</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-orange)' }}>
                  {customPropellants.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Custom Powders</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-green)' }}>
                  {customProjectiles.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Custom Projectiles</div>
              </div>
            </div>
          </div>

          {/* Export Action Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Export Complete System Backup
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Saves all custom wildcats, powders, projectiles, and app preferences to a single JSON archive.
              </div>
            </div>
            <button
              onClick={handleExportBackup}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              Export Backup (.json)
            </button>
          </div>

          {/* Import Action Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Restore From System Backup
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Load previously exported LoadBench JSON backup archive to merge or restore your data.
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={14} />
                Select File...
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {/* Preview Banner if file parsed */}
            {previewData && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 210, 255, 0.08)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: '4px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                  Found in file:{' '}
                  <strong>{previewData.cartridgesCount} cartridges</strong>,{' '}
                  <strong>{previewData.propellantsCount} powders</strong>,{' '}
                  <strong>{previewData.projectilesCount} projectiles</strong>
                </div>
                <button
                  onClick={handleApplyRestore}
                  className="btn-primary"
                  style={{ padding: '5px 10px', fontSize: '11px' }}
                >
                  Confirm &amp; Apply Restore
                </button>
              </div>
            )}

            {/* Status / Error Alerts */}
            {restoreStatus && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 230, 118, 0.1)',
                  color: 'var(--accent-green)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={14} /> {restoreStatus}
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 68, 68, 0.1)',
                  color: 'var(--accent-red)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={14} /> {errorMessage}
              </div>
            )}
          </div>

          {/* Reset Factory Defaults */}
          <div
            style={{
              backgroundColor: 'rgba(255, 68, 68, 0.05)',
              border: '1px solid rgba(255, 68, 68, 0.25)',
              borderRadius: '6px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-red)' }}>
                Reset to Factory Defaults
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                Wipes all custom user entries and reverts to clean built-in databases.
              </div>
            </div>
            <button
              onClick={handleConfirmFactoryReset}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={12} /> Clear User Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
