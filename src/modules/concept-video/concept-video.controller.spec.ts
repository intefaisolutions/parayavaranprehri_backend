import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../common/enums/role.enum';
import { ConceptVideoController } from './concept-video.controller';
import { ConceptVideoService } from './concept-video.service';

describe('ConceptVideoController', () => {
  let controller: ConceptVideoController;
  let service: ConceptVideoService;
  let reflector: Reflector;

  const mockService = {
    get: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConceptVideoController],
      providers: [
        {
          provide: ConceptVideoService,
          useValue: mockService,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ConceptVideoController>(ConceptVideoController);
    service = module.get<ConceptVideoService>(ConceptVideoService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get', () => {
    it('should be marked with @Public()', () => {
      const isPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        controller.get,
      );
      expect(isPublic).toBe(true);
    });

    it('should call service.get()', async () => {
      const mockResult = { title: 'Test Video' } as any;
      mockService.get.mockResolvedValue(mockResult);

      const result = await controller.get();
      expect(service.get).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });
  });

  describe('updatePost & updatePatch', () => {
    it('should require SUPER_ADMIN or ADMIN role on updatePost', () => {
      const roles = reflector.get<SystemRole[]>(
        ROLES_KEY,
        controller.updatePost,
      );
      expect(roles).toEqual([SystemRole.SUPER_ADMIN, SystemRole.ADMIN]);
    });

    it('should require SUPER_ADMIN or ADMIN role on updatePatch', () => {
      const roles = reflector.get<SystemRole[]>(
        ROLES_KEY,
        controller.updatePatch,
      );
      expect(roles).toEqual([SystemRole.SUPER_ADMIN, SystemRole.ADMIN]);
    });

    it('should delegate updatePost to service.update()', async () => {
      const dto = { videoUrl: 'https://www.youtube.com/shorts/izBL1PXbOaD' };
      const mockUpdated = { ...dto, youtubeId: 'izBL1PXbOaD' } as any;
      mockService.update.mockResolvedValue(mockUpdated);

      const result = await controller.updatePost(dto);
      expect(service.update).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockUpdated);
    });

    it('should delegate updatePatch to service.update()', async () => {
      const dto = { title: 'New Title' };
      const mockUpdated = { ...dto } as any;
      mockService.update.mockResolvedValue(mockUpdated);

      const result = await controller.updatePatch(dto);
      expect(service.update).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockUpdated);
    });
  });
});
