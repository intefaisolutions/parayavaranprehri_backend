import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonQueryDto } from './dto/person-query.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonRepository } from './repositories/person.repository';
import { Person, PersonDocument } from './schemas/person.schema';

@Injectable()
export class PersonsService {
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

  async create(dto: CreatePersonDto): Promise<Person> {
    const exists = await this.personRepository.existsByMobile(dto.mobile);
    if (exists) {
      throw new ConflictException(
        `A person with mobile "${dto.mobile}" already exists`,
      );
    }

    const personId = await this.generatePersonId();
    return this.personRepository.create({
      ...dto,
      personId,
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
