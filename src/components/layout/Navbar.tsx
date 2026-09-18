import React from 'react';
import { 
  Gauge, 
  FileUp, 
  FileDown, 
  Sliders, 
  Table, 
  Activity, 
  RotateCcw,
  Sparkles,
  Search
} from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';

interface NavbarProps {
  cartridges: CartridgeSpec[];
  selectedCartridge: CartridgeSpec;
  onSelectCartridge: (cartridge: CartridgeSpec) => void;
  isMetric: boolean;
  onToggleUnits: () => void;
  onOpenLadder: () => void;
  onOpenCompare: () => void;
  onOpenOBT: () => void;
  onOpenTruing: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onResetToDefaults: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartridges,
  selectedCartridge,
  onSelectCartridge,
  isMetric,
  onToggleUnits,
  onOpenLadder,
  onOpenCompare,
  onOpenOBT,
  onOpenTruing,
  onOpenImport,
  onOpenExport,
  onResetToDefaults,
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      backgroundColor: 'var(--bg-tertiary)',
      borderBottom: '1px solid var(--border-color)',
      userSelect: 'none',
      gap: '12px',
    }}>
      {/* Brand & Caliber Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={20} color="var(--accent-cyan)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
              QuickLOAD <span style={{ color: 'var(--accent-cyan)' }}>Studio</span>
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Interior Ballistics Workbench
            </span>
          </div>
        </div>

        {/* Cartridge Quick Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cartridge:</span>
          <select
            value={selectedCartridge.id}
            onChange={(e) => {
              const found = cartridges.find(c => c.id === e.target.value);
              if (found) onSelectCartridge(found);
            }}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            {cartridges.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.standard})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analysis Tools & Modals Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onOpenLadder}
          style={navBtnStyle}
          title="Charge Weight Stepping Ladder"
        >
          <Table size={14} color="var(--accent-cyan)" />
          <span>Charge Ladder</span>
        </button>

        <button
          onClick={onOpenCompare}
          style={navBtnStyle}
          title="Propellant Ranking Matrix"
        >
          <Search size={14} color="var(--accent-cyan)" />
          <span>Powder Compare</span>
        </button>

        <button
          onClick={onOpenOBT}
          style={navBtnStyle}
          title="Optimal Barrel Time (OBT) Harmonics"
        >
          <Activity size={14} color="var(--accent-cyan)" />
          <span>OBT Nodes</span>
        </button>

        <button
          onClick={onOpenTruing}
          style={navBtnStyle}
          title="Chronograph Velocity Truing & Ba Calibration"
        >
          <Sparkles size={14} color="var(--accent-cyan)" />
          <span>Chrono Truing</span>
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        {/* Interchange */}
        <button
          onClick={onOpenImport}
          style={navBtnStyle}
          title="Import QuickDESIGN (.qdf) or QuickLOAD (.vol)"
        >
          <FileUp size={14} />
          <span>Import</span>
        </button>

        <button
          onClick={onOpenExport}
          style={navBtnStyle}
          title="Export Load Recipe & Report"
        >
          <FileDown size={14} />
          <span>Export</span>
        </button>

        <button
          onClick={onResetToDefaults}
          style={navBtnIconOnlyStyle}
          title="Reset Load to Default Factory Specs"
        >
          <RotateCcw size={14} />
        </button>

        {/* Units Toggle */}
        <button
          onClick={onToggleUnits}
          style={{
            ...navBtnStyle,
            backgroundColor: isMetric ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-secondary)',
            borderColor: isMetric ? 'var(--accent-blue)' : 'var(--border-color)',
          }}
          title="Toggle Imperial / Metric Units"
        >
          <Sliders size={13} />
          <span style={{ fontWeight: 600 }}>{isMetric ? 'Metric' : 'Imperial'}</span>
        </button>
      </div>
    </header>
  );
};

const navBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '5px 10px',
  fontSize: '12px',
  fontWeight: 500,
  transition: 'all 0.15s ease',
};

const navBtnIconOnlyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  padding: '6px',
  transition: 'all 0.15s ease',
};
