use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickLoadVolRecord {
    pub name: String,
    pub overflow_capacity_gr_h2o: f64,
    pub case_length_in: f64,
    pub bullet_diameter_in: f64,
    pub bore_area_sq_in: f64,
    pub groove_diameter_in: f64,
    pub max_pressure_bar: f64,
    pub standard: String,
    pub coal_in: f64,
}

pub fn parse_vol_line(line: &str) -> Option<QuickLoadVolRecord> {
    let clean = line.trim();
    if clean.is_empty() || clean.starts_with('#') || clean.starts_with(';') {
        return None;
    }

    let fields: Vec<&str> = clean
        .split("\",\"")
        .map(|f| f.trim_matches('"'))
        .collect();

    if fields.len() < 8 {
        return None;
    }

    let name = fields[0].to_string();
    let overflow_capacity_gr_h2o: f64 = fields[1].parse().unwrap_or(50.0);
    let case_length_in: f64 = fields[2].parse().unwrap_or(2.0);
    let bullet_diameter_in: f64 = fields[3].parse().unwrap_or(0.308);
    let bore_area_sq_in: f64 = fields[4].parse().unwrap_or(0.0736);
    let groove_diameter_in: f64 = fields[5].parse().unwrap_or(bullet_diameter_in);
    let max_pressure_bar: f64 = fields[6].parse().unwrap_or(4000.0);
    let standard = fields[7].to_string();
    let coal_in: f64 = if fields.len() > 8 {
        fields[8].parse().unwrap_or(case_length_in + 0.7)
    } else {
        case_length_in + 0.7
    };

    Some(QuickLoadVolRecord {
        name,
        overflow_capacity_gr_h2o,
        case_length_in,
        bullet_diameter_in,
        bore_area_sq_in,
        groove_diameter_in,
        max_pressure_bar,
        standard,
        coal_in,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_quickload_vol_line() {
        let line = "\"6.5 Creedmoor\",\"52.5\",\"1.920\",\"0.264\",\"0.0543\",\"0.264\",\"4350\",\"SAAMI\",\"2.825\",\"\",\"\",\"\",\"\",\"\",\"\"";
        let parsed = parse_vol_line(line).expect("Failed to parse vol line");

        assert_eq!(parsed.name, "6.5 Creedmoor");
        assert_eq!(parsed.overflow_capacity_gr_h2o, 52.5);
        assert_eq!(parsed.case_length_in, 1.920);
        assert_eq!(parsed.bullet_diameter_in, 0.264);
        assert_eq!(parsed.max_pressure_bar, 4350.0);
        assert_eq!(parsed.standard, "SAAMI");
        assert_eq!(parsed.coal_in, 2.825);
    }
}
