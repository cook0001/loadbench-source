use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeBallisticsInput {
    pub cartridge_name: String,
    pub overflow_capacity_gr_h2o: f64,
    pub case_length_in: f64,
    pub coal_in: f64,
    pub bullet_diameter_in: f64,
    pub bore_area_sq_in: f64,
    pub max_pressure_bar: f64,
    pub barrel_length_in: f64,
    pub bullet_weight_gr: f64,
    pub seating_depth_in: f64,
    pub shot_start_pressure_bar: f64,
    pub charge_weight_gr: f64,
    pub propellant_ba: f64,
    pub propellant_qex_j_g: f64,
    pub propellant_force_j_g: f64,
    pub propellant_gamma: f64,
    pub propellant_covolume_cm3_g: f64,
    pub propellant_solid_density_g_cm3: f64,
    pub propellant_bulk_density_g_cm3: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeSimulationResult {
    pub max_pressure_bar: f64,
    pub max_pressure_psi: f64,
    pub muzzle_velocity_fps: f64,
    pub muzzle_velocity_mps: f64,
    pub muzzle_energy_ft_lbs: f64,
    pub muzzle_energy_joules: f64,
    pub barrel_time_ms: f64,
    pub propellant_burnt_pct: f64,
    pub loading_density_pct: f64,
    pub ballistic_efficiency_pct: f64,
    pub is_overpressure: bool,
}

pub fn solve_interior_ballistics(input: &NativeBallisticsInput) -> NativeSimulationResult {
    let barrel_len_m = (input.barrel_length_in * 25.4) / 1000.0;
    let bore_area_m2 = input.bore_area_sq_in * 0.00064516;
    let bullet_mass_kg = (input.bullet_weight_gr / 15.4323584) / 1000.0;
    let charge_mass_g = input.charge_weight_gr / 15.4323584;
    let charge_mass_kg = charge_mass_g / 1000.0;

    // Chamber volume
    let gross_case_vol_cm3 = input.overflow_capacity_gr_h2o * 0.06479891;
    let seating_depth_cm = input.seating_depth_in * 2.54;
    let bullet_radius_cm = (input.bullet_diameter_in * 2.54) / 2.0;
    let seated_bullet_vol_cm3 = PI * bullet_radius_cm.powi(2) * seating_depth_cm * 0.95;
    let usable_chamber_vol_cm3 = (gross_case_vol_cm3 - seated_bullet_vol_cm3).max(0.1);
    let usable_chamber_vol_m3 = usable_chamber_vol_cm3 * 1e-6;

    let powder_bulk_vol_cm3 = charge_mass_g / input.propellant_bulk_density_g_cm3;
    let loading_density_pct = (powder_bulk_vol_cm3 / usable_chamber_vol_cm3) * 100.0;

    let force_constant_j_kg = input.propellant_force_j_g * 1000.0;
    let gamma = input.propellant_gamma;
    let covolume_m3_kg = input.propellant_covolume_cm3_g * 1e-3;
    let solid_density_kg_m3 = input.propellant_solid_density_g_cm3 * 1000.0;
    let p0_pa = input.shot_start_pressure_bar * 1e5;

    let mut t = 0.0_f64;
    let mut x = 0.0_f64;
    let mut v = 0.0_f64;
    let mut z = 0.008_f64;
    let mut max_pressure_pa = 0.0_f64;
    let dt = 1.5e-6_f64;

    while x < barrel_len_m && t < 0.010 {
        let mass_burnt_kg = charge_mass_kg * z.min(1.0);
        let unburnt_solid_vol_m3 = (charge_mass_kg - mass_burnt_kg) / solid_density_kg_m3;
        let gas_covolume_m3 = mass_burnt_kg * covolume_m3_kg;
        let free_gas_vol_m3 = (usable_chamber_vol_m3 - unburnt_solid_vol_m3 - gas_covolume_m3 + bore_area_m2 * x).max(1e-7);

        let effective_mass_kg = bullet_mass_kg + (1.0 / 3.0) * mass_burnt_kg;
        let total_chem_energy_j = mass_burnt_kg * (force_constant_j_kg / (gamma - 1.0));
        let kinetic_energy_j = 0.5 * effective_mass_kg * v.powi(2);
        let heat_loss_j = 0.18 * kinetic_energy_j; // 18% barrel conduction and radial expansion loss
        let net_gas_energy_j = (total_chem_energy_j - kinetic_energy_j - heat_loss_j).max(10.0);

        let p_pa = ((gamma - 1.0) * net_gas_energy_j / free_gas_vol(free_gas_vol_m3)).max(1e5);
        if p_pa > max_pressure_pa {
            max_pressure_pa = p_pa;
        }

        let p_bar = p_pa / 1e5;
        if z < 1.0 {
            let burn_rate = input.propellant_ba * p_bar.max(1.0);
            z = (z + burn_rate * dt).min(1.0);
        }

        if p_pa >= p0_pa || x > 0.0 {
            // Shot start engraving friction (P0 * 0.5) tapering to bore land friction (~80 bar)
            let friction_pa = if x < 0.015 { p0_pa * 0.5 } else { 80e5 };
            let net_force_n = ((p_pa - friction_pa) * bore_area_m2).max(0.0);
            let accel = net_force_n / effective_mass_kg;
            v += accel * dt;
            x += v * dt;
        }

        t += dt;
    }

    let max_pressure_bar = max_pressure_pa / 1e5;
    let max_pressure_psi = max_pressure_bar * 14.50377;
    let muzzle_velocity_fps = v * 3.28084;
    let muzzle_energy_j = 0.5 * bullet_mass_kg * v.powi(2);
    let muzzle_energy_ft_lbs = muzzle_energy_j * 0.737562;
    let total_chemical_energy_j = charge_mass_kg * input.propellant_qex_j_g * 1000.0;
    let ballistic_efficiency_pct = if total_chemical_energy_j > 0.0 {
        (muzzle_energy_j / total_chemical_energy_j) * 100.0
    } else {
        0.0
    };

    NativeSimulationResult {
        max_pressure_bar,
        max_pressure_psi,
        muzzle_velocity_fps,
        muzzle_velocity_mps: v,
        muzzle_energy_ft_lbs,
        muzzle_energy_joules: muzzle_energy_j,
        barrel_time_ms: t * 1000.0,
        propellant_burnt_pct: z * 100.0,
        loading_density_pct,
        ballistic_efficiency_pct,
        is_overpressure: max_pressure_bar > input.max_pressure_bar,
    }
}

fn free_gas_vol(v: f64) -> f64 {
    v.max(1e-7)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_308_winchester_baseline_simulation() {
        let input = NativeBallisticsInput {
            cartridge_name: ".308 Winchester".into(),
            overflow_capacity_gr_h2o: 56.0,
            case_length_in: 2.015,
            coal_in: 2.800,
            bullet_diameter_in: 0.308,
            bore_area_sq_in: 0.0736,
            max_pressure_bar: 4150.0,
            barrel_length_in: 24.0,
            bullet_weight_gr: 168.0,
            seating_depth_in: 0.430,
            shot_start_pressure_bar: 250.0,
            charge_weight_gr: 42.5,
            propellant_ba: 0.540,
            propellant_qex_j_g: 3720.0,
            propellant_force_j_g: 1030.0,
            propellant_gamma: 1.238,
            propellant_covolume_cm3_g: 0.940,
            propellant_solid_density_g_cm3: 1.58,
            propellant_bulk_density_g_cm3: 0.930,
        };

        let res = solve_interior_ballistics(&input);

        assert!(res.max_pressure_bar > 3200.0 && res.max_pressure_bar < 4300.0,
            "Pmax out of expected bounds: {:.1} bar", res.max_pressure_bar);
        assert!(res.muzzle_velocity_fps > 2400.0 && res.muzzle_velocity_fps < 2850.0,
            "Muzzle velocity out of expected bounds: {:.1} fps", res.muzzle_velocity_fps);
        assert!(res.barrel_time_ms > 1.0 && res.barrel_time_ms < 1.6,
            "Barrel transit time out of expected bounds: {:.3} ms", res.barrel_time_ms);
        assert!(res.propellant_burnt_pct > 90.0,
            "Propellant burnt pct expected >90%, got {:.1}%", res.propellant_burnt_pct);
    }
}
