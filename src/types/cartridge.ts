import { PrimerPocketSize } from './primer';

export interface CartridgeSpec {
  id: string;
  name: string;
  standard: 'SAAMI' | 'CIP' | 'Wildcat';
  category?: string;
  max_pressure_bar: number;
  max_pressure_psi: number;
  case_length_in: number;
  coal_in: number;
  bullet_diameter_in: number;
  bore_diameter_in: number;
  groove_diameter_in: number;
  bore_area_sq_in: number;
  overflow_capacity_gr_h2o: number;
  default_barrel_length_in: number;
  rim_diameter_in?: number;
  base_diameter_in?: number;
  default_primer_pocket?: PrimerPocketSize;
  supported_primer_pockets?: PrimerPocketSize[];
  default_primer_id?: string;
  is_custom?: boolean;
}

