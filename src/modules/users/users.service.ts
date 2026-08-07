import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { GlobalIdentityService } from '../../common/services/global-identity.service';
import { PaginationUtil } from '../../common/utils/pagination.util';
import {
  normalizeEmail,
  normalizeMobile,
} from '../../common/utils/identity.util';
import { RolesService } from '../roles/roles.service';
import {
  CreateUserDto,
  UpdateMeDto,
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
    private readonly globalIdentity: GlobalIdentityService,
  ) {}

  private sanitizeUser(user: UserDocument): Record<string, unknown> {
    const obj = user.toObject() as unknown as Record<string, unknown>;
    delete obj.password;
    return obj;
  }

  async create(dto: CreateUserDto): Promise<Record<string, unknown>> {
    const email = normalizeEmail(dto.email)!;
    const phone = normalizeMobile(dto.phone);

    await this.globalIdentity.assertAvailable({
      as: 'user',
      email,
      mobile: phone,
    });

    const role = await this.rolesService.findByName(dto.role);
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, this.saltRounds)
      : undefined;

    const user = await this.userRepository.create({
      ...dto,
      email,
      phone,
      password: passwordHash,
      roleId: role._id,
      permissions:
        dto.permissions.length > 0 ? dto.permissions : role.permissionKeys,
    } as Partial<UserDocument>);

    return this.sanitizeUser(user);
  }

  async findAll(
    query: UserQueryDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
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
    const normalized = normalizeEmail(email) ?? email;
    return this.userRepository.findByEmail(normalized);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    const normalized = normalizeEmail(email) ?? email;
    return this.userRepository.findByEmailWithPassword(normalized);
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    const normalized = normalizeMobile(phone) ?? phone;
    return this.userRepository.findByPhone(normalized);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Record<string, unknown>> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const updateData: Record<string, unknown> = { ...dto };
    const nextPhone =
      dto.phone !== undefined
        ? normalizeMobile(dto.phone)
        : normalizeMobile(existing.phone);
    const nextEmail = normalizeEmail(existing.email);

    if (dto.phone !== undefined) {
      updateData.phone = nextPhone;
    }

    if (dto.phone !== undefined) {
      await this.globalIdentity.assertAvailable({
        as: 'user',
        mobile: nextPhone,
        email: nextEmail,
        exclude: { userId: id },
      });
    }

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

  async updateMe(
    id: string,
    dto: UpdateMeDto,
  ): Promise<Record<string, unknown>> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const updateData: Record<string, unknown> = { ...dto };
    const nextPhone =
      dto.phone !== undefined
        ? normalizeMobile(dto.phone)
        : normalizeMobile(existing.phone);
    const nextEmail =
      dto.email !== undefined
        ? normalizeEmail(dto.email)
        : normalizeEmail(existing.email);

    if (dto.email !== undefined) {
      if (!nextEmail) {
        throw new ConflictException('A valid email address is required');
      }
      updateData.email = nextEmail;
    }

    if (dto.phone !== undefined) {
      updateData.phone = nextPhone;
    }

    if (dto.email !== undefined || dto.phone !== undefined) {
      await this.globalIdentity.assertAvailable({
        as: 'user',
        mobile: nextPhone,
        email: nextEmail,
        exclude: { userId: id },
      });
    }

    if (dto.avatar === '') {
      updateData.avatar = undefined;
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

  async getUserVehicles(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    if (!user.phone) {
      throw new ConflictException('User does not have a phone number');
    }

    const insuranceApiUrl =
      process.env.INSURANCE_API_URL || 'http://localhost:5001';

    try {
      const response = await fetch(
        `${insuranceApiUrl}/api/integration/paryawaran/users/vehicles?mobile=${encodeURIComponent(user.phone)}`,
      );
      if (!response.ok) {
        return {
          success: false,
          count: 0,
          insuredVehicles: 0,
          uninsuredVehicles: 0,
          hasActiveInsurance: false,
          vehicles: [],
          message: 'Unable to fetch insurance vehicles',
        };
      }
      const data = await response.json().catch(() => null);
      if (Array.isArray(data)) {
        return {
          success: true,
          count: data.length,
          insuredVehicles: data.filter(
            (v: { isInsured?: boolean; policyStatus?: string }) =>
              v.isInsured ||
              String(v.policyStatus || '').toUpperCase() === 'ACTIVE',
          ).length,
          uninsuredVehicles: 0,
          hasActiveInsurance: data.some(
            (v: { isInsured?: boolean; policyStatus?: string }) =>
              v.isInsured ||
              String(v.policyStatus || '').toUpperCase() === 'ACTIVE',
          ),
          vehicles: data,
          message: 'Vehicles retrieved successfully',
        };
      }
      if (data && typeof data === 'object') {
        return {
          success: data.success !== false,
          user: data.user ?? null,
          count: data.count ?? (Array.isArray(data.vehicles) ? data.vehicles.length : 0),
          insuredVehicles: data.insuredVehicles ?? 0,
          uninsuredVehicles: data.uninsuredVehicles ?? 0,
          hasActiveInsurance: Boolean(data.hasActiveInsurance),
          vehicles: Array.isArray(data.vehicles)
            ? data.vehicles
            : Array.isArray(data.data)
              ? data.data
              : [],
          message: data.message || 'Vehicles retrieved successfully',
        };
      }
      return {
        success: true,
        count: 0,
        insuredVehicles: 0,
        uninsuredVehicles: 0,
        hasActiveInsurance: false,
        vehicles: [],
        message: 'No vehicles found',
      };
    } catch {
      // No insurance / API down → empty vehicle slots (not an error for the app)
      return {
        success: false,
        count: 0,
        insuredVehicles: 0,
        uninsuredVehicles: 0,
        hasActiveInsurance: false,
        vehicles: [],
        message: 'Insurance service unavailable',
      };
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.updateById(id, { lastLoginAt: new Date() });
  }
}
