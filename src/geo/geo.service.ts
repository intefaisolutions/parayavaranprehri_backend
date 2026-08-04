import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPoint } from '../common/utils/geo.util';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { BoundaryLookupDto } from './dto/boundary-lookup.dto';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';

export interface BoundaryLookupResult {
  name: string;
  state?: string;
  district?: string;
  source: 'database' | 'nominatim' | 'nominatim_bbox';
  center?: { lat: number; lng: number };
  boundary: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  message?: string;
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  country: string;
  state: string;
  district: string;
  tehsil: string;
  villageOrCity: string;
  pinCode: string;
  landAddress: string;
  landmark: string;
  vidhanSabha: string | null;
  vidhanSabhaId: string | null;
  rawDisplayName?: string;
  source: 'nominatim';
}

type NominatimAddress = {
  country?: string;
  state?: string;
  state_district?: string;
  county?: string;
  district?: string;
  municipality?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  taluk?: string;
  postcode?: string;
  road?: string;
  amenity?: string;
  leisure?: string;
  building?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
};

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(
    @InjectModel(VidhanSabha.name)
    private readonly vidhanSabhaModel: Model<VidhanSabhaDocument>,
  ) {}

  async reverse(dto: ReverseGeocodeDto): Promise<ReverseGeocodeResult> {
    const latitude = Number(dto.latitude);
    const longitude = Number(dto.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new BadRequestException('Valid latitude and longitude are required');
    }

    const osm = await this.fetchNominatim(latitude, longitude);
    const address = osm.address || {};

    const district =
      address.state_district ||
      address.county ||
      address.district ||
      address.city_district ||
      '';

    const tehsil =
      address.municipality ||
      address.taluk ||
      (address.county && address.county !== district ? address.county : '') ||
      '';

    const villageOrCity =
      address.village ||
      address.town ||
      address.city ||
      address.hamlet ||
      address.suburb ||
      address.neighbourhood ||
      '';

    const landmark =
      address.amenity || address.leisure || address.building || address.road || '';

    const vs = await this.resolveVidhanSabha(
      longitude,
      latitude,
      district || undefined,
    );

    return {
      latitude,
      longitude,
      country: address.country || 'India',
      state: address.state || '',
      district,
      tehsil,
      villageOrCity,
      pinCode: address.postcode || '',
      landAddress: osm.display_name || '',
      landmark,
      vidhanSabha: vs?.name ?? null,
      vidhanSabhaId: vs?.id ? String(vs.id) : null,
      rawDisplayName: osm.display_name,
      source: 'nominatim',
    };
  }

  private async fetchNominatim(
    latitude: number,
    longitude: number,
  ): Promise<NominatimResponse> {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');
    url.searchParams.set('accept-language', 'en');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ParyavaranPrahri/1.0 (admin reverse-geocode)',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Nominatim HTTP ${response.status}`);
        throw new ServiceUnavailableException(
          'Location lookup service is temporarily unavailable',
        );
      }

      const data = (await response.json()) as NominatimResponse;
      if (data.error) {
        throw new BadRequestException(
          `Could not resolve address for these coordinates: ${data.error}`,
        );
      }
      return data;
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      this.logger.error('Nominatim reverse geocode failed', err as Error);
      throw new ServiceUnavailableException(
        'Failed to reverse-geocode coordinates',
      );
    }
  }

  /**
   * Auto-load a constituency / place boundary:
   * 1) Existing Vidhan Sabha in DB with same name (+ district/state)
   * 2) Nominatim search with polygon_geojson
   * 3) Fallback: bounding-box rectangle as a simple Polygon
   */
  async lookupBoundary(dto: BoundaryLookupDto): Promise<BoundaryLookupResult> {
    const state = dto.state?.trim();
    const district = dto.district?.trim();
    const name = dto.name?.trim();

    if (!name && !district && !state) {
      throw new BadRequestException(
        'Provide at least state, district, or Vidhan Sabha name',
      );
    }

    // 1) Database match
    if (name) {
      const filter: Record<string, unknown> = {
        isDeleted: false,
        vidhanSabhaName: new RegExp(`^${escapeRegex(name)}$`, 'i'),
        boundary: { $exists: true, $ne: null },
      };
      if (district) filter.district = new RegExp(`^${escapeRegex(district)}$`, 'i');
      if (state) filter.state = new RegExp(`^${escapeRegex(state)}$`, 'i');

      const existing = await this.vidhanSabhaModel.findOne(filter as any).exec();
      if (existing?.boundary?.coordinates) {
        return {
          name: existing.vidhanSabhaName,
          state: existing.state,
          district: existing.district,
          source: 'database',
          boundary: existing.boundary,
          message: 'Loaded saved boundary from database',
        };
      }
    }

    // 2) Nominatim place search
    const queryParts = [name, district, state, dto.country || 'India'].filter(
      Boolean,
    );
    const query = queryParts.join(', ');
    const place = await this.searchNominatimPlace(query);

    if (!place) {
      throw new BadRequestException(
        `No boundary found for "${query}". Try Draw Polygon on the map.`,
      );
    }

    const center = {
      lat: Number(place.lat),
      lng: Number(place.lon),
    };

    if (
      place.geojson &&
      (place.geojson.type === 'Polygon' ||
        place.geojson.type === 'MultiPolygon') &&
      place.geojson.coordinates
    ) {
      return {
        name: place.display_name?.split(',')[0] || name || district || state || 'Place',
        state,
        district,
        source: 'nominatim',
        center,
        boundary: {
          type: place.geojson.type,
          coordinates: place.geojson.coordinates,
        },
        message:
          'Auto-loaded from OpenStreetMap. You can edit vertices, then save.',
      };
    }

    // 3) Bounding box → rectangle polygon (south, north, west, east)
    if (place.boundingbox?.length === 4) {
      const [south, north, west, east] = place.boundingbox.map(Number);
      const ring: number[][] = [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ];
      return {
        name: place.display_name?.split(',')[0] || name || district || state || 'Place',
        state,
        district,
        source: 'nominatim_bbox',
        center,
        boundary: { type: 'Polygon', coordinates: [ring] },
        message:
          'Approximate boundary from map bbox — please edit to match the real constituency.',
      };
    }

    throw new BadRequestException(
      `No usable boundary geometry for "${query}". Draw the polygon manually.`,
    );
  }

  private async searchNominatimPlace(query: string): Promise<{
    lat: string;
    lon: string;
    display_name?: string;
    boundingbox?: string[];
    geojson?: {
      type?: string;
      coordinates?: number[][][] | number[][][][];
    };
  } | null> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'in');
    url.searchParams.set('polygon_geojson', '1');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'en');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ParyavaranPrahri/1.0 (boundary-lookup)',
        },
      });
      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Boundary lookup service is temporarily unavailable',
        );
      }
      const rows = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name?: string;
        boundingbox?: string[];
        geojson?: {
          type?: string;
          coordinates?: number[][][] | number[][][][];
        };
      }>;
      return rows[0] || null;
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error('Nominatim place search failed', err as Error);
      throw new ServiceUnavailableException('Failed to look up place boundary');
    }
  }

  private async resolveVidhanSabha(
    longitude: number,
    latitude: number,
    district?: string,
  ): Promise<{ id: Types.ObjectId; name: string } | null> {
    const point = buildPoint(longitude, latitude);
    const geoFilter = {
      isDeleted: false,
      boundary: { $geoIntersects: { $geometry: point } },
    };

    let vs = district
      ? await this.vidhanSabhaModel
          .findOne({ ...geoFilter, district } as any)
          .exec()
      : null;

    if (!vs) {
      vs = await this.vidhanSabhaModel.findOne(geoFilter as any).exec();
    }
    if (!vs) return null;
    return { id: vs._id as Types.ObjectId, name: vs.vidhanSabhaName };
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
