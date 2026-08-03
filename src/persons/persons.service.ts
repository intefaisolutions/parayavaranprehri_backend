import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { GlobalIdentityService } from '../common/services/global-identity.service';
import {
  normalizeEmail,
  normalizeMobile,
} from '../common/utils/identity.util';
import { PaginationUtil } from '../common/utils/pagination.util';
import {
  User,
  UserDocument,
} from '../modules/users/schemas/user.schema';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonQueryDto } from './dto/person-query.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonRepository } from './repositories/person.repository';
import {
  Person,
  PersonDocument,
  PersonSource,
  PersonStatus,
} from './schemas/person.schema';

export type PersonWithLogin = Person & {
  lastLoginAt?: Date | null;
};

interface InsuranceVehiclesResult {
  ok: boolean;
  vehicles: Record<string, unknown>[];
  verified: boolean;
  vehiclesLinked: number;
  insuredVehicles: number;
  uninsuredVehicles: number;
  hasActiveInsurance: boolean;
  message?: string;
}

interface AuditActor {
  userId?: string;
  label?: string;
}

@Injectable()
export class PersonsService implements OnModuleInit {
  private readonly logger = new Logger(PersonsService.name);

  constructor(
    private readonly personRepository: PersonRepository,
    private readonly globalIdentity: GlobalIdentityService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Replace legacy full unique indexes (mobile/email/personId) with
   * soft-delete-aware partial uniques so deleted persons can be re-added.
   */
  async onModuleInit() {
    try {
      const collection = this.connection.collection('persons');
      const indexes = await collection.indexes();
      for (const idx of indexes) {
        const name = idx.name as string | undefined;
        if (!name || name === '_id_') continue;
        const keys = Object.keys((idx.key as Record<string, unknown>) || {});
        const isIdentityUnique =
          idx.unique &&
          !idx.partialFilterExpression &&
          keys.length === 1 &&
          (keys[0] === 'mobile' ||
            keys[0] === 'email' ||
            keys[0] === 'personId');
        if (isIdentityUnique) {
          await collection.dropIndex(name);
          this.logger.log(`Dropped legacy unique index "${name}" on persons`);
        }
      }
    } catch (error) {
      this.logger.warn(
        `Could not migrate persons unique indexes: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private toPlain(person: Person | PersonDocument): Record<string, unknown> {
    if (person && typeof (person as PersonDocument).toObject === 'function') {
      return (person as PersonDocument).toObject() as unknown as Record<
        string,
        unknown
      >;
    }
    return { ...(person as unknown as Record<string, unknown>) };
  }

  /** Attach login User.lastLoginAt matched by mobile or email. */
  private async attachLastLogin(
    persons: Array<Person | PersonDocument>,
  ): Promise<PersonWithLogin[]> {
    if (persons.length === 0) return [];

    const mobiles = new Set<string>();
    const emails = new Set<string>();
    for (const p of persons) {
      const mobile = normalizeMobile(p.mobile);
      const email = normalizeEmail(p.email);
      if (mobile) mobiles.add(mobile);
      if (email) emails.add(email);
    }

    const or: Record<string, unknown>[] = [];
    if (mobiles.size > 0) or.push({ phone: { $in: [...mobiles] } });
    if (emails.size > 0) or.push({ email: { $in: [...emails] } });

    const users =
      or.length === 0
        ? []
        : await this.userModel
            .find({ isDeleted: false, $or: or })
            .select('phone email lastLoginAt')
            .lean()
            .exec();

    const byPhone = new Map<string, Date | undefined>();
    const byEmail = new Map<string, Date | undefined>();
    for (const u of users) {
      const phone = normalizeMobile(u.phone);
      const email = normalizeEmail(u.email);
      if (phone) byPhone.set(phone, u.lastLoginAt);
      if (email) byEmail.set(email, u.lastLoginAt);
    }

    return persons.map((person) => {
      const mobile = normalizeMobile(person.mobile);
      const email = normalizeEmail(person.email);
      const lastLoginAt =
        (mobile ? byPhone.get(mobile) : undefined) ??
        (email ? byEmail.get(email) : undefined) ??
        null;
      return {
        ...this.toPlain(person),
        lastLoginAt,
      } as PersonWithLogin;
    });
  }

  private async generatePersonId(): Promise<string> {
    const counterCollection = this.connection.collection('counters');
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'personId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `PR-${seq.toString().padStart(6, '0')}`;
  }

  /**
   * Live lookup against the insurance system by mobile. Used for registration
   * checks, list/detail refresh, and the admin person vehicles view.
   */
  private async fetchInsuranceVehicles(
    mobile: string,
  ): Promise<InsuranceVehiclesResult> {
    const insuranceApiUrl =
      process.env.INSURANCE_API_URL || 'http://localhost:5001';

    try {
      const response = await fetch(
        `${insuranceApiUrl}/api/integration/paryawaran/users/vehicles?mobile=${encodeURIComponent(mobile)}`,
      );
      if (!response.ok) {
        throw new Error(`Insurance API error: ${response.statusText}`);
      }
      const data = await response.json().catch(() => null);
      const vehicles = (
        Array.isArray(data)
          ? data
          : Array.isArray(data?.vehicles)
            ? data.vehicles
            : Array.isArray(data?.data)
              ? data.data
              : []
      ) as Record<string, unknown>[];

      // Prefer explicit summary from insurance API when present
      const hasActiveInsurance =
        typeof data?.hasActiveInsurance === 'boolean'
          ? data.hasActiveInsurance
          : vehicles.some(
              (v) =>
                v.isInsured === true ||
                String(v.policyStatus || '').toUpperCase() === 'ACTIVE',
            );

      const insuredVehicles =
        typeof data?.insuredVehicles === 'number'
          ? data.insuredVehicles
          : vehicles.filter((v) => {
              if (v.isInsured === true) return true;
              const status = String(v.policyStatus || '').toUpperCase();
              return (
                !!v.policyNumber ||
                status === 'ACTIVE' ||
                status === 'EXPIRED'
              );
            }).length;

      const uninsuredVehicles =
        typeof data?.uninsuredVehicles === 'number'
          ? data.uninsuredVehicles
          : Math.max(vehicles.length - insuredVehicles, 0);

      return {
        ok: true,
        vehicles,
        // Align with insurance API: "Insurance Available" = active policy
        verified: hasActiveInsurance,
        vehiclesLinked: insuredVehicles > 0 ? insuredVehicles : vehicles.length,
        insuredVehicles,
        uninsuredVehicles,
        hasActiveInsurance,
        message: typeof data?.message === 'string' ? data.message : undefined,
      };
    } catch (error) {
      this.logger.warn(
        `Insurance verification failed for mobile "${mobile}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        ok: false,
        vehicles: [],
        verified: false,
        vehiclesLinked: 0,
        insuredVehicles: 0,
        uninsuredVehicles: 0,
        hasActiveInsurance: false,
      };
    }
  }

  private async syncInsuranceFields(
    id: string,
    mobile: string,
  ): Promise<Person | null> {
    const insurance = await this.fetchInsuranceVehicles(mobile);
    if (!insurance.ok) return null;

    return this.personRepository.updateById(id, {
      vehiclesLinked: insurance.vehiclesLinked,
      insuranceVerified: insurance.verified,
      insuranceCheckedAt: new Date(),
    } as Partial<PersonDocument>);
  }

  private resolveActor(user?: JwtPayload | AuditActor): AuditActor {
    if (!user) return {};
    if ('sub' in user) {
      return {
        userId: user.sub,
        label: user.email || user.sub,
      };
    }
    return {
      userId: user.userId,
      label: user.label || user.userId,
    };
  }

  /**
   * Admin-created Person record.
   */
  async create(dto: CreatePersonDto, user?: JwtPayload): Promise<Person> {
    return this.createInternal(dto, PersonSource.ADMIN, this.resolveActor(user));
  }

  /**
   * App self-registration for a Person (the insured customer). Same
   * verification + always-Active status as the admin path — only the
   * `source` differs.
   */
  async selfRegister(
    dto: CreatePersonDto,
    actor?: JwtPayload | AuditActor,
  ): Promise<Person> {
    return this.createInternal(
      dto,
      PersonSource.APP,
      this.resolveActor(actor),
    );
  }

  private async createInternal(
    dto: CreatePersonDto,
    source: PersonSource,
    actor: AuditActor = {},
  ): Promise<Person> {
    const mobile = normalizeMobile(dto.mobile) ?? dto.mobile.trim();
    const email = normalizeEmail(dto.email);

    await this.globalIdentity.assertAvailable({
      as: 'person',
      mobile,
      email,
    });

    const [personId, insurance] = await Promise.all([
      this.generatePersonId(),
      this.fetchInsuranceVehicles(mobile),
    ]);

    const createdBy = actor.label || email || mobile;

    return this.personRepository.create({
      ...dto,
      mobile,
      email,
      personId,
      source,
      // Registration is always Active — insurance verification only
      // informs vehiclesLinked/insuranceVerified, it never gates status.
      status: PersonStatus.ACTIVE,
      vehiclesLinked: insurance.ok ? insurance.vehiclesLinked : 0,
      insuranceVerified: insurance.ok ? insurance.verified : false,
      insuranceCheckedAt: insurance.ok ? new Date() : null,
      createdBy,
      createdByUserId: actor.userId,
      updatedBy: createdBy,
      updatedByUserId: actor.userId,
    } as Partial<PersonDocument>);
  }

  async findAll(
    query: PersonQueryDto,
  ): Promise<PaginatedResult<PersonWithLogin>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    const result = await this.personRepository.findPaginated(
      options,
      baseFilter,
      ['name', 'mobile', 'personId', 'email', 'idProofNumber'],
    );

    // Refresh vehiclesLinked from live insurance API for the current page
    // so the admin list stays accurate (not stuck at create-time snapshot).
    const synced = await Promise.all(
      result.items.map(async (person) => {
        const id = String((person as PersonDocument)._id);
        const updated = await this.syncInsuranceFields(id, person.mobile);
        return updated ?? person;
      }),
    );

    const items = await this.attachLastLogin(synced);
    return { items, meta: result.meta };
  }

  async findOne(id: string): Promise<PersonWithLogin> {
    const entry = await this.personRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Person "${id}" not found`);
    }
    const updated = await this.syncInsuranceFields(id, entry.mobile);
    const [withLogin] = await this.attachLastLogin([updated ?? entry]);
    return withLogin;
  }

  async getVehicles(id: string): Promise<{
    personId: string;
    mobile: string;
    vehiclesLinked: number;
    insuranceVerified: boolean;
    insuredVehicles: number;
    uninsuredVehicles: number;
    hasActiveInsurance: boolean;
    message?: string;
    vehicles: Record<string, unknown>[];
  }> {
    const person = await this.personRepository.findById(id);
    if (!person) {
      throw new NotFoundException(`Person "${id}" not found`);
    }

    const insurance = await this.fetchInsuranceVehicles(person.mobile);
    if (insurance.ok) {
      await this.personRepository.updateById(id, {
        vehiclesLinked: insurance.vehiclesLinked,
        insuranceVerified: insurance.hasActiveInsurance,
        insuranceCheckedAt: new Date(),
      } as Partial<PersonDocument>);
    }

    return {
      personId: person.personId,
      mobile: person.mobile,
      vehiclesLinked: insurance.ok
        ? insurance.vehiclesLinked
        : person.vehiclesLinked,
      insuranceVerified: insurance.ok
        ? insurance.hasActiveInsurance
        : Boolean(person.insuranceVerified),
      insuredVehicles: insurance.insuredVehicles,
      uninsuredVehicles: insurance.uninsuredVehicles,
      hasActiveInsurance: insurance.hasActiveInsurance,
      message: insurance.message,
      vehicles: insurance.vehicles,
    };
  }

  /**
   * Flat list of insurance vehicles for every active person — used by
   * admin Vehicle Management (no manual vehicle CRUD).
   */
  async listLinkedVehicles(): Promise<
    Array<{
      id: string;
      personMongoId: string;
      personId: string;
      personName: string;
      mobile: string;
      email?: string;
      photo?: string;
      personStatus?: string;
      personSource?: string;
      registrationNumber: string;
      vehicleType?: string;
      vehicleModel?: string;
      isInsured: boolean;
      policyStatus: string;
      policyNumber?: string | null;
      policyStartDate?: string | null;
      policyEndDate?: string | null;
      hasActiveInsurance: boolean;
    }>
  > {
    const persons = await this.personRepository.findActiveForVehicles();
    const rows: Array<{
      id: string;
      personMongoId: string;
      personId: string;
      personName: string;
      mobile: string;
      email?: string;
      photo?: string;
      personStatus?: string;
      personSource?: string;
      registrationNumber: string;
      vehicleType?: string;
      vehicleModel?: string;
      isInsured: boolean;
      policyStatus: string;
      policyNumber?: string | null;
      policyStartDate?: string | null;
      policyEndDate?: string | null;
      hasActiveInsurance: boolean;
    }> = [];

    // Bound concurrency so insurance API is not flooded
    const concurrency = 5;
    for (let i = 0; i < persons.length; i += concurrency) {
      const chunk = persons.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(async (person) => {
          const personMongoId = String((person as PersonDocument)._id);
          const insurance = await this.fetchInsuranceVehicles(person.mobile);

          if (insurance.ok) {
            await this.personRepository.updateById(personMongoId, {
              vehiclesLinked: insurance.vehiclesLinked,
              insuranceVerified: insurance.hasActiveInsurance,
              insuranceCheckedAt: new Date(),
            } as Partial<PersonDocument>);
          }

          return insurance.vehicles.map((v, index) => {
            const status = String(v.policyStatus || 'NOT_INSURED').toUpperCase();
            const isInsured =
              v.isInsured === true ||
              status === 'ACTIVE' ||
              status === 'EXPIRED' ||
              !!v.policyNumber;
            const registrationNumber = String(
              v.registrationNumber || `UNKNOWN-${index}`,
            );

            return {
              id: `${personMongoId}:${registrationNumber}`,
              personMongoId,
              personId: person.personId,
              personName: person.name,
              mobile: person.mobile,
              email: person.email,
              photo: person.photo,
              personStatus: person.status,
              personSource: person.source,
              registrationNumber,
              vehicleType: v.vehicleType
                ? String(v.vehicleType)
                : undefined,
              vehicleModel: v.vehicleModel
                ? String(v.vehicleModel)
                : undefined,
              isInsured,
              policyStatus: status,
              policyNumber: (v.policyNumber as string | null) ?? null,
              policyStartDate: v.policyStartDate
                ? String(v.policyStartDate)
                : null,
              policyEndDate: v.policyEndDate
                ? String(v.policyEndDate)
                : null,
              hasActiveInsurance: insurance.hasActiveInsurance,
            };
          });
        }),
      );

      for (const list of chunkResults) {
        rows.push(...list);
      }
    }

    return rows;
  }

  async findByMobile(mobile: string): Promise<Person | null> {
    const normalized = normalizeMobile(mobile) ?? mobile;
    return this.personRepository.findByMobile(normalized);
  }

  async update(
    id: string,
    dto: UpdatePersonDto,
    user?: JwtPayload,
  ): Promise<Person> {
    const existing = await this.findOne(id);

    const patch: Partial<PersonDocument> = { ...dto } as Partial<PersonDocument>;
    const actor = this.resolveActor(user);

    const nextMobile =
      dto.mobile !== undefined
        ? normalizeMobile(dto.mobile) ?? dto.mobile.trim()
        : normalizeMobile(existing.mobile) ?? existing.mobile;
    const nextEmail =
      dto.email !== undefined
        ? normalizeEmail(dto.email)
        : normalizeEmail(existing.email);

    if (dto.mobile !== undefined) {
      patch.mobile = nextMobile;
    }
    if (dto.email !== undefined) {
      patch.email = nextEmail;
    }

    if (dto.mobile !== undefined || dto.email !== undefined) {
      await this.globalIdentity.assertAvailable({
        as: 'person',
        mobile: nextMobile,
        email: nextEmail,
        exclude: { personId: id },
      });
    }

    if (actor.label) {
      patch.updatedBy = actor.label;
      patch.updatedByUserId = actor.userId;
    }

    const updated = await this.personRepository.updateById(id, patch);
    if (!updated) {
      throw new NotFoundException(`Person "${id}" not found`);
    }

    if (dto.mobile !== undefined) {
      const synced = await this.syncInsuranceFields(id, nextMobile);
      if (synced) return synced;
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.personRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Person "${id}" not found`);
    }
  }
}
