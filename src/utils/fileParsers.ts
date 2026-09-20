import { CartridgeSpec } from '../types/cartridge';
import { PropellantSpec } from '../types/propellant';
import { ProjectileSpec } from '../types/projectile';

/**
 * Parses Universal Cartridge Interchange (.qdf / .dat) text.
 */
export function parseUniversalQDF(content: string): Partial<CartridgeSpec> | null {
  try {
    const lines = content.split('\n');
    const data: Record<string, string> = {};

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith(';') || line.startsWith('#') || line.startsWith('[') || !line.includes('=')) {
        continue;
      }
      const [key, ...vals] = line.split('=');
      if (key && vals.length > 0) {
        data[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }

    if (!data.Name && !data.ID) {
      return null;
    }

    const name = data.Name || 'Imported Cartridge';
    const id = data.ID || `imported_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const standard = (data.Standard === 'CIP' || data.Standard === 'SAAMI') ? data.Standard : 'Wildcat';
    const caseLength = parseFloat(data.CaseLength_in || '2.0');
    const coal = parseFloat(data.COAL_in || '2.8');
    const bulletDia = parseFloat(data.BulletDia_in || '0.308');
    const maxBar = parseFloat(data.MaxPressure_bar || '4150');
    const maxPsi = parseFloat(data.MaxPressure_psi || String(Math.round(maxBar * 14.5038)));
    const overflowH2O = parseFloat(data.OverflowCapacity_grH2O || '55.0');
    const boreArea = Math.PI * Math.pow(bulletDia / 2, 2) * 0.988;

    return {
      id,
      name,
      standard,
      category: 'Imported from Wildcat Studio',
      case_length_in: caseLength,
      coal_in: coal,
      bullet_diameter_in: bulletDia,
      bore_diameter_in: bulletDia - 0.008,
      groove_diameter_in: bulletDia,
      bore_area_sq_in: Number(boreArea.toFixed(4)),
      overflow_capacity_gr_h2o: overflowH2O,
      max_pressure_bar: maxBar,
      max_pressure_psi: maxPsi,
      default_barrel_length_in: 24.0,
      rim_diameter_in: data.RimDia_in ? parseFloat(data.RimDia_in) : undefined,
      base_diameter_in: data.BaseDia_in ? parseFloat(data.BaseDia_in) : undefined,
    };
  } catch (err) {
    console.error('Failed to parse QDF file:', err);
    return null;
  }
}

// Backward-compatible alias
export const parseQuickDesignQDF = parseUniversalQDF;

/**
 * Parses native Wildcat Studio Cartridge Specification (.wildcat / .wcs).
 * MIME: application/vnd.wildcatstudio.cartridge+json
 */
export function parseWildcatSpecJSON(content: string): Partial<CartridgeSpec> | null {
  try {
    const data = JSON.parse(content);
    if (!data || (data.format !== 'wildcat_cartridge_specification' && !data.dimensions && !data.bulletDiameter && !data.bullet_diameter)) {
      return null;
    }

    const meta = data.metadata || {};
    const dims = data.dimensions || {};
    const vol = data.volumetrics || {};
    const safety = data.safety_limits || {};

    const name = meta.name || data.name || 'Wildcat Cartridge';
    const id = meta.id || data.id || `wildcat_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const bulletDia = dims.bullet_diameter_in || dims.bullet_diameter || data.bulletDiameter || dims.bulletDiameter || 0.264;
    const caseLength = dims.case_length_in || dims.case_length || data.caseLength || dims.caseLength || 2.0;
    const coal = dims.overall_length_in || dims.overallLength || data.overallLength || dims.coal_in || dims.coal || caseLength + 0.8;
    const maxBar = safety.max_pressure_bar || data.max_pressure_bar || 4200;
    const maxPsi = safety.max_pressure_psi || vol.est_peak_pressure_psi || data.estPeakPressurePsi || data.max_pressure_psi || Math.round(maxBar * 14.5038);
    const overflowH2O = vol.gross_water_capacity_gr_h2o || vol.overflow_capacity_grains_h2o || vol.effective_capacity_gr_h2o || data.waterCapacityGrains || 50.0;
    const boreArea = Math.PI * Math.pow(bulletDia / 2, 2) * 0.988;

    return {
      id,
      name,
      standard: (meta.standard === 'CIP' || meta.standard === 'SAAMI') ? meta.standard : 'Wildcat',
      category: meta.category || (meta.designer ? `Wildcat (by ${meta.designer})` : 'Wildcat Studio'),
      case_length_in: caseLength,
      coal_in: coal,
      bullet_diameter_in: bulletDia,
      bore_diameter_in: bulletDia - 0.008,
      groove_diameter_in: bulletDia,
      bore_area_sq_in: Number(boreArea.toFixed(4)),
      overflow_capacity_gr_h2o: overflowH2O,
      max_pressure_bar: maxBar,
      max_pressure_psi: maxPsi,
      default_barrel_length_in: 24.0,
      rim_diameter_in: dims.rim_diameter_in || dims.rim_diameter || data.rimDiameter || dims.rimDiameter,
      base_diameter_in: dims.base_diameter_in || dims.base_diameter || data.baseDiameter || dims.baseDiameter,
    };
  } catch {
    return null;
  }
}

/**
 * Parses legacy volume record (.vol).
 */
export function parseLegacyVolRecord(line: string): Partial<CartridgeSpec> | null {
  const clean = line.trim();
  if (!clean || clean.startsWith('#') || clean.startsWith(';')) {
    return null;
  }

  const fields = clean.split('","').map(f => f.replace(/^"|"$/g, '').trim());
  if (fields.length < 8) {
    return null;
  }

  const name = fields[0];
  const overflowH2O = parseFloat(fields[1]) || 50.0;
  const caseLength = parseFloat(fields[2]) || 2.0;
  const bulletDia = parseFloat(fields[3]) || 0.308;
  const boreArea = parseFloat(fields[4]) || (Math.PI * Math.pow(bulletDia / 2, 2) * 0.99);
  const grooveDia = parseFloat(fields[5]) || bulletDia;
  const maxPressureBar = parseFloat(fields[6]) || 4000.0;
  const standardStr = fields[7] || 'SAAMI';
  const coal = fields[8] ? parseFloat(fields[8]) : caseLength + 0.7;

  return {
    id: `ql_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name,
    standard: standardStr.includes('CIP') ? 'CIP' : 'SAAMI',
    category: 'Imported Cartridge',
    overflow_capacity_gr_h2o: overflowH2O,
    case_length_in: caseLength,
    bullet_diameter_in: bulletDia,
    bore_diameter_in: bulletDia - 0.008,
    groove_diameter_in: grooveDia,
    bore_area_sq_in: Number(boreArea.toFixed(4)),
    max_pressure_bar: maxPressureBar,
    max_pressure_psi: Math.round(maxPressureBar * 14.5038),
    coal_in: coal,
    default_barrel_length_in: 24.0,
    default_primer_pocket: 'large_rifle',
    supported_primer_pockets: ['large_rifle', 'small_rifle'],
    default_primer_id: 'fed_210m',
  };
}

/**
 * Parses legacy propellant file (.pro) line or content.
 */
export function parseLegacyProRecord(content: string): Partial<PropellantSpec>[] {
  const results: Partial<PropellantSpec>[] = [];
  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    const fields = line.split('","').map(f => f.replace(/^"|"$/g, '').trim());
    if (fields.length < 7) continue;

    const name = fields[0];
    const heatOfExplosion = parseFloat(fields[1]) || 3800; // Qex (cal/g or J/g)
    const ratioSpecificHeats = parseFloat(fields[2]) || 1.23; // gamma
    const burnRateBa = parseFloat(fields[3]) || 0.50; // Ba
    const forceConstant = parseFloat(fields[4]) || 1050; // f
    const coVolume = parseFloat(fields[5]) || 0.95; // eta
    const solidDensity = parseFloat(fields[6]) || 1.60;
    const bulkDensity = fields[7] ? parseFloat(fields[7]) : 0.92;

    // Detect manufacturer from powder name prefix
    let manufacturer = 'Imported Custom';
    if (name.includes('Hodgdon') || name.startsWith('H') || name.startsWith('CFE') || name.startsWith('Varget')) manufacturer = 'Hodgdon';
    else if (name.includes('Alliant') || name.startsWith('Reloder') || name.startsWith('RL')) manufacturer = 'Alliant';
    else if (name.includes('Vihtavuori') || name.startsWith('N1') || name.startsWith('N5')) manufacturer = 'Vihtavuori';
    else if (name.includes('IMR')) manufacturer = 'IMR';
    else if (name.includes('Winchester') || name.startsWith('W')) manufacturer = 'Winchester';
    else if (name.includes('Norma')) manufacturer = 'Norma';
    else if (name.includes('Ramshot')) manufacturer = 'Ramshot';
    else if (name.includes('Accurate') || name.startsWith('AA')) manufacturer = 'Accurate';
    else if (name.includes('Reload Swiss') || name.startsWith('RS')) manufacturer = 'Reload Swiss';

    const vmd = Number((1 / (bulkDensity * 15.432358)).toFixed(4));

    results.push({
      id: `ql_prop_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name,
      manufacturer,
      burn_rate_ba: burnRateBa,
      heat_of_explosion_j_g: heatOfExplosion > 2000 ? heatOfExplosion : Math.round(heatOfExplosion * 4.184),
      force_constant_j_g: forceConstant,
      ratio_specific_heats: ratioSpecificHeats,
      co_volume_cm3_g: coVolume,
      solid_density_g_cm3: solidDensity,
      bulk_density_g_cm3: bulkDensity,
      grain_geometry: 'tubular',
      progressivity_z0: 1.0,
      progressivity_z1: 0.8,
      pressure_exponent_alpha: 1.0,
      vmd_cc_gr: vmd,
      chemical_base: heatOfExplosion > 3900 ? 'double_base' : 'single_base',
      is_custom: true,
    });
  }

  return results;
}

/**
 * Parses legacy projectile file (.bul) line or content.
 */
export function parseLegacyBulRecord(content: string): Partial<ProjectileSpec>[] {
  const results: Partial<ProjectileSpec>[] = [];
  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    const fields = line.split('","').map(f => f.replace(/^"|"$/g, '').trim());
    if (fields.length < 5) continue;

    const name = fields[0];
    const weightGrains = parseFloat(fields[1]) || 140;
    const caliberIn = parseFloat(fields[2]) || 0.264;
    const lengthIn = parseFloat(fields[3]) || 1.30;
    const g1Bc = fields[4] ? parseFloat(fields[4]) : 0.50;

    let manufacturer = 'Imported Bullet';
    if (name.includes('Hornady')) manufacturer = 'Hornady';
    else if (name.includes('Sierra')) manufacturer = 'Sierra';
    else if (name.includes('Berger')) manufacturer = 'Berger';
    else if (name.includes('Lapua')) manufacturer = 'Lapua';
    else if (name.includes('Nosler')) manufacturer = 'Nosler';
    else if (name.includes('Barnes')) manufacturer = 'Barnes';
    else if (name.includes('Speer')) manufacturer = 'Speer';

    const isMono = name.toLowerCase().includes('copper') || name.toLowerCase().includes('tsx') || name.toLowerCase().includes('solid');

    results.push({
      id: `ql_bullet_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name,
      manufacturer,
      caliber_in: caliberIn,
      weight_grains: weightGrains,
      length_in: lengthIn,
      base_type: name.toLowerCase().includes('bt') || name.toLowerCase().includes('bthp') ? 'boat_tail' : 'flat_base',
      boat_tail_length_in: Number((lengthIn * 0.15).toFixed(3)),
      shank_length_in: Number((lengthIn * 0.45).toFixed(3)),
      default_seating_depth_in: Number((lengthIn * 0.28).toFixed(3)),
      shot_start_pressure_bar: isMono ? 380 : 250,
      bc_g1: g1Bc,
      bc_g7: Number((g1Bc * 0.505).toFixed(3)),
      is_custom: true,
    });
  }

  return results;
}

/**
 * Exports complete load recipe configuration (.loadbench / JSON format).
 */
export function exportLoadRecipeJSON(load: {
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  barrelLengthInches: number;
  seatingDepthInches: number;
  shotStartPressureBar: number;
  barrelTwistInches?: number;
  powderTemperatureF?: number;
  isTouchingLands?: boolean;
  baOffsetPct?: number;
  primer?: any;
  primerPocket?: any;
  metadata?: {
    recipe_title?: string;
    author?: string;
    lot_number?: string;
    batch_size?: number;
    target_firearm?: string;
    notes?: string;
  };
  performance?: {
    muzzle_velocity_fps?: number;
    muzzle_energy_ft_lbs?: number;
    max_pressure_bar?: number;
    max_pressure_psi?: number;
    barrel_time_ms?: number;
    propellant_burnt_pct?: number;
    loading_density_pct?: number;
    pressure_status?: string;
  };
}): string {
  const author =
    load.metadata?.author ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('loadbench_author_name') : '') ||
    'LoadBench Ballistician';

  return JSON.stringify(
    {
      $schema: 'https://armstrader.store/schemas/loadbench-recipe-v1.json',
      format: 'loadbench_recipe',
      legacy_format: 'LoadBench_Load_Record',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      metadata: {
        recipe_title: load.metadata?.recipe_title || `${load.cartridge.name} Load Recipe`,
        author,
        created_at: new Date().toISOString(),
        lot_number: load.metadata?.lot_number || 'LOT-001',
        batch_size: load.metadata?.batch_size || 50,
        target_firearm: load.metadata?.target_firearm || `${load.cartridge.name} Precision Rifle`,
        notes:
          load.metadata?.notes ||
          `Developed in LoadBench Studio. Muzzle velocity: ${load.performance?.muzzle_velocity_fps ? `${load.performance.muzzle_velocity_fps} fps` : 'Simulated'}.`,
      },
      cartridge: {
        ...load.cartridge,
        bullet_diameter_in: load.cartridge.bullet_diameter_in || load.projectile.caliber_in,
      },
      projectile: {
        ...load.projectile,
        caliber_in: load.projectile.caliber_in || load.cartridge.bullet_diameter_in,
      },
      propellant: load.propellant,
      charge: {
        charge_grains: load.chargeGrains,
        temperature_f: load.powderTemperatureF ?? 70,
        ba_offset_pct: load.baOffsetPct ?? 0,
      },
      dimensions: {
        barrel_length_in: load.barrelLengthInches,
        barrel_twist_in: load.barrelTwistInches || 8.0,
        seating_depth_in: load.seatingDepthInches,
        shot_start_pressure_bar: load.shotStartPressureBar,
        is_touching_lands: load.isTouchingLands || false,
      },
      primer: load.primer || {
        name: 'Standard Primer',
        pocket_size: load.primerPocket || 'large_rifle',
      },
      performance: load.performance || {},
      simulated: load.performance || {},
      // Flat fields for backward-compatibility with legacy LoadBench parsers
      chargeGrains: load.chargeGrains,
      barrelLengthInches: load.barrelLengthInches,
      barrelTwistInches: load.barrelTwistInches || 8.0,
      seatingDepthInches: load.seatingDepthInches,
      shotStartPressureBar: load.shotStartPressureBar,
      powderTemperatureF: load.powderTemperatureF ?? 70,
      isTouchingLands: load.isTouchingLands || false,
      baOffsetPct: load.baOffsetPct ?? 0,
    },
    null,
    2
  );
}

export interface ParsedLoadBenchRecipe {
  metadata?: {
    recipe_title?: string;
    author?: string;
    created_at?: string;
    updated_at?: string;
    lot_number?: string;
    batch_size?: number;
    target_firearm?: string | null;
    notes?: string;
  };
  cartridge?: Partial<CartridgeSpec>;
  projectile?: Partial<ProjectileSpec>;
  propellant?: Partial<PropellantSpec>;
  primer?: any;
  primerPocket?: any;
  chargeGrains?: number;
  barrelLengthInches?: number;
  barrelTwistInches?: number;
  seatingDepthInches?: number;
  powderTemperatureF?: number;
  isTouchingLands?: boolean;
  baOffsetPct?: number;
}

/**
 * Parses native LoadBench Recipe (.loadbench / .ldb) or legacy load file.
 */
export function parseLoadBenchRecipeJSON(content: string): ParsedLoadBenchRecipe | null {
  try {
    const data = JSON.parse(content);
    if (!data || typeof data !== 'object') return null;

    // 1. Check native loadbench_recipe schema
    if (data.format === 'loadbench_recipe' || (data.cartridge && data.projectile && data.propellant)) {
      const meta = data.metadata || {};
      const charge = data.charge || {};
      const dims = data.dimensions || {};

      return {
        metadata: {
          recipe_title: meta.recipe_title || (data.cartridge?.name ? `${data.cartridge.name} Load Recipe` : 'Imported Recipe'),
          author: meta.author || 'Bench Ballistician',
          created_at: meta.created_at,
          updated_at: meta.updated_at,
          lot_number: meta.lot_number || 'LOT-DEFAULT',
          batch_size: meta.batch_size || 50,
          target_firearm: meta.target_firearm || null,
          notes: meta.notes || '',
        },
        cartridge: data.cartridge,
        projectile: data.projectile,
        propellant: data.propellant,
        primer: data.primer,
        primerPocket: data.primer?.pocket_size || data.primerPocket || 'large_rifle',
        chargeGrains: typeof charge.charge_grains === 'number' ? charge.charge_grains : data.chargeGrains,
        barrelLengthInches: typeof dims.barrel_length_in === 'number' ? dims.barrel_length_in : data.barrelLengthInches,
        barrelTwistInches: typeof dims.barrel_twist_in === 'number' ? dims.barrel_twist_in : data.barrelTwistInches || 8.0,
        seatingDepthInches: typeof dims.seating_depth_in === 'number' ? dims.seating_depth_in : data.seatingDepthInches,
        powderTemperatureF: typeof charge.temperature_f === 'number' ? charge.temperature_f : data.powderTemperatureF || 70,
        isTouchingLands: typeof dims.is_touching_lands === 'boolean' ? dims.is_touching_lands : data.isTouchingLands || false,
        baOffsetPct: typeof charge.ba_offset_pct === 'number' ? charge.ba_offset_pct : data.baOffsetPct || 0,
      };
    }

    return null;
  } catch {
    return null;
  }
}
