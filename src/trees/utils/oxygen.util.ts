/**
 * Estimated annual O₂ production (kg/year) from species, age, and size.
 * This is an engineering estimate for dashboards — not a lab measurement.
 *
 * Primary drivers: species productivity, age toward maturity, height / DBH.
 */

export interface OxygenCalcInput {
  species?: string;
  plantedDate?: Date | string | null;
  heightM?: number | null;
  dbhCm?: number | null;
  status?: string | null;
  asOf?: Date;
}

export interface OxygenCalcResult {
  treeAgeYears: number;
  annualOxygenProductionKg: number;
  speciesFactor: number;
}

interface SpeciesProfile {
  /** Relative canopy/biomass productivity vs Neem baseline (1.0). */
  factor: number;
  /** Years to approach mature O₂ output. */
  maturityYears: number;
  /** Mature reference annual O₂ (kg/year) at full size. */
  matureKgPerYear: number;
}

const SPECIES_PROFILES: Record<string, SpeciesProfile> = {
  neem: { factor: 1.0, maturityYears: 10, matureKgPerYear: 100 },
  peepal: { factor: 1.35, maturityYears: 15, matureKgPerYear: 135 },
  pipal: { factor: 1.35, maturityYears: 15, matureKgPerYear: 135 },
  banyan: { factor: 1.6, maturityYears: 20, matureKgPerYear: 160 },
  bargad: { factor: 1.6, maturityYears: 20, matureKgPerYear: 160 },
  mango: { factor: 1.1, maturityYears: 12, matureKgPerYear: 110 },
  aam: { factor: 1.1, maturityYears: 12, matureKgPerYear: 110 },
  gulmohar: { factor: 0.9, maturityYears: 8, matureKgPerYear: 90 },
  teak: { factor: 1.2, maturityYears: 15, matureKgPerYear: 120 },
  sagwan: { factor: 1.2, maturityYears: 15, matureKgPerYear: 120 },
  jamun: { factor: 1.05, maturityYears: 12, matureKgPerYear: 105 },
  amla: { factor: 0.85, maturityYears: 8, matureKgPerYear: 85 },
  babul: { factor: 0.8, maturityYears: 8, matureKgPerYear: 80 },
  sheesham: { factor: 1.15, maturityYears: 14, matureKgPerYear: 115 },
  shisham: { factor: 1.15, maturityYears: 14, matureKgPerYear: 115 },
  arjun: { factor: 1.1, maturityYears: 12, matureKgPerYear: 110 },
  kadamb: { factor: 1.0, maturityYears: 10, matureKgPerYear: 100 },
  bamboo: { factor: 0.75, maturityYears: 5, matureKgPerYear: 75 },
  default: { factor: 1.0, maturityYears: 10, matureKgPerYear: 95 },
};

function resolveSpecies(species?: string): SpeciesProfile & { key: string } {
  const key = (species || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!key) return { ...SPECIES_PROFILES.default, key: 'default' };

  for (const [name, profile] of Object.entries(SPECIES_PROFILES)) {
    if (name === 'default') continue;
    if (key === name || key.includes(name) || name.includes(key)) {
      return { ...profile, key: name };
    }
  }
  return { ...SPECIES_PROFILES.default, key: 'default' };
}

function ageInYears(plantedDate?: Date | string | null, asOf = new Date()): number {
  if (!plantedDate) return 0;
  const planted = plantedDate instanceof Date ? plantedDate : new Date(plantedDate);
  if (Number.isNaN(planted.getTime())) return 0;
  const ms = asOf.getTime() - planted.getTime();
  if (ms <= 0) return 0;
  const years = ms / (365.25 * 24 * 60 * 60 * 1000);
  return Math.round(years * 10) / 10;
}

function sizeFactor(heightM?: number | null, dbhCm?: number | null): number {
  let fromDbh: number | null = null;
  let fromHeight: number | null = null;

  if (dbhCm != null && Number.isFinite(dbhCm) && dbhCm > 0) {
    // ~40 cm DBH ≈ mature reference trunk
    fromDbh = Math.min(2.0, Math.max(0.25, 0.25 + (dbhCm / 40) * 0.75));
  }
  if (heightM != null && Number.isFinite(heightM) && heightM > 0) {
    // ~12 m height ≈ mature canopy reference
    fromHeight = Math.min(1.8, Math.max(0.25, 0.3 + (heightM / 12) * 0.7));
  }

  if (fromDbh != null && fromHeight != null) {
    return (fromDbh * 0.6 + fromHeight * 0.4);
  }
  if (fromDbh != null) return fromDbh;
  if (fromHeight != null) return fromHeight;
  // Unknown size — conservative mid-small estimate
  return 0.5;
}

export function computeTreeOxygen(input: OxygenCalcInput): OxygenCalcResult {
  const status = String(input.status || '').toUpperCase();
  const treeAgeYears = ageInYears(input.plantedDate, input.asOf ?? new Date());
  const profile = resolveSpecies(input.species);

  if (status === 'DEAD') {
    return {
      treeAgeYears,
      annualOxygenProductionKg: 0,
      speciesFactor: profile.factor,
    };
  }

  // Asymptotic age curve — young trees produce less, approach mature output
  const ageFactor =
    treeAgeYears <= 0
      ? 0.05
      : 1 - Math.exp(-treeAgeYears / (profile.maturityYears * 0.45));

  const size = sizeFactor(input.heightM, input.dbhCm);
  const damagedFactor = status === 'DAMAGED' ? 0.55 : 1;

  const kg =
    profile.matureKgPerYear * ageFactor * size * damagedFactor;

  return {
    treeAgeYears,
    annualOxygenProductionKg: Math.max(0, Math.round(kg)),
    speciesFactor: profile.factor,
  };
}
