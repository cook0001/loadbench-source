use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolRecord {
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

pub fn parse_vol_line(line: &str) -> Option<VolRecord> {
    let clean = line.trim();
    if clean.is_empty() || clean.starts_with('#') || clean.starts_with(';') {
        return None;
    }

    let mut fields: Vec<String> = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;

    for c in clean.chars() {
        match c {
            '"' => in_quotes = !in_quotes,
            ',' if !in_quotes => {
                fields.push(current.trim().trim_matches('"').to_string());
                current.clear();
            }
            _ => current.push(c),
        }
    }
    fields.push(current.trim().trim_matches('"').to_string());

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

    Some(VolRecord {
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
    fn test_parse_vol_line() {
        let sample = "\"6.5 Creedmoor\",52.5,1.920,0.264,0.0543,0.264,4350,\"SAAMI\",2.800";
        let res = parse_vol_line(sample).expect("should parse");
        assert_eq!(res.name, "6.5 Creedmoor");
        assert_eq!(res.overflow_capacity_gr_h2o, 52.5);
    }
}
