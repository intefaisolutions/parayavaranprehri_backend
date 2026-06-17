import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { Role, RoleSchema } from './schemas/role.schema';
import {
  PermissionRepository,
  RoleRepository,
} from './repositories/role.repository';
import { RolesController, PermissionsController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [RolesService, RoleRepository, PermissionRepository],
  exports: [RolesService, RoleRepository, PermissionRepository],
})
export class RolesModule {}
