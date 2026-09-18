import React, { useState, useMemo, useRef, useEffect } from 'react';
import './App.css';

// Types
import { CartridgeSpec } from './types/cartridge';
import { ProjectileSpec } from './types/projectile';
import { PropellantSpec } from './types/propellant';

// Preloaded Databases
import initialCartridges from './data/cartridges.json';
import initialPropellants from './data/propellants.json';
import initialProjectiles from './data/projectiles.json';

// Ballistics & Harmonics Engines
import { 
  simulateInteriorBallistics, 
  generateChargeLadder, 
  rankPropellantsForLoad,
  calibrateBaForChronograph 
} from './utils/ballisticsEngine';
import { calculateOBTNodes } from './utils/obtEngine';

// Components
import { Navbar } from './components/layout/Navbar';
import { StatusBar } from './components/layout/StatusBar';
import { CartridgeDeck } from './components/decks/CartridgeDeck';
import { ProjectileDeck } from './components/decks/ProjectileDeck';
import { PropellantDeck } from './components/decks/PropellantDeck';
import { DiagnosticsDeck } from './components/decks/DiagnosticsDeck';
import { BallisticsChart } from './components/charts/BallisticsChart';

// Modals
import { ChargeLadderModal } from './components/tools/ChargeLadderModal';
import { PowderCompareModal } from './components/tools/PowderCompareModal';
import { OBTModal } from './components/tools/OBTModal';
import { ChronoTruingModal } from './components/tools/ChronoTruingModal';
import { PowderDatabaseModal } from './components/tools/PowderDatabaseModal';
import { ImportModal } from './components/modals/ImportModal';
import { ExportReportModal } from './components/modals/ExportReportModal';

export const App: React.FC = () => {
  const leftPanelRef = useRef<HTMLElement | null>(null);

  // Database Collections (useMemo ensures dynamic hot reload of full propellant catalog)
  const [cartridges, setCartridges] = useState<CartridgeSpec[]>(initialCartridges as CartridgeSpec[]);
  const [customPropellants] = useState<PropellantSpec[]>([]);
  const propellants = useMemo<PropellantSpec[]>(() => {
    return [...(initialPropellants as PropellantSpec[]), ...customPropellants];
  }, [customPropellants]);
  const [projectiles] = useState<ProjectileSpec[]>(initialProjectiles as ProjectileSpec[]);

  // Active Selected Components (Default: 6.5 Creedmoor with 140 gr ELD-M and Hodgdon H4350)
  const [cartridge, setCartridge] = useState<CartridgeSpec>(cartridges[0]);
  const [projectile, setProjectile] = useState<ProjectileSpec>(projectiles[0]);
  const defaultPropellant = useMemo(() => {
    return (initialPropellants as PropellantSpec[]).find(p => p.id === 'hodgdon_h4350') || (initialPropellants[0] as PropellantSpec);
  }, []);
  const [propellant, setPropellant] = useState<PropellantSpec>(defaultPropellant);

  // Load Parameters
  const [chargeGrains, setChargeGrains] = useState<number>(41.5);
  const [barrelLength, setBarrelLength] = useState<number>(cartridges[0].default_barrel_length_in);
  const [seatingDepth, setSeatingDepth] = useState<number>(projectiles[0].default_seating_depth_in);
  const [baOffsetPct, setBaOffsetPct] = useState<number>(0);
  const [isMetric, setIsMetric] = useState<boolean>(false);

  // Ensure left panel is never horizontally offset
  useEffect(() => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollLeft = 0;
    }
  }, []);

  // Modal Visibility States
  const [isLadderOpen, setIsLadderOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isPowderDBOpen, setIsPowderDBOpen] = useState<boolean>(false);
  const [isOBTOpen, setIsOBTOpen] = useState<boolean>(false);
  const [isTruingOpen, setIsTruingOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Cartridge Selection Handler
  const handleSelectCartridge = (newCartridge: CartridgeSpec) => {
    setCartridge(newCartridge);
    setBarrelLength(newCartridge.default_barrel_length_in);

    // Auto-select matching caliber bullet if available
    const matchingProj = projectiles.find(p => Math.abs(p.caliber_in - newCartridge.bullet_diameter_in) < 0.005);
    if (matchingProj) {
      setProjectile(matchingProj);
      setSeatingDepth(matchingProj.default_seating_depth_in);
    }
  };

  // Usable Combustion Chamber Volume (cm³)
  const usableChamberVolCm3 = useMemo(() => {
    const grossCaseCm3 = cartridge.overflow_capacity_gr_h2o * 0.06479891;
    const seatingDepthCm = seatingDepth * 2.54;
    const bulletRadiusCm = (cartridge.bullet_diameter_in * 2.54) / 2;
    const seatedBulletVolCm3 = Math.PI * Math.pow(bulletRadiusCm, 2) * seatingDepthCm * 0.95;
    return Math.max(0.1, grossCaseCm3 - seatedBulletVolCm3);
  }, [cartridge, seatingDepth]);

  // Main Simulation Solve
  const { simulationResult, solveTimeMs } = useMemo(() => {
    const start = performance.now();
    const result = simulateInteriorBallistics({
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      barrelLengthInches: barrelLength,
      seatingDepthInches: seatingDepth,
      shotStartPressureBar: projectile.shot_start_pressure_bar,
      baOffsetPct,
    });
    const duration = performance.now() - start;
    return { simulationResult: result, solveTimeMs: duration };
  }, [cartridge, projectile, propellant, chargeGrains, barrelLength, seatingDepth, baOffsetPct]);

  // OBT Harmonics Nodes
  const obtNodes = useMemo(() => {
    return calculateOBTNodes(barrelLength, simulationResult.barrel_time_ms);
  }, [barrelLength, simulationResult.barrel_time_ms]);

  // Stepping Ladder Calculation
  const chargeLadderSteps = useMemo(() => {
    if (!isLadderOpen) return [];
    return generateChargeLadder({
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      barrelLengthInches: barrelLength,
      seatingDepthInches: seatingDepth,
      shotStartPressureBar: projectile.shot_start_pressure_bar,
      baOffsetPct,
    });
  }, [isLadderOpen, cartridge, projectile, propellant, chargeGrains, barrelLength, seatingDepth, baOffsetPct]);

  // Propellant Ranking Matrix Calculation
  const propellantRanking = useMemo(() => {
    if (!isCompareOpen) return [];
    return rankPropellantsForLoad(
      {
        cartridge,
        projectile,
        barrelLengthInches: barrelLength,
        seatingDepthInches: seatingDepth,
        shotStartPressureBar: projectile.shot_start_pressure_bar,
        baOffsetPct: 0,
      },
      propellants
    );
  }, [isCompareOpen, cartridge, projectile, barrelLength, seatingDepth, propellants]);

  // Chronograph Calibration Helper
  const handleCalibrateBa = (measuredFps: number) => {
    return calibrateBaForChronograph(
      {
        cartridge,
        projectile,
        propellant,
        chargeGrains,
        barrelLengthInches: barrelLength,
        seatingDepthInches: seatingDepth,
        shotStartPressureBar: projectile.shot_start_pressure_bar,
        baOffsetPct,
      },
      measuredFps
    );
  };

  // Reset to Factory Specs
  const handleResetToDefaults = () => {
    setChargeGrains(41.5);
    setBarrelLength(cartridge.default_barrel_length_in);
    setSeatingDepth(projectile.default_seating_depth_in);
    setBaOffsetPct(0);
  };

  // Import handler for .qdf / .vol
  const handleImportCartridge = (imported: CartridgeSpec) => {
    setCartridges(prev => [imported, ...prev.filter(c => c.id !== imported.id)]);
    handleSelectCartridge(imported);
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        cartridges={cartridges}
        selectedCartridge={cartridge}
        onSelectCartridge={handleSelectCartridge}
        isMetric={isMetric}
        onToggleUnits={() => setIsMetric(!isMetric)}
        onOpenLadder={() => setIsLadderOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenPowderDB={() => setIsPowderDBOpen(true)}
        onOpenOBT={() => setIsOBTOpen(true)}
        onOpenTruing={() => setIsTruingOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Main Split-Screen Workbench */}
      <main className="app-main">
        {/* Left Side: Geometry, Projectile, and Propellant Decks */}
        <section ref={leftPanelRef} className="left-panel">
          <CartridgeDeck
            cartridge={cartridge}
            onChangeCartridge={setCartridge}
            barrelLength={barrelLength}
            onChangeBarrelLength={setBarrelLength}
            isMetric={isMetric}
          />

          <ProjectileDeck
            projectiles={projectiles}
            projectile={projectile}
            onChangeProjectile={setProjectile}
            seatingDepth={seatingDepth}
            onChangeSeatingDepth={setSeatingDepth}
            usableChamberVolCm3={usableChamberVolCm3}
            isMetric={isMetric}
          />

          <PropellantDeck
            propellants={propellants}
            propellant={propellant}
            onChangePropellant={setPropellant}
            chargeGrains={chargeGrains}
            onChangeChargeGrains={setChargeGrains}
            loadingDensityPct={simulationResult.loading_density_pct}
            baOffsetPct={baOffsetPct}
            onChangeBaOffsetPct={setBaOffsetPct}
            isMetric={isMetric}
            onOpenPowderDB={() => setIsPowderDBOpen(true)}
          />
        </section>

        {/* Right Side: Diagnostics Badges & Dual Curve Chart */}
        <section className="right-panel">
          <DiagnosticsDeck
            result={simulationResult}
            mapPressureBar={cartridge.max_pressure_bar}
            isMetric={isMetric}
          />

          <BallisticsChart
            result={simulationResult}
            barrelLengthInches={barrelLength}
            caseLengthInches={cartridge.case_length_in}
            mapPressureBar={cartridge.max_pressure_bar}
            isMetric={isMetric}
            obtNodes={obtNodes}
          />
        </section>
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        status={simulationResult.pressure_status}
        maxPressureBar={simulationResult.max_pressure_bar}
        mapPressureBar={cartridge.max_pressure_bar}
        calcTimeMs={solveTimeMs}
        cartridgeName={cartridge.name}
      />

      {/* Modals & Diagnostic Tools */}
      <ChargeLadderModal
        isOpen={isLadderOpen}
        onClose={() => setIsLadderOpen(false)}
        steps={chargeLadderSteps}
        currentCharge={chargeGrains}
        mapPressureBar={cartridge.max_pressure_bar}
        onSelectCharge={(charge) => {
          setChargeGrains(charge);
          setIsLadderOpen(false);
        }}
        isMetric={isMetric}
      />

      <PowderCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        ranking={propellantRanking}
        propellants={propellants}
        onSelectPropellantAndCharge={(newProp, newCharge) => {
          setPropellant(newProp);
          setChargeGrains(newCharge);
        }}
        isMetric={isMetric}
      />

      <PowderDatabaseModal
        isOpen={isPowderDBOpen}
        onClose={() => setIsPowderDBOpen(false)}
        propellants={propellants}
        activePropellant={propellant}
        onSelectPropellant={(p) => setPropellant(p)}
      />

      <OBTModal
        isOpen={isOBTOpen}
        onClose={() => setIsOBTOpen(false)}
        nodes={obtNodes}
        barrelLengthInches={barrelLength}
        currentBarrelTimeMs={simulationResult.barrel_time_ms}
      />

      <ChronoTruingModal
        isOpen={isTruingOpen}
        onClose={() => setIsTruingOpen(false)}
        propellant={propellant}
        currentVelocityFps={simulationResult.muzzle_velocity_fps}
        onApplyBaOffset={setBaOffsetPct}
        onCalibrateBa={handleCalibrateBa}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCartridge={handleImportCartridge}
      />

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        cartridge={cartridge}
        projectile={projectile}
        propellant={propellant}
        chargeGrains={chargeGrains}
        barrelLength={barrelLength}
        seatingDepth={seatingDepth}
        result={simulationResult}
        isMetric={isMetric}
      />
    </div>
  );
};

export default App;
