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
        password: 'SuperAdmin@123',
        role: SystemRole.SUPER_ADMIN,
        permissions: [],
        isActive: true,
      });

      this.logger.log(`Default super admin created: ${email}`);
      this.logger.warn('Change default password immediately in production!');
    }

    const customerEmail = 'rahul@paryavaran.com';
    const existingCustomer = await this.usersService.findByEmail(customerEmail);

    if (!existingCustomer) {
      await this.usersService.create({
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: customerEmail,
        phone: '9826012345',
        password: 'RahulPassword@123',
        role: SystemRole.CUSTOMER,
        permissions: [],
        isActive: true,
      });

      this.logger.log(`Default customer user created: ${customerEmail}`);
    }
  }
}
