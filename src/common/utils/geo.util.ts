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
