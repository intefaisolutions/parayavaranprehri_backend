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
  let personsService: any;
  let pendingActionsService: any;

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
            getPendingActionById: jest.fn(),
            markProcessing: jest.fn(),
            markCompleted: jest.fn(),
            markCancelled: jest.fn(),
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
    personsService = module.get(PersonsService);
    pendingActionsService = module.get(PendingActionsService);
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
    pendingActionsService.createPendingAction.mockResolvedValue({ _id: 'pending-123' });
    mockAIToolCall(
      'request_tree_registration',
      '{"treeName":"Neem","city":"Indore","plantedDate":"2026-09-05"}',
      'Action staged — tap the Confirm button to proceed.',
    );

    const result = await service.processChatRequest(
      { message: 'Register a Neem tree' },
      { sub: 'USER-A', roles: [], permissions: [] },
    );

    expect(pendingActionsService.createPendingAction).toHaveBeenCalledWith(
      'USER-A',
      'default-session',
      'register_tree',
      { treeName: 'Neem', city: 'Indore', plantedDate: '2026-09-05' },
    );
    // Response must include pendingAction metadata for the frontend button
    expect(result.pendingAction).toBeDefined();
    expect(result.pendingAction?.type).toBe('register_tree');
  });

  it('confirmPendingAction: should build DTO securely from JWT + PersonsService (never from AI)', async () => {
    pendingActionsService.getPendingActionById.mockResolvedValue({
      _id: 'pending-123',
      actionType: 'register_tree',
      userId: 'USER-A',
      payload: { treeName: 'Neem', city: 'Indore', plantedDate: '2026-09-05' },
    });
    pendingActionsService.markProcessing.mockResolvedValue(true);
    personsService.resolvePersonForUser.mockResolvedValue({
      mobile: '9876543210',
      name: 'John Doe',
    });
    treesService.create.mockResolvedValue({ treeId: 'TREE-NEW' });

    const result = await service.confirmPendingAction('pending-123', {
      sub: 'USER-A',
      roles: [],
      permissions: [],
    });

    // Security: userId and mobile come ONLY from JWT/PersonsService
    expect(treesService.create).toHaveBeenCalled();
    const createDto = treesService.create.mock.calls[0][0];
    expect(createDto.userId).toBe('USER-A');
    expect(createDto.mobile).toBe('9876543210');
    expect(pendingActionsService.markProcessing).toHaveBeenCalledWith('pending-123');
    expect(pendingActionsService.markCompleted).toHaveBeenCalledWith('pending-123');
    expect(result.success).toBe(true);
  });

  it('confirmPendingAction: double-tap guard — rejects if action is already PROCESSING', async () => {
    pendingActionsService.getPendingActionById.mockResolvedValue({
      _id: 'pending-123',
      actionType: 'register_tree',
      userId: 'USER-A',
      payload: { treeName: 'Neem', city: 'Indore', plantedDate: '2026-09-05' },
    });
    // Atomic check returns false = another request already claimed PROCESSING
    pendingActionsService.markProcessing.mockResolvedValue(false);

    const result = await service.confirmPendingAction('pending-123', {
      sub: 'USER-A',
      roles: [],
      permissions: [],
    });

    expect(treesService.create).not.toHaveBeenCalled();
    expect(result.error).toContain('already being processed');
  });

  it('confirmPendingAction: returns error gracefully when no pending action exists', async () => {
    pendingActionsService.getPendingActionById.mockRejectedValue(new Error('Not found'));

    const result = await service.confirmPendingAction('nonexistent-id', {
      sub: 'USER-A',
      roles: [],
      permissions: [],
    });

    expect(treesService.create).not.toHaveBeenCalled();
    expect(result.error).toContain('No pending action found');
  });
});
