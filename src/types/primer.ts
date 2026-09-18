export type PrimerPocketSize = 
  | 'small_rifle' 
  | 'large_rifle' 
  | 'small_pistol' 
  | 'large_pistol' 
  | 'shotshell_209' 
  | 'bmg_50';

export type PrimerCategory = 
  | 'standard' 
  | 'magnum' 
  | 'match_standard' 
  | 'match_magnum';

export interface PrimerSpec {
  id: string;
  name: string;
  manufacturer: string;
  pocket_size: PrimerPocketSize;
  category: PrimerCategory;
  is_magnum: boolean;
  brisance_rating: number;         // 1.0 = standard LR baseline (CCI 200 / Fed 210)
  initial_pressure_bar: number;    // nominal pre-ignition pressure impulse (18 - 80 bar)
  cup_thickness_in: number;        // cup thickness (0.017" pistol, 0.020" standard rifle, 0.025"+ magnum)
  gas_volume_cm3: number;          // gas volume produced at STP
  flash_temp_k: number;            // flame temperature (K)
  description: string;
}
