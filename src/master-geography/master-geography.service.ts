import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MasterConstituency,
  MasterConstituencyDocument,
} from './schemas/master-constituency.schema';
import {
  MasterCountry,
  MasterCountryDocument,
} from './schemas/master-country.schema';
import {
  MasterDistrict,
  MasterDistrictDocument,
} from './schemas/master-district.schema';
import {
  MasterState,
  MasterStateDocument,
} from './schemas/master-state.schema';

@Injectable()
export class MasterGeographyService {
  constructor(
    @InjectModel(MasterCountry.name)
    private readonly countryModel: Model<MasterCountryDocument>,
    @InjectModel(MasterState.name)
    private readonly stateModel: Model<MasterStateDocument>,
    @InjectModel(MasterDistrict.name)
    private readonly districtModel: Model<MasterDistrictDocument>,
    @InjectModel(MasterConstituency.name)
    private readonly constituencyModel: Model<MasterConstituencyDocument>,
  ) {}

  listCountries() {
    return this.countryModel.find().sort({ name: 1 }).lean().exec();
  }

  listStates(country = 'India') {
    return this.stateModel
      .find({ country })
      .sort({ name: 1 })
      .select({ masterId: 1, name: 1, country: 1, _id: 0 })
      .lean()
      .exec()
      .then((rows) =>
        rows.map((r) => ({
          id: r.masterId,
          name: r.name,
          country: r.country,
        })),
      );
  }

  async listDistricts(state: string, country = 'India') {
    const rows = await this.districtModel
      .find({ country, state })
      .sort({ name: 1 })
      .select({ masterId: 1, name: 1, state: 1, country: 1, _id: 0 })
      .lean()
      .exec();

    if (!rows.length) {
      throw new NotFoundException(
        `No districts found for state "${state}" (country "${country}"). Run: pnpm run seed:master`,
      );
    }

    return rows.map((r) => ({
      id: r.masterId,
      name: r.name,
      state: r.state,
      country: r.country,
    }));
  }

  listConstituencies(filters: {
    country?: string;
    state?: string;
    district?: string;
  }) {
    const query: Record<string, string> = {};
    if (filters.country) query.country = filters.country;
    if (filters.state) query.state = filters.state;
    if (filters.district) query.district = filters.district;

    return this.constituencyModel
      .find(query)
      .sort({ name: 1 })
      .select({
        masterId: 1,
        name: 1,
        country: 1,
        state: 1,
        district: 1,
        boundary: 1,
        _id: 0,
      })
      .lean()
      .exec()
      .then((rows) =>
        rows.map((r) => ({
          id: r.masterId,
          name: r.name,
          country: r.country,
          state: r.state,
          district: r.district,
          hasBoundary: !!(r.boundary?.type && r.boundary?.coordinates),
        })),
      );
  }

  async findByMasterId(masterId: string) {
    return this.constituencyModel
      .findOne({ masterId: masterId.trim() })
      .lean()
      .exec();
  }

  async findByName(name: string, state?: string, district?: string) {
    const filter: Record<string, unknown> = {
      name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
    };
    if (state) filter.state = new RegExp(`^${escapeRegex(state)}$`, 'i');
    if (district) {
      filter.district = new RegExp(`^${escapeRegex(district)}$`, 'i');
    }
    return this.constituencyModel.findOne(filter).lean().exec();
  }

  async getBoundary(masterId: string) {
    const row = await this.findByMasterId(masterId);
    if (!row) {
      throw new NotFoundException(
        `Constituency "${masterId}" not found in master. Run seed:master or import ECI data.`,
      );
    }
    if (!row.boundary?.type || !row.boundary?.coordinates) {
      throw new NotFoundException(
        `Boundary not found for "${row.name}". Please draw the boundary manually.`,
      );
    }
    return {
      id: row.masterId,
      name: row.name,
      country: row.country,
      state: row.state,
      district: row.district,
      boundary: row.boundary,
      center: centerFromBoundary(row.boundary),
      message:
        'Loaded from MongoDB master_constituencies. Edit if needed, then save.',
    };
  }

  async counts() {
    const [countries, states, districts, constituencies] = await Promise.all([
      this.countryModel.countDocuments(),
      this.stateModel.countDocuments(),
      this.districtModel.countDocuments(),
      this.constituencyModel.countDocuments(),
    ]);
    return { countries, states, districts, constituencies };
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
