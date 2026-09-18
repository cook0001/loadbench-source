import React, { useState } from 'react';
import { X, FileUp, AlertCircle, Check } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { PropellantSpec } from '../../types/propellant';
import { ProjectileSpec } from '../../types/projectile';
import { 
  parseQuickDesignQDF, 
  parseQuickLoadVOL, 
  parseQuickLoadPRO, 
  parseQuickLoadBUL 
} from '../../utils/fileParsers';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCartridge: (cartridge: CartridgeSpec) => void;
  onImportPropellants?: (propellants: PropellantSpec[]) => void;
  onImportProjectiles?: (projectiles: ProjectileSpec[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportCartridge,
  onImportPropellants,
  onImportProjectiles,
}) => {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessImport = () => {
    setErrorMsg(null);
    const trimmed = inputText.trim();
    if (!trimmed) {
      setErrorMsg('Please paste the contents of a .qdf, .vol, .pro, or .bul file.');
      return;
    }

    // 1. Try QDF (Wildcat Studio)
    if (trimmed.includes('[Cartridge]') || trimmed.includes('OverflowCapacity_grH2O=')) {
      const parsed = parseQuickDesignQDF(trimmed);
      if (parsed && parsed.name) {
        onImportCartridge(parsed as CartridgeSpec);
        onClose();
        return;
      }
    }

    // 2. Try PRO (QuickLOAD Powders)
    if (fileName.endsWith('.pro') || (!trimmed.startsWith('[Cartridge]') && trimmed.includes('","') && (trimmed.includes('Vihtavuori') || trimmed.includes('Hodgdon') || trimmed.includes('Alliant') || trimmed.includes('IMR') || trimmed.includes('Norma') || trimmed.includes('Accurate')))) {
      const proParsed = parseQuickLoadPRO(trimmed);
      if (proParsed && proParsed.length > 0) {
        if (onImportPropellants) {
          onImportPropellants(proParsed as PropellantSpec[]);
          onClose();
          return;
        }
      }
    }

    // 3. Try BUL (QuickLOAD Projectiles)
    if (fileName.endsWith('.bul') || (trimmed.includes('","') && (trimmed.includes('Hornady') || trimmed.includes('Sierra') || trimmed.includes('Berger') || trimmed.includes('Lapua') || trimmed.includes('Nosler') || trimmed.includes('Barnes')))) {
      const bulParsed = parseQuickLoadBUL(trimmed);
      if (bulParsed && bulParsed.length > 0) {
        if (onImportProjectiles) {
          onImportProjectiles(bulParsed as ProjectileSpec[]);
          onClose();
          return;
        }
      }
    }

    // 4. Try QuickLOAD .vol (Cartridge)
    const volParsed = parseQuickLoadVOL(trimmed);
    if (volParsed && volParsed.name) {
      onImportCartridge(volParsed as CartridgeSpec);
      onClose();
      return;
    }

    // Fallback: try PRO or BUL if not tried already
    const proParsedFallback = parseQuickLoadPRO(trimmed);
    if (proParsedFallback && proParsedFallback.length > 0 && onImportPropellants) {
      onImportPropellants(proParsedFallback as PropellantSpec[]);
      onClose();
      return;
    }

    const bulParsedFallback = parseQuickLoadBUL(trimmed);
    if (bulParsedFallback && bulParsedFallback.length > 0 && onImportProjectiles) {
      onImportProjectiles(bulParsedFallback as ProjectileSpec[]);
      onClose();
      return;
    }

    setErrorMsg('Unable to parse file. Please ensure it is a valid QuickDESIGN (.qdf) or QuickLOAD (.vol / .pro / .bul) record.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.toLowerCase());

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileUp size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Import Data (.qdf / .vol / .pro / .bul)
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Import cartridge designs directly from <strong>Wildcat Studio</strong> (<code>.qdf</code>), or QuickLOAD cartridges (<code>.vol</code>), powders (<code>.pro</code>), and projectiles (<code>.bul</code>).
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Choose File from Disk:
            </label>
            <input
              type="file"
              accept=".qdf,.vol,.pro,.bul,.dat,.txt"
              onChange={handleFileUpload}
              style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="input-field">
            <label className="input-label">Or Paste File Contents Here:</label>
            <textarea
              className="input-control"
              rows={8}
              style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              placeholder="; Paste QuickDESIGN .qdf, QuickLOAD .vol, .pro, or .bul data..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger)',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '11px',
            }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button
            onClick={handleProcessImport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--accent-cyan)',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Check size={14} />
            <span>Import Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const btnSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '6px 14px',
  fontSize: '12px',
};
