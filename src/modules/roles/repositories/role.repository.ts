import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { SystemRole } from '../../../common/enums/role.enum';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Permission, PermissionDocument } from '../schemas/permission.schema';
import { Role, RoleDocument } from '../schemas/role.schema';

@Injectable()
export class PermissionRepository extends BaseRepository<PermissionDocument> {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {
    super(permissionModel);
  }

  async findByKeys(keys: string[]): Promise<PermissionDocument[]> {
    return this.permissionModel
      .find({ key: { $in: keys }, isDeleted: false, isActive: true })
      .exec();
  }

  async upsertByKey(
    key: string,
    resource: string,
    action: string,
    description?: string,
  ): Promise<PermissionDocument> {
    return this.permissionModel
      .findOneAndUpdate(
        { key },
        { key, resource, action, description, isActive: true, isDeleted: false },
        { upsert: true, new: true },
      )
      .exec();
  }
}

@Injectable()
export class RoleRepository extends BaseRepository<RoleDocument> {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {
    super(roleModel);
  }

  async findByName(name: SystemRole): Promise<RoleDocument | null> {
    return this.findOne({ name } as QueryFilter<RoleDocument>);
  }
}
