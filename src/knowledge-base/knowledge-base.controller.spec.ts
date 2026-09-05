import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseLanguage } from './schemas/knowledge-base.schema';

describe('KnowledgeBaseController', () => {
  let controller: KnowledgeBaseController;
  let service: KnowledgeBaseService;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeBaseController],
      providers: [
        {
          provide: KnowledgeBaseService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<KnowledgeBaseController>(KnowledgeBaseController);
    service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto = { question: 'Q', answer: 'A', category: 'C' };
    await controller.create(dto, { sub: 'user1', roles: [], permissions: [] });
    expect(service.create).toHaveBeenCalledWith(dto, 'user1');
  });
});
