import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { RolesService } from '../roles/roles.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';
import { UserRepository } from './repositories/user.repository';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly saltRounds = 12;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly rolesService: RolesService,
  ) {}

  private sanitizeUser(user: UserDocument): Record<string, unknown> {
    const obj = user.toObject() as unknown as Record<string, unknown>;
    delete obj.password;
    return obj;
  }

  async create(dto: CreateUserDto): Promise<Record<string, unknown>> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const role = await this.rolesService.findByName(dto.role);
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, this.saltRounds)
      : undefined;

    const user = await this.userRepository.create({
      ...dto,
      password: passwordHash,
      roleId: role._id,
      permissions:
        dto.permissions.length > 0 ? dto.permissions : role.permissionKeys,
    } as Partial<UserDocument>);

    return this.sanitizeUser(user);
  }

  async findAll(query: UserQueryDto): Promise<PaginatedResult<Record<string, unknown>>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};

    if (query.role) baseFilter.role = query.role;
    if (query.isActive !== undefined) baseFilter.isActive = query.isActive;
    if (query.district) baseFilter.district = query.district;
    if (query.state) baseFilter.state = query.state;

    const result = await this.userRepository.findPaginated(
      options,
      baseFilter,
      ['firstName', 'lastName', 'email', 'phone'],
      ['roleId'],
    );

    return {
      items: result.items.map((u: UserDocument) => this.sanitizeUser(u)),
      meta: result.meta,
    };
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const user = await this.userRepository.findById(id, ['roleId']);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmailWithPassword(email);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Record<string, unknown>> {
    await this.findOne(id);

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.role) {
      const role = await this.rolesService.findByName(dto.role);
      updateData.roleId = role._id;
      if (!dto.permissions) {
        updateData.permissions = role.permissionKeys;
      }
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, this.saltRounds);
    }

    const updated = await this.userRepository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return this.sanitizeUser(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepository.softDelete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.updateById(id, { lastLoginAt: new Date() });
  }
}
