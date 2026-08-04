import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
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

type Boundary = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

type ConstituencyRow = {
  id: string;
  country?: string;
  state: string;
  district: string;
  name: string;
  boundary?: Boundary | null;
  assemblyNumber?: number;
};

type SeedFile = {
  countries?: Array<{ id?: string; name: string }>;
  states?: Array<{ id?: string; name: string; country?: string }>;
  districtsByState?: Record<string, string[]>;
  constituencies?: ConstituencyRow[];
};

/** Normalize AC names so Wikipedia list matches geography-master sample polygons. */
const NAME_ALIASES: Record<string, string> = {
  'dr. ambedkar nagar-mhow': 'dr. ambedkar nagar (mhow)',
  'dr. ambedkar nagar (mhow)': 'dr. ambedkar nagar (mhow)',
  mhow: 'dr. ambedkar nagar (mhow)',
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normName(value: string) {
  const n = value.toLowerCase().replace(/\s+/g, ' ').trim();
  return NAME_ALIASES[n] || n;
}

function constituencyKey(state: string, district: string, name: string) {
  return `${state.toLowerCase()}|${district.toLowerCase()}|${normName(name)}`;
}

@Injectable()
export class MasterGeographySeedService {
  private readonly logger = new Logger(MasterGeographySeedService.name);

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

  async seedFromFile(options: { reset?: boolean } = {}) {
    const data = this.readSeedFile();
    if (options.reset) {
      await Promise.all([
        this.countryModel.deleteMany({}),
        this.stateModel.deleteMany({}),
        this.districtModel.deleteMany({}),
        this.constituencyModel.deleteMany({}),
      ]);
      this.logger.warn('Cleared master geography collections');
    }

    // Countries
    const countries = data.countries?.length
      ? data.countries
      : [{ id: 'india', name: 'India' }];
    for (const c of countries) {
      await this.countryModel.updateOne(
        { name: c.name },
        {
          $set: {
            code: (c.id || slug(c.name)).toUpperCase(),
            name: c.name,
          },
        },
        { upsert: true },
      );
    }

    // States
    for (const s of data.states || []) {
      const country = s.country || 'India';
      const masterId = s.id || `st-${slug(s.name)}`;
      await this.stateModel.updateOne(
        { country, name: s.name },
        { $set: { masterId, name: s.name, country } },
        { upsert: true },
      );
    }

    // Districts (all India districts from districtsByState)
    for (const [state, districts] of Object.entries(
      data.districtsByState || {},
    )) {
      for (const district of districts) {
        const masterId = `dist-${slug(state)}-${slug(district)}`;
        await this.districtModel.updateOne(
          { country: 'India', state, name: district },
          {
            $set: {
              masterId,
              name: district,
              state,
              country: 'India',
            },
          },
          { upsert: true },
        );
      }
    }

    const constituencies = this.mergeConstituencies(data);
    // Drop stale MP ids (e.g. mp-indore-1) when re-seeding without full --reset
    await this.constituencyModel.deleteMany({
      state: 'Madhya Pradesh',
    });

    let withBoundary = 0;
    for (const row of constituencies) {
      const country = row.country || 'India';
      const hasBoundary = !!(row.boundary?.type && row.boundary?.coordinates);
      if (hasBoundary) withBoundary += 1;
      const $set: Record<string, unknown> = {
        masterId: row.id,
        name: row.name,
        country,
        state: row.state,
        district: row.district,
        assemblyNumber: row.assemblyNumber ?? null,
      };
      if (hasBoundary) $set.boundary = row.boundary;

      await this.constituencyModel.updateOne(
        { masterId: row.id },
        hasBoundary ? { $set } : { $set, $unset: { boundary: 1 } },
        { upsert: true },
      );
    }

    const summary = {
      countries: await this.countryModel.countDocuments(),
      states: await this.stateModel.countDocuments(),
      districts: await this.districtModel.countDocuments(),
      constituencies: await this.constituencyModel.countDocuments(),
      withBoundary,
    };
    this.logger.log(`Master geography seeded: ${JSON.stringify(summary)}`);
    return summary;
  }

  /**
   * Prefer full MP assembly list (230). Attach sample polygons from
   * geography-master.json when name+district matches. Keep non-MP rows from JSON.
   */
  private mergeConstituencies(data: SeedFile): ConstituencyRow[] {
    const fromMaster = data.constituencies || [];
    const mpList = this.readMpConstituencies();

    const boundaryByKey = new Map<string, Boundary>();
    for (const row of fromMaster) {
      if (row.boundary?.type && row.boundary?.coordinates) {
        boundaryByKey.set(
          constituencyKey(row.state, row.district, row.name),
          row.boundary,
        );
      }
    }

    const merged: ConstituencyRow[] = [];
    const seen = new Set<string>();

    for (const row of mpList) {
      const key = constituencyKey(row.state, row.district, row.name);
      const boundary = boundaryByKey.get(key) || row.boundary || null;
      merged.push({ ...row, boundary });
      seen.add(key);
    }

    for (const row of fromMaster) {
      if (row.state === 'Madhya Pradesh') continue; // covered by mp-constituencies.json
      const key = constituencyKey(row.state, row.district, row.name);
      if (seen.has(key)) continue;
      merged.push(row);
      seen.add(key);
    }

    this.logger.log(
      `Constituencies merge: mp=${mpList.length}, other=${merged.length - mpList.length}, total=${merged.length}`,
    );
    return merged;
  }

  private readJsonCandidates(relativeParts: string[]): string | null {
    const candidates = [
      join(__dirname, '..', ...relativeParts),
      join(process.cwd(), 'src', ...relativeParts),
      join(process.cwd(), 'dist', ...relativeParts),
    ];
    return candidates.find((p) => existsSync(p)) || null;
  }

  private readSeedFile(): SeedFile {
    const path = this.readJsonCandidates(['geo', 'data', 'geography-master.json']);
    if (!path) {
      this.logger.warn(
        'geography-master.json not found — seeding countries/extras only',
      );
      return { countries: [{ id: 'india', name: 'India' }], constituencies: [] };
    }
    this.logger.log(`Seeding from ${path}`);
    return JSON.parse(readFileSync(path, 'utf8')) as SeedFile;
  }

  private readMpConstituencies(): ConstituencyRow[] {
    const path = this.readJsonCandidates(['geo', 'data', 'mp-constituencies.json']);
    if (!path) {
      this.logger.warn('mp-constituencies.json not found — MP list skipped');
      return [];
    }
    this.logger.log(`Loading MP constituencies from ${path}`);
    return JSON.parse(readFileSync(path, 'utf8')) as ConstituencyRow[];
  }
}
