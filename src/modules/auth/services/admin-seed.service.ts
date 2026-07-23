import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SystemRole } from '../../../common/enums/role.enum';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    const email = 'superadmin@paryavaran.com';
    const existing = await this.usersService.findByEmail(email);

    if (!existing) {
      await this.usersService.create({
        firstName: 'Super',
        lastName: 'Admin',
        email,
        phone: '6232759826', // Assigned the user's provided number
        password: 'SuperAdmin@123',
        role: SystemRole.SUPER_ADMIN,
        permissions: [],
        isActive: true,
      });

      this.logger.log(`Default super admin created: ${email}`);
      this.logger.warn('Change default password immediately in production!');
    }
  }
}
