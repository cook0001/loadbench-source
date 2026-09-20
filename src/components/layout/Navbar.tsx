import React, { useState, useRef, useEffect } from 'react';
import { 
  Gauge, 
  FolderOpen, 
  FileUp, 
  FileDown, 
  Tag, 
  Database, 
  RotateCcw, 
  Sliders, 
  Table, 
  Activity, 
  Crosshair, 
  Search, 
  Compass, 
  Shield, 
  Scale,
  Ruler, 
  Calculator, 
  Thermometer, 
  GitCompare, 
  Sparkles, 
  BookOpen, 
  Share2, 
  ChevronDown, 
  Check, 
  Layers,
  Zap,
  Printer,
  Flame,
  Save
} from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';

interface NavbarProps {
  cartridges?: CartridgeSpec[];
  selectedCartridge: CartridgeSpec;
  onSelectCartridge?: (cartridge: CartridgeSpec) => void;
  isMetric: boolean;
  onToggleUnits: () => void;
  // Modals
  onOpenCartridgeSelector: () => void;
  onOpenChargeSolver: () => void;
  onOpenLadder: () => void;
  onOpenCompare: () => void;
  onOpenPowderDB: () => void;
  onOpenProjectileDB: () => void;
  onOpenPrimerDB: () => void;
  onOpenBurnChart: () => void;
  onOpenBulletJump: () => void;
  onOpenPowderMeasure: () => void;
  onOpenRangeCard: () => void;
  onSaveLoadProject: () => void;
  onOpenLoadProject: () => void;
  onOpenManufacturerMatch: () => void;
  onOpenOBT: () => void;
  onOpenTruing: () => void;
  onOpenTrajectory: () => void;
  onOpenRecoil: () => void;
  onOpenBarrelStepper: () => void;
  onOpenCaseWaterModal: () => void;
  onOpenWildcatModal: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenAmmoCanLabel: () => void;
  onOpenBatchCost: () => void;
  onOpenCartridgeCompare: () => void;
  onOpenThermalStability: () => void;
  onOpenBackupRestore: () => void;
  onOpenSettings: () => void;
  onOpenUserManual: () => void;
  onOpenLegalDisclaimer: () => void;
  onOpenEcosystem: () => void;
  onResetToDefaults: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartridges: _cartridges,
  selectedCartridge,
  onSelectCartridge: _onSelectCartridge,
  isMetric,
  onToggleUnits,
  onOpenCartridgeSelector,
  onOpenChargeSolver,
  onOpenLadder,
  onOpenCompare,
  onOpenPowderDB,
  onOpenProjectileDB,
  onOpenPrimerDB,
  onOpenBurnChart,
  onOpenBulletJump,
  onOpenPowderMeasure,
  onOpenRangeCard,
  onSaveLoadProject,
  onOpenLoadProject,
  onOpenManufacturerMatch,
  onOpenOBT,
  onOpenTruing,
  onOpenTrajectory,
  onOpenRecoil,
  onOpenBarrelStepper,
  onOpenCaseWaterModal,
  onOpenWildcatModal,
  onOpenImport,
  onOpenExport,
  onOpenAmmoCanLabel,
  onOpenBatchCost,
  onOpenCartridgeCompare,
  onOpenThermalStability,
  onOpenBackupRestore,
  onOpenSettings,
  onOpenUserManual,
  onOpenLegalDisclaimer,
  onOpenEcosystem,
  onResetToDefaults,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuName: string) => {
    setOpenMenu(prev => (prev === menuName ? null : menuName));
  };

  const handleAction = (callback: () => void) => {
    callback();
    setOpenMenu(null);
  };

  return (
    <header
      ref={navRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-color)',
        userSelect: 'none',
        gap: '12px',
        position: 'relative',
        zIndex: 500,
      }}
    >
      {/* Left: Brand & Dropdown Menus */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
          <Gauge size={20} color="var(--accent-cyan)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
              Load<span style={{ color: 'var(--accent-cyan)' }}>Bench</span>
            </span>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Interior Ballistics
            </span>
          </div>
        </div>

        {/* 1. FILE MENU */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => toggleMenu('file')} className={`nav-menu-btn ${openMenu === 'file' ? 'active' : ''}`}>
            <span>File</span>
            <ChevronDown size={12} />
          </button>
          {openMenu === 'file' && (
            <div className="nav-dropdown-menu">
              <button
                onClick={() => handleAction(onOpenCartridgeSelector)}
                className="nav-dropdown-item"
                style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}
              >
                <FolderOpen size={14} color="var(--accent-cyan)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Open Cartridge...</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ctrl+O</span>
                </div>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onSaveLoadProject)} className="nav-dropdown-item">
                <Save size={14} color="var(--accent-cyan)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Save Load Recipe (.loadbench)...</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ctrl+S</span>
                </div>
              </button>

              <button onClick={() => handleAction(onOpenLoadProject)} className="nav-dropdown-item">
                <FolderOpen size={14} color="var(--accent-cyan)" />
                <span>Open Load Recipe (.loadbench)...</span>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onOpenRangeCard)} className="nav-dropdown-item" style={{ color: 'var(--accent-green)' }}>
                <Printer size={14} color="var(--accent-green)" />
                <span>Print Benchrest Range Card...</span>
              </button>

              <button onClick={() => handleAction(onOpenAmmoCanLabel)} className="nav-dropdown-item">
                <Tag size={14} color="var(--accent-cyan)" />
                <span>Print Ammo Can &amp; Box Label (QR)...</span>
              </button>

              <button onClick={() => handleAction(onOpenExport)} className="nav-dropdown-item">
                <FileDown size={14} color="var(--accent-cyan)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Export Ballistics Lab Report...</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ctrl+P</span>
                </div>
              </button>

              <button onClick={() => handleAction(onOpenImport)} className="nav-dropdown-item">
                <FileUp size={14} color="var(--accent-cyan)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Import Custom Data (.wildcat / .qdf)...</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ctrl+I</span>
                </div>
              </button>

              <button onClick={() => handleAction(onOpenBackupRestore)} className="nav-dropdown-item">
                <Database size={14} color="var(--accent-cyan)" />
                <span>Backup &amp; Restore Databases...</span>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onResetToDefaults)} className="nav-dropdown-item" style={{ color: 'var(--accent-orange)' }}>
                <RotateCcw size={14} color="var(--accent-orange)" />
                <span>Reset Workstation to Defaults</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. CALCULATORS & TOOLS MENU */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => toggleMenu('tools')} className={`nav-menu-btn ${openMenu === 'tools' ? 'active' : ''}`}>
            <span>Calculators</span>
            <ChevronDown size={12} />
          </button>
          {openMenu === 'tools' && (
            <div className="nav-dropdown-menu">
              <button onClick={() => handleAction(onOpenChargeSolver)} className="nav-dropdown-item" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                <Zap size={14} color="var(--accent-cyan)" />
                <span>Safe Working Range &amp; Charge Solver</span>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onOpenLadder)} className="nav-dropdown-item">
                <Table size={14} color="var(--accent-cyan)" />
                <span>Incremental Charge Ladder Table</span>
              </button>

              <button onClick={() => handleAction(onOpenBulletJump)} className="nav-dropdown-item">
                <Crosshair size={14} color="var(--accent-cyan)" />
                <span>CBTO &amp; Bullet Jump Geometry</span>
              </button>

              <button onClick={() => handleAction(onOpenPowderMeasure)} className="nav-dropdown-item">
                <Layers size={14} color="var(--accent-cyan)" />
                <span>Powder Dispenser &amp; VMD Volumetric Measure</span>
              </button>

              <button onClick={() => handleAction(onOpenCartridgeCompare)} className="nav-dropdown-item">
                <GitCompare size={14} color="var(--accent-cyan)" />
                <span>Dual Load Side-by-Side Comparison</span>
              </button>

              <button onClick={() => handleAction(onOpenOBT)} className="nav-dropdown-item">
                <Activity size={14} color="var(--accent-cyan)" />
                <span>Optimal Barrel Time (OBT) Shockwave Nodes</span>
              </button>

              <button onClick={() => handleAction(onOpenThermalStability)} className="nav-dropdown-item">
                <Thermometer size={14} color="var(--accent-cyan)" />
                <span>Powder Thermal Stability &amp; Sensitivity Drift</span>
              </button>

              <button onClick={() => handleAction(onOpenTruing)} className="nav-dropdown-item">
                <Sparkles size={14} color="var(--accent-cyan)" />
                <span>Chronograph Truing &amp; Ba Calibration Offset</span>
              </button>

              <button onClick={() => handleAction(onOpenTrajectory)} className="nav-dropdown-item">
                <Compass size={14} color="var(--accent-cyan)" />
                <span>Downrange Exterior Trajectory Table (Point-Mass)</span>
              </button>

              <button onClick={() => handleAction(onOpenRecoil)} className="nav-dropdown-item">
                <Shield size={14} color="var(--accent-cyan)" />
                <span>Free Recoil Energy &amp; Momentum Impulse</span>
              </button>

              <button onClick={() => handleAction(onOpenBarrelStepper)} className="nav-dropdown-item">
                <Ruler size={14} color="var(--accent-cyan)" />
                <span>Barrel Cut-Down &amp; Velocity Stepper</span>
              </button>

              <button onClick={() => handleAction(onOpenCaseWaterModal)} className="nav-dropdown-item">
                <Layers size={14} color="var(--accent-cyan)" />
                <span>Case Water Volume (H₂O) Scale Calibration</span>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onOpenBatchCost)} className="nav-dropdown-item" style={{ color: 'var(--accent-green)' }}>
                <Calculator size={14} color="var(--accent-green)" />
                <span>Batch Production Cost &amp; Handload Savings</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. DATABASES MENU */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => toggleMenu('databases')} className={`nav-menu-btn ${openMenu === 'databases' ? 'active' : ''}`}>
            <span>Databases</span>
            <ChevronDown size={12} />
          </button>
          {openMenu === 'databases' && (
            <div className="nav-dropdown-menu">
              <button onClick={() => handleAction(onOpenPowderDB)} className="nav-dropdown-item">
                <Database size={14} color="var(--accent-cyan)" />
                <span>Propellant Chemical Database (181 Powders)</span>
              </button>

              <button onClick={() => handleAction(onOpenBurnChart)} className="nav-dropdown-item">
                <Flame size={14} color="var(--accent-orange)" />
                <span>Relative Powder Burn Rate Ranking Spectrum</span>
              </button>

              <button onClick={() => handleAction(onOpenProjectileDB)} className="nav-dropdown-item">
                <Crosshair size={14} color="var(--accent-cyan)" />
                <span>Factory Projectile Catalog (1,120+ Bullets)</span>
              </button>

              <button onClick={() => handleAction(onOpenPrimerDB)} className="nav-dropdown-item">
                <Zap size={14} color="var(--accent-cyan)" />
                <span>Primer Ignition Dynamics Database (109 Primers)</span>
              </button>

              <button onClick={() => handleAction(onOpenCompare)} className="nav-dropdown-item">
                <Search size={14} color="var(--accent-cyan)" />
                <span>Propellant Performance Ranking Matrix</span>
              </button>

              <button onClick={() => handleAction(onOpenManufacturerMatch)} className="nav-dropdown-item">
                <Sparkles size={14} color="var(--accent-cyan)" />
                <span>Published Manufacturer Load Data Matcher</span>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onOpenWildcatModal)} className="nav-dropdown-item" style={{ color: 'var(--accent-gold)' }}>
                <Layers size={14} color="var(--accent-gold)" />
                <span>Custom Cartridge &amp; Wildcat Designer</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. ECOSYSTEM MENU */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => toggleMenu('ecosystem')} className={`nav-menu-btn ${openMenu === 'ecosystem' ? 'active' : ''}`}>
            <span>Ecosystem</span>
            <ChevronDown size={12} />
          </button>
          {openMenu === 'ecosystem' && (
            <div className="nav-dropdown-menu">
              <button onClick={() => handleAction(onOpenEcosystem)} className="nav-dropdown-item" style={{ fontWeight: 600 }}>
                <Share2 size={14} color="var(--accent-cyan)" />
                <span>ArmoryVault &amp; Wildcat Studio Hub...</span>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onOpenEcosystem)} className="nav-dropdown-item">
                <Check size={14} color="var(--accent-green)" />
                <span>Export Handload Card (.avr / .json)</span>
              </button>

              <button onClick={() => handleAction(onOpenEcosystem)} className="nav-dropdown-item">
                <Layers size={14} color="var(--accent-gold)" />
                <span>Export Wildcat Studio (.wildcat.json)</span>
              </button>

              <button onClick={() => handleAction(onOpenEcosystem)} className="nav-dropdown-item">
                <Share2 size={14} color="var(--accent-cyan)" />
                <span>armstrader.store Community Sync</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. HELP & SETTINGS MENU */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => toggleMenu('settings')} className={`nav-menu-btn ${openMenu === 'settings' ? 'active' : ''}`}>
            <span>Help &amp; Settings</span>
            <ChevronDown size={12} />
          </button>
          {openMenu === 'settings' && (
            <div className="nav-dropdown-menu">
              <button onClick={() => handleAction(onOpenSettings)} className="nav-dropdown-item">
                <Sliders size={14} color="var(--accent-cyan)" />
                <span>Settings &amp; Preferences...</span>
              </button>

              <div className="nav-divider" />

              <button onClick={() => handleAction(onOpenUserManual)} className="nav-dropdown-item">
                <BookOpen size={14} color="var(--accent-cyan)" />
                <span>Comprehensive User Manual</span>
              </button>

              <button onClick={() => handleAction(onOpenLegalDisclaimer)} className="nav-dropdown-item">
                <Scale size={14} color="var(--accent-cyan)" />
                <span>Software License &amp; Legal Terms...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center/Right: Active Cartridge Button & Fast Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Active Cartridge Action Button -> Opens CartridgeSelectorModal */}
        <button
          onClick={onOpenCartridgeSelector}
          title="Click to search and change active cartridge (385+ cartridges)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 10px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <FolderOpen size={13} color="var(--accent-cyan)" />
          <span>{selectedCartridge.name}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({selectedCartridge.standard})</span>
          <ChevronDown size={12} color="var(--text-muted)" />
        </button>

        {/* Quick Label Print Button */}
        <button
          onClick={onOpenAmmoCanLabel}
          title="Generate & Print Ammo Can Batch Label with Scannable QR Code"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 9px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          <Tag size={13} color="var(--accent-cyan)" />
          <span>Ammo Can Label (QR)</span>
        </button>

        {/* Units Toggle */}
        <button
          onClick={onToggleUnits}
          title="Toggle Measurement Units (US Imperial: in, gr, psi, fps | Metric: mm, g, bar, m/s)"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 8px',
            color: isMetric ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {isMetric ? 'METRIC' : 'US IMPERIAL'}
        </button>

        {/* Settings Shortcut Button */}
        <button
          onClick={onOpenSettings}
          title="LoadBench System Configuration & Settings"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
          }}
        >
          <Sliders size={13} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
