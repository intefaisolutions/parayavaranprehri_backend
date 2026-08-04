import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPoint } from '../common/utils/geo.util';
import { MasterGeographyService } from '../master-geography/master-geography.service';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { BoundaryLookupDto } from './dto/boundary-lookup.dto';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';

type GeoBoundary = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

export interface BoundaryLookupResult {
  id?: string;
  name: string;
  state?: string;
  district?: string;
  source: 'database' | 'master';
  center?: { lat: number; lng: number };
  boundary: GeoBoundary;
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
    private readonly masterGeography: MasterGeographyService,
  ) {}

  async listCountries() {
    const rows = await this.masterGeography.listCountries();
    return rows.map((r) => ({ id: r.code.toLowerCase(), name: r.name }));
  }

  listStates(country?: string) {
    return this.masterGeography.listStates(country?.trim() || 'India');
  }

  listDistricts(state: string, country?: string) {
    return this.masterGeography.listDistricts(
      state,
      country?.trim() || 'India',
    );
  }

  listConstituencies(state?: string, district?: string, country?: string) {
    if (!district?.trim() && !state?.trim()) {
      throw new BadRequestException('Provide district (and optionally state)');
    }
    return this.masterGeography.listConstituencies({
      country: country?.trim() || 'India',
      state: state?.trim(),
      district: district?.trim(),
    });
  }

  getConstituencyBoundary(id: string) {
    return this.masterGeography.getBoundary(id);
  }

  async findConstituencyById(id: string) {
    const row = await this.masterGeography.findByMasterId(id);
    if (!row) return null;
    return {
      id: row.masterId,
      country: row.country,
      state: row.state,
      district: row.district,
      name: row.name,
      boundary: (row.boundary as GeoBoundary | null) || null,
    };
  }

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
   * Name-based boundary lookup (legacy). Prefer GET /constituencies/:id/boundary.
   */
  async lookupBoundary(dto: BoundaryLookupDto): Promise<BoundaryLookupResult> {
    const state = dto.state?.trim();
    const district = dto.district?.trim();
    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException(
        'Provide Vidhan Sabha name, or use /geo/constituencies/:id/boundary',
      );
    }

    const master = await this.masterGeography.findByName(name, state, district);
    if (master?.boundary?.type && master.boundary.coordinates) {
      return {
        id: master.masterId,
        name: master.name,
        state: master.state,
        district: master.district,
        source: 'master',
        center: centerFromBoundary(master.boundary as GeoBoundary),
        boundary: master.boundary as GeoBoundary,
        message:
          'Loaded from MongoDB master_constituencies. Edit if needed, then save.',
      };
    }

    const filter: Record<string, unknown> = {
      isDeleted: false,
      vidhanSabhaName: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      boundary: { $exists: true, $ne: null },
    };
    if (district) {
      filter.district = new RegExp(`^${escapeRegex(district)}$`, 'i');
    }
    if (state) {
      filter.state = new RegExp(`^${escapeRegex(state)}$`, 'i');
    }

    const existing = await this.vidhanSabhaModel.findOne(filter as any).exec();
    if (existing?.boundary?.coordinates) {
      return {
        name: existing.vidhanSabhaName,
        state: existing.state,
        district: existing.district,
        source: 'database',
        center: centerFromBoundary(existing.boundary as GeoBoundary),
        boundary: existing.boundary as GeoBoundary,
        message: 'Loaded saved boundary from database',
      };
    }

    const label = [name, district, state].filter(Boolean).join(', ');
    throw new NotFoundException(
      `Boundary not found for "${label}". Please draw the boundary manually on the map.`,
    );
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

function centerFromBoundary(boundary?: {
  type?: string;
  coordinates?: number[][][] | number[][][][];
}): { lat: number; lng: number } | undefined {
  if (!boundary?.coordinates) return undefined;
  try {
    let ring: number[][] | undefined;
    if (boundary.type === 'Polygon') {
      ring = (boundary.coordinates as number[][][])[0];
    } else if (boundary.type === 'MultiPolygon') {
      ring = (boundary.coordinates as number[][][][])[0]?.[0];
    }
    if (!ring?.length) return undefined;
    let lngSum = 0;
    let latSum = 0;
    let n = 0;
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      lngSum += Number(pt[0]);
      latSum += Number(pt[1]);
      n += 1;
    }
    if (!n) return undefined;
    return {
      lng: Math.round((lngSum / n) * 1e6) / 1e6,
      lat: Math.round((latSum / n) * 1e6) / 1e6,
    };
  } catch {
    return undefined;
  }
}
