export type GrainGeometry = 'tubular' | 'progressive_7perf' | 'spherical' | 'flake';

export interface PropellantSpec {
  id: string;
  name: string;
  manufacturer: string;
  burn_rate_ba: number;           // 1 / (bar * s)
  heat_of_explosion_j_g: number;  // J / g (Qex)
  force_constant_j_g: number;     // J / g (f)
  ratio_specific_heats: number;   // γ (typically 1.22 - 1.25)
  co_volume_cm3_g: number;        // η (typically 0.85 - 1.05 cm³/g)
  solid_density_g_cm3: number;    // ρs (typically 1.55 - 1.62 g/cm³)
  bulk_density_g_cm3: number;     // ρbulk (typically 0.85 - 1.00 g/cm³)
  grain_geometry: GrainGeometry;
  progressivity_z0: number;       // initial form factor
  progressivity_z1: number;       // progressive limit
  pressure_exponent_alpha: number;// α in Vieille's law (typically 1.0)
  burn_chart_ranking?: number;    // relative burn speed ranking
  is_custom?: boolean;
}
