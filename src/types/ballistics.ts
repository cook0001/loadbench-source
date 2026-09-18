export interface SimulationStep {
  time_ms: number;
  bullet_travel_in: number;
  bullet_travel_mm: number;
  bullet_velocity_fps: number;
  bullet_velocity_mps: number;
  chamber_pressure_psi: number;
  chamber_pressure_bar: number;
  propellant_burnt_pct: number;
  gas_temp_k: number;
  acceleration_g: number;
}

export type SafetyStatus = 'safe' | 'caution' | 'danger';

export interface SimulationResult {
  max_pressure_bar: number;
  max_pressure_psi: number;
  max_pressure_travel_in: number;
  max_pressure_travel_mm: number;
  max_pressure_time_ms: number;
  muzzle_velocity_fps: number;
  muzzle_velocity_mps: number;
  muzzle_energy_ft_lbs: number;
  muzzle_energy_joules: number;
  muzzle_pressure_bar: number;
  muzzle_pressure_psi: number;
  barrel_time_ms: number;
  propellant_burnt_pct: number;
  ballistic_efficiency_pct: number;
  loading_density_pct: number;
  pressure_status: SafetyStatus;
  pressure_margin_pct: number;
  steps: SimulationStep[];
}

export interface ChargeLadderStep {
  charge_grains: number;
  max_pressure_bar: number;
  max_pressure_psi: number;
  muzzle_velocity_fps: number;
  muzzle_velocity_mps: number;
  fill_ratio_pct: number;
  burn_pct: number;
  barrel_time_ms: number;
  status: SafetyStatus;
}

export interface OBTNode {
  node_number: number;
  target_time_ms: number;
  delta_ms: number;
  status: 'exact' | 'near' | 'off';
}

export interface PropellantRankingItem {
  propellant_id: string;
  propellant_name: string;
  manufacturer: string;
  max_velocity_fps: number;
  charge_at_pmax_grains: number;
  pressure_bar: number;
  fill_ratio_pct: number;
  burn_pct: number;
  barrel_time_ms: number;
  status: SafetyStatus;
}
