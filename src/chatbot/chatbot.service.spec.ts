/**
 * ChatbotService Test Suite
 *
 * Covers:
 * A. Real OpenAI path — tree registration tool call, confirm, double-tap guard, cancel, not-found
 * B. Mock mode path  — no OpenAI call, no API key needed, identity cannot be spoofed,
 *                      tree registration creates real PENDING action, multi-step complaint flow
 */

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

// ── OpenAI mock (used in real-path tests) ─────────────────────────────────────
const mockOpenAI = {
  chat: { completions: { create: jest.fn() } },
};
jest.mock('openai', () => jest.fn().mockImplementation(() => mockOpenAI));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqr'),
}));

// ── Shared provider factory ───────────────────────────────────────────────────
function makeMocks() {
  return {
    knowledgeBaseService: { findAll: jest.fn().mockResolvedValue([]) },
    treesService: {
      findByUserId: jest.fn(),
      findByTreeId: jest.fn(),
      create: jest.fn(),
    },
    personsService: {
      getMyStats: jest.fn(),
      resolvePersonForUser: jest.fn(),
    },
    certificatesService: { findMine: jest.fn() },
    pendingActionsService: {
      createPendingAction: jest.fn(),
      getPendingAction: jest.fn(),
      getPendingActionById: jest.fn(),
      markProcessing: jest.fn(),
      markCompleted: jest.fn(),
      markCancelled: jest.fn(),
    },
    fieldIssuesService: { create: jest.fn() },
    chatHistoryService: {
      createSession: jest.fn().mockResolvedValue({ sessionId: 'default-session' }),
      validateAndGetSession: jest.fn().mockResolvedValue({ sessionId: 'default-session' }),
      saveMessage: jest.fn(),
      getBoundedHistory: jest.fn().mockResolvedValue([]),
    },
  };
}

async function buildModule(configOverrides: Record<string, string>, mocks: ReturnType<typeof makeMocks>) {
  const configGet = jest.fn((key: string) => configOverrides[key] ?? undefined);
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ChatbotService,
      { provide: ConfigService, useValue: { get: configGet } },
      { provide: KnowledgeBaseService, useValue: mocks.knowledgeBaseService },
      { provide: TreesService, useValue: mocks.treesService },
      { provide: PersonsService, useValue: mocks.personsService },
      { provide: CertificatesService, useValue: mocks.certificatesService },
      { provide: PendingActionsService, useValue: mocks.pendingActionsService },
      { provide: FieldIssuesService, useValue: mocks.fieldIssuesService },
      { provide: ChatHistoryService, useValue: mocks.chatHistoryService },
    ],
  }).compile();
  return module.get<ChatbotService>(ChatbotService);
}

// ── Helper: fake OpenAI tool-call response ────────────────────────────────────
function mockAIToolCall(toolName: string, args: string, finalMessage: string) {
  mockOpenAI.chat.completions.create
    .mockResolvedValueOnce({
      choices: [{
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{ id: 'call_1', type: 'function', function: { name: toolName, arguments: args } }],
        },
      }],
    })
    .mockResolvedValueOnce({
      choices: [{ message: { role: 'assistant', content: finalMessage } }],
    });
}

const REAL_USER: any = { sub: 'USER-A', roles: [], permissions: [] };

// ════════════════════════════════════════════════════════════════════════════════
// A. Real OpenAI path
// ════════════════════════════════════════════════════════════════════════════════
describe('ChatbotService — Real OpenAI path', () => {
  let service: ChatbotService;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mocks = makeMocks();
    // Real mode: OPENAI_API_KEY set, OPENAI_MOCK_MODE absent/false
    service = await buildModule({ OPENAI_API_KEY: 'sk-real-key', OPENAI_MOCK_MODE: 'false' }, mocks);
  });

  it('should call OpenAI and stage a real PENDING action for tree registration', async () => {
    mocks.pendingActionsService.createPendingAction.mockResolvedValue({ _id: 'pending-real' });
    mockAIToolCall(
      'request_tree_registration',
      '{"treeName":"Neem","city":"Indore","plantedDate":"2026-09-05"}',
      'Action staged — tap Confirm.',
    );

    const result = await service.processChatRequest(
      { message: 'Register a Neem tree' },
      REAL_USER,
    );

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    expect(mocks.pendingActionsService.createPendingAction).toHaveBeenCalledWith(
      'USER-A', 'default-session', 'register_tree',
      { treeName: 'Neem', city: 'Indore', plantedDate: '2026-09-05' },
    );
    expect(result.pendingAction?.type).toBe('register_tree');
  });

  it('confirmPendingAction: userId and mobile come from JWT + PersonsService, never from AI args', async () => {
    mocks.pendingActionsService.getPendingActionById.mockResolvedValue({
      _id: 'pending-123',
      actionType: 'register_tree',
      userId: 'USER-A',
      payload: { treeName: 'Neem', city: 'Indore', plantedDate: '2026-09-05' },
    });
    mocks.pendingActionsService.markProcessing.mockResolvedValue(true);
    mocks.personsService.resolvePersonForUser.mockResolvedValue({ mobile: '9876543210', name: 'John' });
    mocks.treesService.create.mockResolvedValue({ treeId: 'TREE-NEW' });

    const result = await service.confirmPendingAction('pending-123', REAL_USER);

    expect(mocks.treesService.create).toHaveBeenCalled();
    const dto = mocks.treesService.create.mock.calls[0][0];
    // SECURITY: these must come from JWT/PersonsService, not from AI tool args
    expect(dto.userId).toBe('USER-A');
    expect(dto.mobile).toBe('9876543210');
    expect(mocks.pendingActionsService.markProcessing).toHaveBeenCalledWith('pending-123');
    expect(mocks.pendingActionsService.markCompleted).toHaveBeenCalledWith('pending-123');
    expect(result.success).toBe(true);
  });

  it('confirmPendingAction: double-tap guard rejects if already PROCESSING', async () => {
    mocks.pendingActionsService.getPendingActionById.mockResolvedValue({
      _id: 'pending-123',
      actionType: 'register_tree',
      userId: 'USER-A',
      payload: { treeName: 'Neem', city: 'Indore', plantedDate: '2026-09-05' },
    });
    mocks.pendingActionsService.markProcessing.mockResolvedValue(false); // already claimed

    const result = await service.confirmPendingAction('pending-123', REAL_USER);

    expect(mocks.treesService.create).not.toHaveBeenCalled();
    expect(result.error).toContain('already being processed');
  });

  it('confirmPendingAction: returns error gracefully when no pending action found', async () => {
    mocks.pendingActionsService.getPendingActionById.mockRejectedValue(new Error('Not found'));

    const result = await service.confirmPendingAction('bad-id', REAL_USER);

    expect(mocks.treesService.create).not.toHaveBeenCalled();
    expect(result.error).toContain('No pending action found');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// B. Mock AI path
// ════════════════════════════════════════════════════════════════════════════════
describe('ChatbotService — Mock AI path (OPENAI_MOCK_MODE=true)', () => {
  let service: ChatbotService;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mocks = makeMocks();
    // Mock mode: no API key required
    service = await buildModule({ OPENAI_MOCK_MODE: 'true' }, mocks);
  });

  it('should NOT call OpenAI in mock mode', async () => {
    const result = await service.processChatRequest(
      { message: 'Hello' },
      REAL_USER,
    );
    expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    expect(result.message).toBeTruthy();
    expect(result.sessionId).toBeDefined();
  });

  it('should work without OPENAI_API_KEY in mock mode', async () => {
    // No API key in config — should not throw
    const noKeyService = await buildModule({ OPENAI_MOCK_MODE: 'true' /* no OPENAI_API_KEY */ }, mocks);
    const result = await noKeyService.processChatRequest(
      { message: 'Show my trees' },
      REAL_USER,
    );
    expect(result.message).toBeTruthy();
    expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
  });

  it('should call real TreesService.findByUserId when user asks for trees', async () => {
    mocks.treesService.findByUserId.mockResolvedValue([
      { treeId: 'TR-001', species: 'Neem', city: 'Indore', userId: 'USER-A' },
    ]);

    const result = await service.processChatRequest(
      { message: 'Show my trees' },
      REAL_USER,
    );

    expect(mocks.treesService.findByUserId).toHaveBeenCalledWith('USER-A');
    expect(result.message).toContain('Neem');
    expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
  });

  it('mock tree registration: multi-step dialog stages a REAL pending action', async () => {
    mocks.pendingActionsService.createPendingAction.mockResolvedValue({ _id: 'mock-pending-1' });

    // Step 1: user says they want to register
    const step1 = await service.processChatRequest(
      { message: 'I want to register a tree', sessionId: 'default-session' },
      REAL_USER,
    );
    expect(step1.message).toContain('Kaun sa tree');
    expect(mocks.pendingActionsService.createPendingAction).not.toHaveBeenCalled();

    // Step 2: provide tree name
    const step2 = await service.processChatRequest(
      { message: 'Neem', sessionId: 'default-session' },
      REAL_USER,
    );
    expect(step2.message).toContain('city');

    // Step 3: provide city
    const step3 = await service.processChatRequest(
      { message: 'Indore', sessionId: 'default-session' },
      REAL_USER,
    );
    expect(step3.message).toContain('Kab');

    // Step 4: provide date — triggers real pending action
    const step4 = await service.processChatRequest(
      { message: '2024-06-15', sessionId: 'default-session' },
      REAL_USER,
    );
    expect(mocks.pendingActionsService.createPendingAction).toHaveBeenCalledWith(
      'USER-A', 'default-session', 'register_tree',
      { treeName: 'Neem', city: 'Indore', plantedDate: '2024-06-15' },
    );
    expect(step4.pendingAction).toBeDefined();
    expect(step4.pendingAction.type).toBe('register_tree');
    expect(step4.pendingAction.id).toBe('mock-pending-1');
    expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
  });

  it('mock: user identity cannot be spoofed — userId always comes from JWT', async () => {
    mocks.pendingActionsService.createPendingAction.mockResolvedValue({ _id: 'mock-pending-2' });

    // Simulate attacker passing a different userId in the message
    // They initiate registration through the mock dialog
    await service.processChatRequest({ message: 'I want to register a tree', sessionId: 'default-session' }, REAL_USER);
    await service.processChatRequest({ message: 'Peepal', sessionId: 'default-session' }, REAL_USER);
    await service.processChatRequest({ message: 'Delhi', sessionId: 'default-session' }, REAL_USER);
    await service.processChatRequest({ message: '2024-01-01', sessionId: 'default-session' }, REAL_USER);

    // The pending action must always use the JWT userId, never anything from the message
    const [callUserId] = mocks.pendingActionsService.createPendingAction.mock.calls[0];
    expect(callUserId).toBe('USER-A'); // from JWT, not from message content
  });

  it('confirmPendingAction still executes real backend in mock mode', async () => {
    mocks.pendingActionsService.getPendingActionById.mockResolvedValue({
      _id: 'mock-pending-3',
      actionType: 'register_tree',
      userId: 'USER-A',
      payload: { treeName: 'Banyan', city: 'Bhopal', plantedDate: '2023-12-01' },
    });
    mocks.pendingActionsService.markProcessing.mockResolvedValue(true);
    mocks.personsService.resolvePersonForUser.mockResolvedValue({ mobile: '9999999999', name: 'Tester' });
    mocks.treesService.create.mockResolvedValue({ treeId: 'TREE-MOCK' });

    const result = await service.confirmPendingAction('mock-pending-3', REAL_USER);

    expect(mocks.treesService.create).toHaveBeenCalled();
    const dto = mocks.treesService.create.mock.calls[0][0];
    expect(dto.userId).toBe('USER-A'); // from JWT
    expect(dto.mobile).toBe('9999999999'); // from PersonsService
    expect(result.success).toBe(true);
    expect(result.treeId).toBe('TREE-MOCK');
  });

  it('cancelPendingAction marks action as CANCELLED in mock mode', async () => {
    mocks.pendingActionsService.getPendingActionById.mockResolvedValue({
      _id: 'mock-pending-4',
      actionType: 'register_tree',
      userId: 'USER-A',
    });
    mocks.pendingActionsService.markCancelled.mockResolvedValue(undefined);

    const result = await service.cancelPendingAction('mock-pending-4', REAL_USER);

    expect(mocks.pendingActionsService.markCancelled).toHaveBeenCalledWith('mock-pending-4');
    expect(result.success).toBe(true);
  });
});
