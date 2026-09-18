import { CartridgeSpec } from '../types/cartridge';
import { PropellantSpec } from '../types/propellant';
import { ProjectileSpec } from '../types/projectile';

/**
 * Parses QuickDESIGN / Wildcat Studio (.qdf) interchange text.
 */
export function parseQuickDesignQDF(content: string): Partial<CartridgeSpec> | null {
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

/**
 * Parses QuickLOAD legacy volume record (.vol).
 */
export function parseQuickLoadVOL(line: string): Partial<CartridgeSpec> | null {
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
    category: 'QuickLOAD Import',
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
 * Parses QuickLOAD propellant file (.pro) line or content.
 */
export function parseQuickLoadPRO(content: string): Partial<PropellantSpec>[] {
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
    let manufacturer = 'Custom / QuickLOAD';
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
 * Parses QuickLOAD projectile file (.bul) line or content.
 */
export function parseQuickLoadBUL(content: string): Partial<ProjectileSpec>[] {
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

    let manufacturer = 'QuickLOAD Import';
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
 * Exports complete load recipe configuration (.qlo / JSON format).
 */
export function exportLoadRecipeJSON(load: {
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  barrelLengthInches: number;
  seatingDepthInches: number;
  shotStartPressureBar: number;
}): string {
  return JSON.stringify({
    format: 'LoadBench_Load_Record',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ...load,
  }, null, 2);
}
