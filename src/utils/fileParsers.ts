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
  };
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
    format: 'QuickLOAD_Studio_Load_Record',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ...load,
  }, null, 2);
}
