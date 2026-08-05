/** Approximate CO₂ sequestered (kg) from annual O₂ production (kg). */
export const OXYGEN_TO_CO2_FACTOR = 3.67;

export function oxygenToCo2Kg(oxygenKg: number): number {
  return Math.round(oxygenKg * OXYGEN_TO_CO2_FACTOR * 100) / 100;
}
