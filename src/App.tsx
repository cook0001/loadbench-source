import React, { useState, useMemo, useRef, useEffect } from 'react';
import './App.css';

// Types
import { CartridgeSpec } from './types/cartridge';
import { ProjectileSpec } from './types/projectile';
import { PropellantSpec } from './types/propellant';
import { PrimerSpec, PrimerPocketSize } from './types/primer';

// Preloaded Databases
import initialCartridges from './data/cartridges.json';
import initialPropellants from './data/propellants.json';
import initialProjectiles from './data/projectiles.json';
import initialPrimers from './data/primers.json';

// Ballistics, Harmonics & Tool Engines
import { 
  simulateInteriorBallistics, 
  generateChargeLadder, 
  rankPropellantsForLoad,
  calibrateBaForChronograph 
} from './utils/ballisticsEngine';
import { calculateOBTNodes } from './utils/obtEngine';
import { calculateRecoilDynamics } from './utils/recoilEngine';
import { calculateGyroscopicStability } from './utils/stabilityEngine';

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
import { ProjectileDatabaseModal } from './components/tools/ProjectileDatabaseModal';
import { ManufacturerMatchModal } from './components/tools/ManufacturerMatchModal';
import { RecoilModal } from './components/tools/RecoilModal';
import { TrajectoryModal } from './components/tools/TrajectoryModal';
import { BarrelLengthModal } from './components/tools/BarrelLengthModal';
import { CaseWaterWeightModal } from './components/tools/CaseWaterWeightModal';
import { CustomWildcatModal } from './components/tools/CustomWildcatModal';
import { ImportModal } from './components/modals/ImportModal';
import { ExportReportModal } from './components/modals/ExportReportModal';

export const App: React.FC = () => {
  const leftPanelRef = useRef<HTMLElement | null>(null);

  // Persistent Custom Collections (localStorage)
  const [customCartridges, setCustomCartridges] = useState<CartridgeSpec[]>(() => {
    try {
      const saved = localStorage.getItem('loadbench_custom_cartridges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customPropellants, setCustomPropellants] = useState<PropellantSpec[]>(() => {
    try {
      const saved = localStorage.getItem('loadbench_custom_propellants');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customProjectiles, setCustomProjectiles] = useState<ProjectileSpec[]>(() => {
    try {
      const saved = localStorage.getItem('loadbench_custom_projectiles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Aggregated Catalogs
  const cartridges = useMemo<CartridgeSpec[]>(() => {
    return [...customCartridges, ...(initialCartridges as CartridgeSpec[])];
  }, [customCartridges]);

  const propellants = useMemo<PropellantSpec[]>(() => {
    return [...customPropellants, ...(initialPropellants as PropellantSpec[])];
  }, [customPropellants]);

  const projectiles = useMemo<ProjectileSpec[]>(() => {
    return [...customProjectiles, ...(initialProjectiles as ProjectileSpec[])];
  }, [customProjectiles]);

  const [primers] = useState<PrimerSpec[]>(initialPrimers as PrimerSpec[]);

  // Default Selected Components (6.5 Creedmoor with 140 gr ELD-M and Hodgdon H4350)
  const initialDefaultCartridge = useMemo(() => {
    return (
      (initialCartridges as CartridgeSpec[]).find(c => c.id === '65_creedmoor') ||
      (initialCartridges as CartridgeSpec[])[0]
    );
  }, []);

  const initialDefaultProjectile = useMemo(() => {
    return (
      (initialProjectiles as ProjectileSpec[]).find(p => p.id === 'hornady_65_eldm_140') ||
      (initialProjectiles as ProjectileSpec[])[0]
    );
  }, []);

  const initialDefaultPropellant = useMemo(() => {
    return (
      (initialPropellants as PropellantSpec[]).find(p => p.id === 'hodgdon_h4350') ||
      (initialPropellants[0] as PropellantSpec)
    );
  }, []);

  const [cartridge, setCartridge] = useState<CartridgeSpec>(initialDefaultCartridge);
  const [projectile, setProjectile] = useState<ProjectileSpec>(initialDefaultProjectile);
  const [propellant, setPropellant] = useState<PropellantSpec>(initialDefaultPropellant);

  // Primer State
  const [selectedPrimerPocket, setSelectedPrimerPocket] = useState<PrimerPocketSize>(
    initialDefaultCartridge.default_primer_pocket || 'large_rifle'
  );

  const [selectedPrimer, setSelectedPrimer] = useState<PrimerSpec>(() => {
    const def = (initialPrimers as PrimerSpec[]).find(p => p.id === initialDefaultCartridge.default_primer_id);
    return def || (initialPrimers as PrimerSpec[]).find(p => p.pocket_size === (initialDefaultCartridge.default_primer_pocket || 'large_rifle')) || (initialPrimers[0] as PrimerSpec);
  });

  // Load Parameters
  const [chargeGrains, setChargeGrains] = useState<number>(41.5);
  const [barrelLength, setBarrelLength] = useState<number>(initialDefaultCartridge.default_barrel_length_in);
  const [seatingDepth, setSeatingDepth] = useState<number>(initialDefaultProjectile.default_seating_depth_in);
  const [barrelTwistInches, setBarrelTwistInches] = useState<number>(8.0);
  const [powderTemperatureF, setPowderTemperatureF] = useState<number>(70);
  const [isTouchingLands, setIsTouchingLands] = useState<boolean>(false);
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
  const [isProjectileDBOpen, setIsProjectileDBOpen] = useState<boolean>(false);
  const [isMatchOpen, setIsMatchOpen] = useState<boolean>(false);
  const [isOBTOpen, setIsOBTOpen] = useState<boolean>(false);
  const [isTruingOpen, setIsTruingOpen] = useState<boolean>(false);
  const [isRecoilOpen, setIsRecoilOpen] = useState<boolean>(false);
  const [isTrajectoryOpen, setIsTrajectoryOpen] = useState<boolean>(false);
  const [isBarrelStepperOpen, setIsBarrelStepperOpen] = useState<boolean>(false);
  const [isCaseWaterOpen, setIsCaseWaterOpen] = useState<boolean>(false);
  const [isWildcatOpen, setIsWildcatOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Cartridge Selection Handler
  const handleSelectCartridge = (newCartridge: CartridgeSpec) => {
    setCartridge(newCartridge);
    setBarrelLength(newCartridge.default_barrel_length_in);

    // Auto-sync primer pocket & primer
    const pocket = newCartridge.default_primer_pocket || 'large_rifle';
    setSelectedPrimerPocket(pocket);
    const matchingPrimer = 
      primers.find(p => p.id === newCartridge.default_primer_id) || 
      primers.find(p => p.pocket_size === pocket) || 
      primers[0];
    setSelectedPrimer(matchingPrimer);

    // Auto-select matching caliber bullet if available
    const matchingProj = projectiles.find(p => Math.abs(p.caliber_in - newCartridge.bullet_diameter_in) < 0.005);
    if (matchingProj) {
      setProjectile(matchingProj);
      setSeatingDepth(matchingProj.default_seating_depth_in);
    }
  };

  // Primer Pocket Switcher Handler
  const handleChangePrimerPocket = (pocket: PrimerPocketSize) => {
    setSelectedPrimerPocket(pocket);
    const available = primers.filter(p => p.pocket_size === pocket);
    if (available.length > 0) {
      setSelectedPrimer(available[0]);
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

  // Main Interior Ballistics Simulation Solve
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
      primer: selectedPrimer,
      powderTemperatureF,
      isTouchingLands,
    });
    const duration = performance.now() - start;
    return { simulationResult: result, solveTimeMs: duration };
  }, [cartridge, projectile, propellant, chargeGrains, barrelLength, seatingDepth, baOffsetPct, selectedPrimer, powderTemperatureF, isTouchingLands]);

  // Live Recoil Dynamics
  const recoilResult = useMemo(() => {
    return calculateRecoilDynamics({
      bulletWeightGrains: projectile.weight_grains,
      powderChargeGrains: chargeGrains,
      muzzleVelocityFps: simulationResult.muzzle_velocity_fps,
      rifleWeightLbs: 9.5,
    });
  }, [projectile.weight_grains, chargeGrains, simulationResult.muzzle_velocity_fps]);

  // Live Gyroscopic Stability Sg
  const stabilityResult = useMemo(() => {
    return calculateGyroscopicStability({
      bulletDiameterInches: projectile.caliber_in,
      bulletWeightGrains: projectile.weight_grains,
      bulletLengthInches: projectile.length_in,
      barrelTwistInches,
      muzzleVelocityFps: simulationResult.muzzle_velocity_fps,
      temperatureF: powderTemperatureF,
    });
  }, [projectile.caliber_in, projectile.weight_grains, projectile.length_in, barrelTwistInches, simulationResult.muzzle_velocity_fps, powderTemperatureF]);

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
      primer: selectedPrimer,
      powderTemperatureF,
      isTouchingLands,
    });
  }, [isLadderOpen, cartridge, projectile, propellant, chargeGrains, barrelLength, seatingDepth, baOffsetPct, selectedPrimer, powderTemperatureF, isTouchingLands]);

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
        primer: selectedPrimer,
        powderTemperatureF,
        isTouchingLands,
      },
      propellants
    );
  }, [isCompareOpen, cartridge, projectile, barrelLength, seatingDepth, propellants, selectedPrimer, powderTemperatureF, isTouchingLands]);

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
        primer: selectedPrimer,
        powderTemperatureF,
        isTouchingLands,
      },
      measuredFps
    );
  };

  // Reset to Factory Specs
  const handleResetToDefaults = () => {
    setChargeGrains(41.5);
    setBarrelLength(cartridge.default_barrel_length_in);
    setSeatingDepth(projectile.default_seating_depth_in);
    setBarrelTwistInches(8.0);
    setPowderTemperatureF(70);
    setIsTouchingLands(false);
    setBaOffsetPct(0);
  };

  // Custom Wildcat Saved Handler
  const handleSaveCustomWildcat = (newWildcat: CartridgeSpec) => {
    setCustomCartridges(prev => {
      const updated = [newWildcat, ...prev.filter(c => c.id !== newWildcat.id)];
      try {
        localStorage.setItem('loadbench_custom_cartridges', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist custom wildcats:', e);
      }
      return updated;
    });
    handleSelectCartridge(newWildcat);
  };

  // Import Handler (.qdf / .vol / .pro / .bul)
  const handleImportCartridge = (imported: CartridgeSpec) => {
    handleSaveCustomWildcat(imported);
  };

  const handleImportPropellants = (imported: PropellantSpec[]) => {
    setCustomPropellants(prev => {
      const map = new Map<string, PropellantSpec>();
      prev.forEach(p => map.set(p.id, p));
      imported.forEach(p => map.set(p.id, p));
      const updated = Array.from(map.values());
      try {
        localStorage.setItem('loadbench_custom_propellants', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist custom propellants:', e);
      }
      return updated;
    });
    if (imported.length > 0) {
      setPropellant(imported[0]);
    }
  };

  const handleImportProjectiles = (imported: ProjectileSpec[]) => {
    setCustomProjectiles(prev => {
      const map = new Map<string, ProjectileSpec>();
      prev.forEach(p => map.set(p.id, p));
      imported.forEach(p => map.set(p.id, p));
      const updated = Array.from(map.values());
      try {
        localStorage.setItem('loadbench_custom_projectiles', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist custom projectiles:', e);
      }
      return updated;
    });
    if (imported.length > 0) {
      setProjectile(imported[0]);
    }
  };

  // Case Water Capacity Calibrated Handler
  const handleApplyCaseWaterCapacity = (capacityGrH2O: number) => {
    setCartridge(prev => ({
      ...prev,
      overflow_capacity_gr_h2o: capacityGrH2O,
    }));
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
        onOpenProjectileDB={() => setIsProjectileDBOpen(true)}
        onOpenManufacturerMatch={() => setIsMatchOpen(true)}
        onOpenOBT={() => setIsOBTOpen(true)}
        onOpenTruing={() => setIsTruingOpen(true)}
        onOpenTrajectory={() => setIsTrajectoryOpen(true)}
        onOpenRecoil={() => setIsRecoilOpen(true)}
        onOpenBarrelStepper={() => setIsBarrelStepperOpen(true)}
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
            selectedPrimerPocket={selectedPrimerPocket}
            onChangePrimerPocket={handleChangePrimerPocket}
            selectedPrimer={selectedPrimer}
            onChangePrimer={setSelectedPrimer}
            primers={primers}
            onOpenCaseWaterModal={() => setIsCaseWaterOpen(true)}
            onOpenWildcatModal={() => setIsWildcatOpen(true)}
            isMetric={isMetric}
          />

          <ProjectileDeck
            projectiles={projectiles}
            projectile={projectile}
            onChangeProjectile={setProjectile}
            seatingDepth={seatingDepth}
            onChangeSeatingDepth={setSeatingDepth}
            barrelTwistInches={barrelTwistInches}
            onChangeBarrelTwist={setBarrelTwistInches}
            isTouchingLands={isTouchingLands}
            onChangeTouchingLands={setIsTouchingLands}
            cartridgeBulletDiaIn={cartridge.bullet_diameter_in}
            usableChamberVolCm3={usableChamberVolCm3}
            muzzleVelocityFps={simulationResult.muzzle_velocity_fps}
            isMetric={isMetric}
            onOpenProjectileDB={() => setIsProjectileDBOpen(true)}
          />

          <PropellantDeck
            propellants={propellants}
            propellant={propellant}
            onChangePropellant={setPropellant}
            chargeGrains={chargeGrains}
            onChangeChargeGrains={setChargeGrains}
            loadingDensityPct={simulationResult.loading_density_pct}
            powderTemperatureF={powderTemperatureF}
            onChangePowderTemperature={setPowderTemperatureF}
            baOffsetPct={baOffsetPct}
            onChangeBaOffsetPct={setBaOffsetPct}
            isMetric={isMetric}
            onOpenPowderDB={() => setIsPowderDBOpen(true)}
            onOpenManufacturerMatch={() => setIsMatchOpen(true)}
          />
        </section>

        {/* Right Side: Diagnostics Badges & Dual Curve Chart */}
        <section className="right-panel">
          <DiagnosticsDeck
            result={simulationResult}
            mapPressureBar={cartridge.max_pressure_bar}
            isMetric={isMetric}
            recoilEnergyFtLbs={recoilResult.recoilEnergyFtLbs}
            recoilVelocityFps={recoilResult.recoilVelocityFps}
            stabilitySg={stabilityResult.sg}
            onOpenRecoil={() => setIsRecoilOpen(true)}
            onOpenTrajectory={() => setIsTrajectoryOpen(true)}
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

      <ProjectileDatabaseModal
        isOpen={isProjectileDBOpen}
        onClose={() => setIsProjectileDBOpen(false)}
        projectiles={projectiles}
        activeProjectile={projectile}
        onSelectProjectile={(p) => {
          setProjectile(p);
          setSeatingDepth(p.default_seating_depth_in);
        }}
        cartridgeBulletDiaIn={cartridge.bullet_diameter_in}
        barrelTwistInches={barrelTwistInches}
        muzzleVelocityFps={simulationResult.muzzle_velocity_fps}
        isMetric={isMetric}
      />

      <ManufacturerMatchModal
        isOpen={isMatchOpen}
        onClose={() => setIsMatchOpen(false)}
        cartridge={cartridge}
        projectile={projectile}
        propellant={propellant}
        currentChargeGrains={chargeGrains}
        currentBarrelLengthIn={barrelLength}
        currentSeatingDepthIn={seatingDepth}
        currentResult={simulationResult}
        onApplyBaOffset={(offset) => setBaOffsetPct(offset)}
        onApplyChargeWeight={(charge) => setChargeGrains(charge)}
        isMetric={isMetric}
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

      <RecoilModal
        isOpen={isRecoilOpen}
        onClose={() => setIsRecoilOpen(false)}
        bulletWeightGrains={projectile.weight_grains}
        chargeGrains={chargeGrains}
        muzzleVelocityFps={simulationResult.muzzle_velocity_fps}
        cartridgeName={cartridge.name}
        isMetric={isMetric}
      />

      <TrajectoryModal
        isOpen={isTrajectoryOpen}
        onClose={() => setIsTrajectoryOpen(false)}
        muzzleVelocityFps={simulationResult.muzzle_velocity_fps}
        bulletWeightGrains={projectile.weight_grains}
        bcG1={projectile.bc_g1}
        bcG7={projectile.bc_g7}
        projectileName={projectile.name}
        cartridgeName={cartridge.name}
        isMetric={isMetric}
      />

      <BarrelLengthModal
        isOpen={isBarrelStepperOpen}
        onClose={() => setIsBarrelStepperOpen(false)}
        cartridge={cartridge}
        projectile={projectile}
        propellant={propellant}
        chargeGrains={chargeGrains}
        currentBarrelLengthInches={barrelLength}
        seatingDepthInches={seatingDepth}
        primer={selectedPrimer}
        powderTemperatureF={powderTemperatureF}
        isTouchingLands={isTouchingLands}
        baOffsetPct={baOffsetPct}
        onApplyBarrelLength={(len) => {
          setBarrelLength(len);
          setIsBarrelStepperOpen(false);
        }}
        isMetric={isMetric}
      />

      <CaseWaterWeightModal
        isOpen={isCaseWaterOpen}
        onClose={() => setIsCaseWaterOpen(false)}
        nominalCapacityGrH2O={cartridge.overflow_capacity_gr_h2o}
        cartridgeName={cartridge.name}
        onApplyCapacity={(cap) => {
          handleApplyCaseWaterCapacity(cap);
          setIsCaseWaterOpen(false);
        }}
        isMetric={isMetric}
      />

      <CustomWildcatModal
        isOpen={isWildcatOpen}
        onClose={() => setIsWildcatOpen(false)}
        onSaveWildcat={(w) => {
          handleSaveCustomWildcat(w);
          setIsWildcatOpen(false);
        }}
        isMetric={isMetric}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCartridge={handleImportCartridge}
        onImportPropellants={handleImportPropellants}
        onImportProjectiles={handleImportProjectiles}
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
