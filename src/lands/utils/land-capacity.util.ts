/** Recommended trees per acre (typical ~10×10 ft spacing). */
export const TREES_PER_ACRE = 400;

export type AreaUnit = 'SQ_FT' | 'SQ_METER' | 'ACRE' | 'HECTARE';

const SQ_FT_PER_ACRE = 43560;
const SQ_M_PER_ACRE = 4046.8564224;
const ACRES_PER_HECTARE = 2.4710538147;

export function toAcres(totalArea: number, unit: AreaUnit): number {
  if (!Number.isFinite(totalArea) || totalArea <= 0) return 0;
  switch (unit) {
    case 'ACRE':
      return totalArea;
    case 'HECTARE':
      return totalArea * ACRES_PER_HECTARE;
    case 'SQ_FT':
      return totalArea / SQ_FT_PER_ACRE;
    case 'SQ_METER':
      return totalArea / SQ_M_PER_ACRE;
    default:
      return 0;
  }
}

export function recommendMaxTreeCapacity(
  totalArea: number,
  areaUnit: AreaUnit,
): number {
  const acres = toAcres(totalArea, areaUnit);
  return Math.max(0, Math.floor(acres * TREES_PER_ACRE));
}

export function computeAvailableCapacity(
  maxTreeCapacity: number,
  plantedTrees: number,
): number {
  return Math.max(0, (maxTreeCapacity || 0) - (plantedTrees || 0));
}

export type LandOccupancyStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_OCCUPIED'
  | 'FULLY_OCCUPIED'
  | 'UNDER_MAINTENANCE'
  | 'RESTRICTED';

/** Auto status from capacity — does not override Restricted / Under Maintenance. */
export function deriveLandStatus(
  current: LandOccupancyStatus | string | undefined,
  maxTreeCapacity: number,
  plantedTrees: number,
): LandOccupancyStatus {
  if (current === 'RESTRICTED' || current === 'UNDER_MAINTENANCE') {
    return current;
  }
  if (!maxTreeCapacity || plantedTrees <= 0) return 'AVAILABLE';
  if (plantedTrees >= maxTreeCapacity) return 'FULLY_OCCUPIED';
  return 'PARTIALLY_OCCUPIED';
}
