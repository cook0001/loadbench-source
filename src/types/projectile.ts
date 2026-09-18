export type ProjectileBaseType = 'boat_tail' | 'flat_base' | 'round_nose';

export interface ProjectileSpec {
  id: string;
  name: string;
  manufacturer: string;
  caliber_in: number;
  weight_grains: number;
  length_in: number;
  base_type: ProjectileBaseType;
  boat_tail_length_in?: number;
  shank_length_in?: number;
  default_seating_depth_in: number;
  shot_start_pressure_bar: number; // P0, typically 250 bar (3625 psi) for standard jacketed
  bc_g1?: number;
  bc_g7?: number;
  caliber_designation?: string;
  category?: string;
  notes?: string;
  is_custom?: boolean;
}
