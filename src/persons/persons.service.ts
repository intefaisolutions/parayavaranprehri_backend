import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
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

interface InsuranceCheckResult {
  verified: boolean;
  vehiclesLinked: number;
}

@Injectable()
export class PersonsService {
  private readonly logger = new Logger(PersonsService.name);

  constructor(
    private readonly personRepository: PersonRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

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
   * Checks the (third-party) Insurance system's own DB for a vehicle
   * insurance policy matching this mobile number. Failures never block
   * person registration — they just leave insuranceVerified = false.
   */
  private async verifyInsurance(mobile: string): Promise<InsuranceCheckResult> {
    const insuranceApiUrl =
      process.env.INSURANCE_API_URL || 'http://localhost:5001';

    try {
      const response = await fetch(
        `${insuranceApiUrl}/api/integration/paryawaran/users/vehicles?mobile=${mobile}`,
      );
      if (!response.ok) {
        throw new Error(`Insurance API error: ${response.statusText}`);
      }
      const data = await response.json().catch(() => null);
      const vehicles = Array.isArray(data)
        ? data
        : Array.isArray(data?.vehicles)
          ? data.vehicles
          : Array.isArray(data?.data)
            ? data.data
            : [];
      return { verified: vehicles.length > 0, vehiclesLinked: vehicles.length };
    } catch (error) {
      this.logger.warn(
        `Insurance verification failed for mobile "${mobile}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { verified: false, vehiclesLinked: 0 };
    }
  }

  /**
   * Admin-created Person record.
   */
  async create(dto: CreatePersonDto): Promise<Person> {
    return this.createInternal(dto, PersonSource.ADMIN);
  }

  /**
   * App self-registration for a Person (the insured customer). Same
   * verification + always-Active status as the admin path — only the
   * `source` differs.
   */
  async selfRegister(dto: CreatePersonDto): Promise<Person> {
    return this.createInternal(dto, PersonSource.APP);
  }

  private async createInternal(
    dto: CreatePersonDto,
    source: PersonSource,
  ): Promise<Person> {
    const exists = await this.personRepository.existsByMobile(dto.mobile);
    if (exists) {
      throw new ConflictException(
        `A person with mobile "${dto.mobile}" already exists`,
      );
    }

    const [personId, insurance] = await Promise.all([
      this.generatePersonId(),
      this.verifyInsurance(dto.mobile),
    ]);

    return this.personRepository.create({
      ...dto,
      personId,
      source,
      // Registration is always Active — insurance verification only
      // informs vehiclesLinked/insuranceVerified, it never gates status.
      status: PersonStatus.ACTIVE,
      vehiclesLinked: insurance.vehiclesLinked,
      insuranceVerified: insurance.verified,
      insuranceCheckedAt: new Date(),
    } as Partial<PersonDocument>);
  }

  async findAll(query: PersonQueryDto): Promise<PaginatedResult<Person>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    return this.personRepository.findPaginated(options, baseFilter, [
      'name',
      'mobile',
      'personId',
      'email',
      'idProofNumber',
    ]);
  }

  async findOne(id: string): Promise<Person> {
    const entry = await this.personRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Person "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    await this.findOne(id);

    if (dto.mobile !== undefined) {
      const exists = await this.personRepository.existsByMobile(
        dto.mobile,
        id,
      );
      if (exists) {
        throw new ConflictException(
          'Another person already uses this mobile number',
        );
      }
    }

    const updated = await this.personRepository.updateById(
      id,
      dto as Partial<PersonDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Person "${id}" not found`);
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
