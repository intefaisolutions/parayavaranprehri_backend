import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  ALL_PERMISSIONS,
  PermissionAction,
  PermissionResource,
} from '../../common/enums/permission.enum';
import { SystemRole } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { ROLE_SEED_DATA } from './constants/role-seed.constant';
import {
  CreateRoleDto,
  RoleQueryDto,
  UpdateRoleDto,
} from './dto/role.dto';
import {
  PermissionRepository,
  RoleRepository,
} from './repositories/role.repository';
import { PermissionDocument } from './schemas/permission.schema';
import { RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedRoles();
  }

  private async seedPermissions() {
    for (const key of ALL_PERMISSIONS) {
      const [resource, action] = key.split(':') as [
        PermissionResource,
        PermissionAction,
      ];
      await this.permissionRepository.upsertByKey(
        key,
        resource,
        action,
        `${action} ${resource}`,
      );
    }
    this.logger.log(`Seeded ${ALL_PERMISSIONS.length} permissions`);
  }

  private async seedRoles() {
    for (const roleData of ROLE_SEED_DATA) {
      const existing = await this.roleRepository.findByName(roleData.name);
      const permissions = await this.permissionRepository.findByKeys(
        roleData.permissionKeys,
      );

      if (!existing) {
        await this.roleRepository.create({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          permissions: permissions.map((p: PermissionDocument) => p._id),
          permissionKeys: roleData.permissionKeys,
          isSystem: true,
          isActive: true,
        } as Partial<RoleDocument>);
      }
    }
    this.logger.log(`Seeded ${ROLE_SEED_DATA.length} system roles`);
  }

  async create(dto: CreateRoleDto): Promise<RoleDocument> {
    const existing = await this.roleRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }

    const permissions = await this.permissionRepository.findByKeys(
      dto.permissionKeys,
    );

    return this.roleRepository.create({
      ...dto,
      permissions: permissions.map((p: PermissionDocument) => p._id),
      isSystem: false,
    } as Partial<RoleDocument>);
  }

  async findAll(query: RoleQueryDto): Promise<PaginatedResult<RoleDocument>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      baseFilter.isActive = query.isActive;
    }

    return this.roleRepository.findPaginated(
      options,
      baseFilter,
      ['name', 'displayName', 'description'],
      ['permissions'],
    );
  }

  async findOne(id: string): Promise<RoleDocument> {
    const role = await this.roleRepository.findById(id, ['permissions']);
    if (!role) {
      throw new NotFoundException(`Role with id "${id}" not found`);
    }
    return role;
  }

  async findByName(name: SystemRole): Promise<RoleDocument> {
    const role = await this.roleRepository.findByName(name);
    if (!role) {
      throw new NotFoundException(`Role "${name}" not found`);
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleDocument> {
    const role = await this.findOne(id);

    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new ConflictException('Cannot change name of system role');
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.permissionKeys) {
      const permissions = await this.permissionRepository.findByKeys(
        dto.permissionKeys,
      );
      updateData.permissions = permissions.map((p: PermissionDocument) => p._id);
    }

    const updated = await this.roleRepository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Role with id "${id}" not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ConflictException('Cannot delete system role');
    }

    await this.roleRepository.softDelete(id);
  }

  async findAllPermissions(query: RoleQueryDto) {
    const options = PaginationUtil.parse(query);
    return this.permissionRepository.findPaginated(
      options,
      { isActive: true },
      ['key', 'resource', 'action', 'description'],
    );
  }
}
