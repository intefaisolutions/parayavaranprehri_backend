import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatHistoryService } from './chat-history.service';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let service: any;

  beforeEach(async () => {
    const mockService = {
      processChatRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [
        {
          provide: ChatbotService,
          useValue: {
            processChatRequest: jest.fn(),
          },
        },
        {
          provide: ChatHistoryService,
          useValue: {
            getSessionsByUser: jest.fn(),
            getSessionHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatbotController>(ChatbotController);
    service = module.get(ChatbotService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process chat request successfully', async () => {
    service.processChatRequest.mockResolvedValue({ message: 'Hello!' });

    const result = await controller.handleChat(
      { message: 'Hi' },
      { sub: 'user1', roles: [], permissions: [] },
    );

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Hello!');
    expect(service.processChatRequest).toHaveBeenCalledWith(
      { message: 'Hi' },
      { sub: 'user1', roles: [], permissions: [] },
    );
  });
});
