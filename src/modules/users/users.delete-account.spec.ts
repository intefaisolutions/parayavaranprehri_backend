import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SystemRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('UsersController Account Deletion (Self & Admin)', () => {
  let usersController: UsersController;
  let mockUsersService: Partial<UsersService>;

  beforeEach(async () => {
    mockUsersService = {
      remove: jest.fn().mockImplementation(async (id: string) => {
        return { success: true, message: 'Account deleted successfully' };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
  });

  it('Case 1: Regular user deletes their own account -> Allowed', async () => {
    const userPayload: JwtPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      roles: [SystemRole.USER],
      permissions: [],
    };

    const result = await usersController.remove('user-123', userPayload);
    expect(result).toEqual({ success: true, message: 'Account deleted successfully' });
    expect(mockUsersService.remove).toHaveBeenCalledWith('user-123');
  });

  it('Case 2: Regular user attempts to delete someone else account -> ForbiddenException', async () => {
    const userPayload: JwtPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      roles: [SystemRole.USER],
      permissions: [],
    };

    expect(() =>
      usersController.remove('other-user-456', userPayload),
    ).toThrow(ForbiddenException);

    expect(mockUsersService.remove).not.toHaveBeenCalled();
  });

  it('Case 3: Admin deletes any user account -> Allowed', async () => {
    const adminPayload: JwtPayload = {
      sub: 'admin-999',
      email: 'admin@example.com',
      roles: [SystemRole.ADMIN],
      permissions: ['users:delete'],
    };

    const result = await usersController.remove('target-user-789', adminPayload);
    expect(result).toEqual({ success: true, message: 'Account deleted successfully' });
    expect(mockUsersService.remove).toHaveBeenCalledWith('target-user-789');
  });
});
