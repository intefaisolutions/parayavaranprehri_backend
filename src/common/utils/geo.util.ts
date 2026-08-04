/**
 * Normalize a ring of [lng, lat] pairs into a closed GeoJSON Polygon ring.
 */
export function toClosedRing(
  points: Array<[number, number]>,
): Array<[number, number]> {
  if (points.length < 3) {
    throw new Error('Polygon needs at least 3 points');
  }
  const ring = points.map(([lng, lat]) => [Number(lng), Number(lat)] as [
    number,
    number,
  ]);
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx !== lx || fy !== ly) {
    ring.push([fx, fy]);
  }
  return ring;
}

/** Build GeoJSON Polygon from a simple outer ring of [lng, lat]. */
export function buildPolygonFromRing(points: Array<[number, number]>) {
  return {
    type: 'Polygon' as const,
    coordinates: [toClosedRing(points)],
  };
}

/**
 * Accept either a full GeoJSON Polygon/MultiPolygon object, or a simple
 * array of [lng, lat] points for a single outer ring.
 */
export function normalizeBoundaryInput(input: unknown): {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
} | null {
  if (!input) return null;

  if (typeof input === 'string') {
    try {
      return normalizeBoundaryInput(JSON.parse(input));
    } catch {
      return null;
    }
  }

  if (Array.isArray(input)) {
    // [[lng,lat], ...] ring
    if (
      input.length >= 3 &&
      Array.isArray(input[0]) &&
      typeof input[0][0] === 'number'
    ) {
      return buildPolygonFromRing(input as Array<[number, number]>);
    }
    return null;
  }

  if (typeof input === 'object' && input !== null) {
    const obj = input as {
      type?: string;
      coordinates?: unknown;
    };
    if (
      (obj.type === 'Polygon' || obj.type === 'MultiPolygon') &&
      obj.coordinates
    ) {
      return {
        type: obj.type,
        coordinates: obj.coordinates as number[][][] | number[][][][],
      };
    }
  }

  return null;
}

export function buildPoint(longitude: number, latitude: number) {
  return {
    type: 'Point' as const,
    coordinates: [Number(longitude), Number(latitude)] as [number, number],
  };
}

const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two [lng, lat] points (km). */
function haversineKm(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Spherical polygon area for a closed ring of [lng, lat] (km²). */
function ringAreaKm2(ring: number[][]): number {
  if (!ring || ring.length < 3) return 0;
  let total = 0;
  const len = ring.length;
  for (let i = 0; i < len; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % len];
    total += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((total * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

function ringPerimeterKm(ring: number[][]): number {
  if (!ring || ring.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    total += haversineKm(
      [Number(ring[i][0]), Number(ring[i][1])],
      [Number(ring[i + 1][0]), Number(ring[i + 1][1])],
    );
  }
  return total;
}

export type BoundaryMetrics = {
  areaKm2: number;
  perimeterKm: number;
};

/**
 * Compute area (km²) and perimeter (km) from GeoJSON Polygon / MultiPolygon.
 * Outer rings only (holes ignored for area subtraction simplicity — fine for admin UX).
 */
export function computeBoundaryMetrics(
  boundary?: {
    type?: string;
    coordinates?: number[][][] | number[][][][];
  } | null,
): BoundaryMetrics | null {
  if (!boundary?.type || !boundary.coordinates) return null;

  let areaKm2 = 0;
  let perimeterKm = 0;

  if (boundary.type === 'Polygon') {
    const rings = boundary.coordinates as number[][][];
    const outer = rings[0];
    if (!outer) return null;
    areaKm2 = ringAreaKm2(outer);
    perimeterKm = ringPerimeterKm(outer);
  } else if (boundary.type === 'MultiPolygon') {
    const polys = boundary.coordinates as number[][][][];
    for (const poly of polys) {
      const outer = poly?.[0];
      if (!outer) continue;
      areaKm2 += ringAreaKm2(outer);
      perimeterKm += ringPerimeterKm(outer);
    }
  } else {
    return null;
  }

  if (!Number.isFinite(areaKm2) || areaKm2 <= 0) return null;

  return {
    areaKm2: Math.round(areaKm2 * 100) / 100,
    perimeterKm: Math.round(perimeterKm * 100) / 100,
  };
}

/** Acres → km² */
export function acresToKm2(acres: number): number {
  return Number(acres || 0) * 0.0040468564224;
}
