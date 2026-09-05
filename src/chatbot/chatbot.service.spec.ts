import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { PersonsService } from '../persons/persons.service';
import { TreesService } from '../trees/trees.service';
import { CertificatesService } from '../certificates/certificates.service';
import { PendingActionsService } from './pending-actions.service';
import { FieldIssuesService } from '../field-issues/field-issues.service';
import { ChatHistoryService } from './chat-history.service';
import { ChatbotService } from './chatbot.service';

const mockOpenAI = {
  chat: { completions: { create: jest.fn() } },
};

jest.mock('openai', () => jest.fn().mockImplementation(() => mockOpenAI));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqr'),
}));

describe('ChatbotService', () => {
  let service: ChatbotService;
  let treesService: any;
  let certificatesService: any;
  let personsService: any;
  let pendingActionsService: any;
  let fieldIssuesService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('dummy') } },
        { provide: KnowledgeBaseService, useValue: { findAll: jest.fn() } },
        {
          provide: TreesService,
          useValue: {
            findByUserId: jest.fn(),
            findByTreeId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: PersonsService,
          useValue: { getMyStats: jest.fn(), resolvePersonForUser: jest.fn() },
        },
        { provide: CertificatesService, useValue: { findMine: jest.fn() } },
        {
          provide: PendingActionsService,
          useValue: {
            createPendingAction: jest.fn(),
            getPendingAction: jest.fn(),
            markCompleted: jest.fn(),
          },
        },
        { provide: FieldIssuesService, useValue: { create: jest.fn() } },
        {
          provide: ChatHistoryService,
          useValue: {
            createSession: jest.fn().mockResolvedValue({ sessionId: 'default-session' }),
            validateAndGetSession: jest.fn().mockResolvedValue({ sessionId: 'default-session' }),
            saveMessage: jest.fn(),
            getBoundedHistory: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    treesService = module.get(TreesService);
    certificatesService = module.get(CertificatesService);
    personsService = module.get(PersonsService);
    pendingActionsService = module.get(PendingActionsService);
    fieldIssuesService = module.get(FieldIssuesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockAIToolCall = (toolName: string, args: string, finalMessage: string) => {
    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{ id: 'call_1', type: 'function', function: { name: toolName, arguments: args } }],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { role: 'assistant', content: finalMessage } }],
      });
  };

  it('should use request_tree_registration and save pending action', async () => {
    mockAIToolCall('request_tree_registration', '{"treeName":"Neem","city":"Indore","plantedDate":"2026-09-05"}', 'Please confirm.');
    
    await service.processChatRequest({ message: 'Register a Neem tree' }, { sub: 'USER-A', roles: [], permissions: [] });

    expect(pendingActionsService.createPendingAction).toHaveBeenCalledWith(
      'USER-A',
      'default-session',
      'register_tree',
      { treeName: 'Neem', city: 'Indore', plantedDate: '2026-09-05' }
    );
  });

  it('should execute confirm_action and build DTO payload securely', async () => {
    mockAIToolCall('confirm_action', '{"actionType":"register_tree"}', 'Tree registered!');
    
    pendingActionsService.getPendingAction.mockResolvedValue({
      _id: 'pending-123',
      userId: 'USER-A',
      payload: { treeName: 'Neem', city: 'Indore' },
    });

    personsService.resolvePersonForUser.mockResolvedValue({
      mobile: '9876543210',
      name: 'John Doe',
    });

    treesService.create.mockResolvedValue({ treeId: 'TREE-NEW' });

    await service.processChatRequest({ message: 'Yes confirm' }, { sub: 'USER-A', roles: [], permissions: [] });

    expect(pendingActionsService.getPendingAction).toHaveBeenCalledWith('USER-A', 'default-session', 'register_tree');
    expect(treesService.create).toHaveBeenCalled();
    const createDto = treesService.create.mock.calls[0][0];
    expect(createDto.userId).toBe('USER-A'); // Crucial security check!
    expect(createDto.mobile).toBe('9876543210');
    expect(pendingActionsService.markCompleted).toHaveBeenCalledWith('pending-123');
  });

  it('should gracefully handle confirmation when no pending action exists', async () => {
    mockAIToolCall('confirm_action', '{"actionType":"register_tree"}', 'No pending action found.');
    pendingActionsService.getPendingAction.mockRejectedValue(new Error('Not found'));

    await service.processChatRequest({ message: 'Yes' }, { sub: 'USER-A', roles: [], permissions: [] });

    expect(treesService.create).not.toHaveBeenCalled();
    const openAICalls = mockOpenAI.chat.completions.create.mock.calls;
    const toolResultMessage = openAICalls[1][0].messages.find((m: any) => m.role === 'tool');
    expect(toolResultMessage.content).toContain('No pending action found');
  });
});
