import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { ConfigService } from '@nestjs/config';
import { PlantationAssignmentsService } from './plantation-assignments.service';
import {
  PlantationRequest,
  PlantationRequestStatus,
} from './schemas/plantation-request.schema';
import {
  AssignmentStatus,
  AssignmentType,
  PlantationAssignment,
} from './schemas/plantation-assignment.schema';
import {
  TreeAvailability,
  TreeMaster,
} from '../tree-masters/schemas/tree-master.schema';
import { Vehicle } from '../modules/vehicles/schemas/vehicle.schema';
import { User } from '../modules/users/schemas/user.schema';
import { VehicleTreeRulesService } from '../vehicle-tree-rules/vehicle-tree-rules.service';
import { TreesService } from '../trees/trees.service';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQrCode'),
}));

describe('PlantationAssignmentsService', () => {
  let service: PlantationAssignmentsService;

  const mockUserAId = new Types.ObjectId().toString();
  const mockUserBId = new Types.ObjectId().toString();

  const userAJwt: JwtPayload = {
    sub: mockUserAId,
    email: 'userA@example.com',
    roles: [SystemRole.USER],
  };

  const userBJwt: JwtPayload = {
    sub: mockUserBId,
    email: 'userB@example.com',
    roles: [SystemRole.USER],
  };

  const adminJwt: JwtPayload = {
    sub: new Types.ObjectId().toString(),
    email: 'admin@example.com',
    roles: [SystemRole.ADMIN],
  };

  let mockRequestModel: any;
  let mockAssignmentModel: any;
  let mockTreeMasterModel: any;
  let mockVehicleModel: any;
  let mockUserModel: any;
  let mockVehicleTreeRulesService: any;
  let mockTreesService: any;
  let mockConfigService: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockRequestModel = jest.fn().mockImplementation(function (dto: any) {
      Object.assign(this, dto);
      this._id = this._id || new Types.ObjectId();
      this.save = jest.fn().mockResolvedValue(this);
      return this;
    });
    mockRequestModel.findOne = jest.fn();
    mockRequestModel.findById = jest.fn();
    mockRequestModel.find = jest.fn();
    mockRequestModel.countDocuments = jest.fn();

    mockAssignmentModel = jest.fn().mockImplementation(function (dto: any) {
      Object.assign(this, dto);
      this._id = this._id || new Types.ObjectId();
      this.save = jest.fn().mockResolvedValue(this);
      return this;
    });
    mockAssignmentModel.find = jest.fn();
    mockAssignmentModel.findById = jest.fn();
    mockAssignmentModel.countDocuments = jest.fn();

    mockTreeMasterModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    mockVehicleModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
    };

    mockVehicleTreeRulesService = {
      findByVehicleType: jest.fn(),
    };

    mockTreesService = {
      create: jest.fn(),
      findByTreeId: jest.fn(),
      update: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'PUBLIC_APP_URL') return 'https://paryavaranprahri.org';
        if (key === 'SUGGESTION_DEADLINE_HOURS') return 48;
        return null;
      }),
    };

    mockConnection = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 101 }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantationAssignmentsService,
        {
          provide: getModelToken(PlantationRequest.name),
          useValue: mockRequestModel,
        },
        {
          provide: getModelToken(PlantationAssignment.name),
          useValue: mockAssignmentModel,
        },
        {
          provide: getModelToken(TreeMaster.name),
          useValue: mockTreeMasterModel,
        },
        {
          provide: getModelToken(Vehicle.name),
          useValue: mockVehicleModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: VehicleTreeRulesService,
          useValue: mockVehicleTreeRulesService,
        },
        {
          provide: TreesService,
          useValue: mockTreesService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<PlantationAssignmentsService>(
      PlantationAssignmentsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 1. 2 Wheeler requiring 1 tree
  it('1. should create 1 tree slot requirement for 2 Wheeler based on dynamic Admin rule', async () => {
    mockRequestModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(mockUserAId),
        firstName: 'Aman',
        lastName: 'Sharma',
        phone: '9876543210',
      }),
    });
    mockVehicleModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        plate: 'DL01AB1234',
        vehicleType: '2-Wheeler',
        insuranceId: 'INS-2W-001',
      }),
    });
    mockVehicleTreeRulesService.findByVehicleType.mockResolvedValue({
      vehicleType: '2-Wheeler',
      treesRequired: 1,
      maxUserSuggestions: 1,
      isActive: true,
    });

    const createdDoc: any = {
      requestId: 'PR-0101',
      userId: new Types.ObjectId(mockUserAId),
      insuranceId: 'INS-2W-001',
      vehiclePlate: 'DL01AB1234',
      vehicleType: '2-Wheeler',
      requiredTreeCount: 1,
      suggestedTreeCount: 0,
      autoAssignedTreeCount: 0,
      maxUserSuggestions: 1,
      status: PlantationRequestStatus.PENDING,
      save: jest.fn().mockResolvedValue(this),
    };

    const result = await service.createRequest(
      { insuranceId: 'INS-2W-001' },
      userAJwt,
    );

    expect(result.request).toBeDefined();
    expect(result.request.requiredTreeCount).toBe(1);
    expect(result.request.vehicleType).toBe('2-Wheeler');
    expect(mockVehicleTreeRulesService.findByVehicleType).toHaveBeenCalledWith('2-Wheeler');
  });

  // 2. 4 Wheeler requiring 5 trees
  it('2. should create 5 tree slots requirement for 4 Wheeler based on dynamic Admin rule', async () => {
    mockRequestModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(mockUserAId),
        firstName: 'Aman',
        phone: '9876543210',
      }),
    });
    mockVehicleModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        plate: 'DL04CD5678',
        vehicleType: '4-Wheeler',
        insuranceId: 'INS-4W-005',
      }),
    });
    mockVehicleTreeRulesService.findByVehicleType.mockResolvedValue({
      vehicleType: '4-Wheeler',
      treesRequired: 5,
      maxUserSuggestions: 1,
      isActive: true,
    });

    const result = await service.createRequest(
      { insuranceId: 'INS-4W-005' },
      userAJwt,
    );

    expect(result.request.requiredTreeCount).toBe(5);
    expect(result.request.maxUserSuggestions).toBe(1);
  });

  // 3. User suggestion creates USER_SUGGESTED assignment
  it('3. should create USER_SUGGESTED assignment when user suggests an eligible species', async () => {
    const mockTreeMasterId = new Types.ObjectId();
    const mockRequestId = new Types.ObjectId();

    const mockRequest: any = {
      _id: mockRequestId,
      userId: new Types.ObjectId(mockUserAId),
      insuranceId: 'INS-1001',
      vehiclePlate: 'DL04CD5678',
      vehicleId: new Types.ObjectId(),
      requiredTreeCount: 5,
      suggestedTreeCount: 0,
      autoAssignedTreeCount: 0,
      maxUserSuggestions: 1,
      status: PlantationRequestStatus.PENDING,
      suggestionDeadline: new Date(Date.now() + 86400000),
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockRequestModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRequest) });
    mockAssignmentModel.countDocuments
      .mockResolvedValueOnce(0) // currentSuggestions
      .mockResolvedValueOnce(0); // totalAssigned

    mockTreeMasterModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: mockTreeMasterId,
        name: 'Neem',
        species: 'Azadirachta indica',
        availability: TreeAvailability.AVAILABLE,
        isActive: true,
      }),
    });

    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ firstName: 'Aman', lastName: 'Kumar' }),
    });

    const mockTreeId = new Types.ObjectId();
    mockTreesService.create.mockResolvedValue({
      _id: mockTreeId,
      treeId: 'TR-0001',
      treeName: 'Neem',
    });

    const result = await service.submitSuggestion(
      mockRequestId.toString(),
      { treeMasterId: mockTreeMasterId.toString() },
      userAJwt,
    );

    expect(result.assignment).toBeDefined();
    expect(result.assignment.assignmentType).toBe(AssignmentType.USER_SUGGESTED);
    expect(result.assignment.treeMasterName).toBe('Neem');
    expect(result.request.suggestedTreeCount).toBe(1);
    expect(result.request.status).toBe(PlantationRequestStatus.PARTIALLY_ASSIGNED);
  });

  // 4. Remaining trees become AUTO_ASSIGNED
  it('4. should auto-assign remaining 4 trees from active catalog for 4-Wheeler', async () => {
    const mockRequestId = new Types.ObjectId();
    const mockRequest: any = {
      _id: mockRequestId,
      userId: new Types.ObjectId(mockUserAId),
      insuranceId: 'INS-1001',
      vehiclePlate: 'DL04CD5678',
      vehicleId: new Types.ObjectId(),
      requiredTreeCount: 5,
      suggestedTreeCount: 1,
      autoAssignedTreeCount: 0,
      status: PlantationRequestStatus.PARTIALLY_ASSIGNED,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockRequestModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRequest) });

    // Existing 1 user-suggested assignment
    const existingAssignment = {
      assignmentId: 'PA-0001',
      plantationRequestId: mockRequestId,
      assignmentType: AssignmentType.USER_SUGGESTED,
    };
    mockAssignmentModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([existingAssignment]),
    });

    // 2 active species in catalog (Peepal, Banyan)
    mockTreeMasterModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), name: 'Peepal', availability: TreeAvailability.AVAILABLE },
          { _id: new Types.ObjectId(), name: 'Banyan', availability: TreeAvailability.AVAILABLE },
        ]),
      }),
    });

    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ firstName: 'Aman' }),
    });

    mockTreesService.create.mockImplementation((dto: any) =>
      Promise.resolve({ _id: new Types.ObjectId(), treeId: `TR-${Math.random()}`, treeName: dto.treeName }),
    );

    const result = await service.autoAssignRemaining(
      mockRequestId.toString(),
      userAJwt,
    );

    expect(result.assignments.length).toBe(5); // 1 existing + 4 new
    expect(result.request.autoAssignedTreeCount).toBe(4);
    expect(result.request.status).toBe(PlantationRequestStatus.ASSIGNED);
  });

  // 5. User cannot suggest more trees than allowed
  it('5. should reject suggestion when user has already reached maxUserSuggestions', async () => {
    const mockRequestId = new Types.ObjectId();
    const mockRequest: any = {
      _id: mockRequestId,
      userId: new Types.ObjectId(mockUserAId),
      requiredTreeCount: 5,
      suggestedTreeCount: 1,
      maxUserSuggestions: 1,
      status: PlantationRequestStatus.PARTIALLY_ASSIGNED,
      suggestionDeadline: new Date(Date.now() + 86400000),
    };

    mockRequestModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRequest) });
    mockAssignmentModel.countDocuments.mockResolvedValueOnce(1); // already 1 suggestion made

    await expect(
      service.submitSuggestion(
        mockRequestId.toString(),
        { treeMasterId: new Types.ObjectId().toString() },
        userAJwt,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // 6. User cannot access another user's assignment
  it('6. should reject access when User B tries to view or modify User A plantation request', async () => {
    const mockRequestId = new Types.ObjectId();
    const mockRequest: any = {
      _id: mockRequestId,
      userId: new Types.ObjectId(mockUserAId), // belongs to User A
      requiredTreeCount: 5,
      suggestionDeadline: new Date(Date.now() + 86400000),
    };

    mockRequestModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRequest) });

    // User B tries to submit suggestion for User A's request
    await expect(
      service.submitSuggestion(
        mockRequestId.toString(),
        { treeMasterId: new Types.ObjectId().toString() },
        userBJwt, // caller is User B
      ),
    ).rejects.toThrow(ForbiddenException);

    // User B tries to view User A's request
    await expect(
      service.findOne(mockRequestId.toString(), userBJwt),
    ).rejects.toThrow(ForbiddenException);
  });

  // 7. User cannot use another user's insuranceId
  it('7. should reject request initiation if insurance policy belongs to another user', async () => {
    mockRequestModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        userId: new Types.ObjectId(mockUserBId), // belongs to User B
        insuranceId: 'INS-OTHER-999',
      }),
    });

    // User A tries to claim User B's insuranceId
    await expect(
      service.createRequest({ insuranceId: 'INS-OTHER-999' }, userAJwt),
    ).rejects.toThrow(ForbiddenException);
  });

  // 8. User identity is derived from JWT
  it('8. should strictly derive user identity from authenticated JWT and not accept arbitrary userId', async () => {
    mockRequestModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(mockUserAId),
        firstName: 'Aman',
      }),
    });
    mockVehicleModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        plate: 'DL01XX9999',
        insuranceId: 'INS-USER-A',
      }),
    });
    mockVehicleTreeRulesService.findByVehicleType.mockResolvedValue({
      vehicleType: '4-Wheeler',
      treesRequired: 5,
      maxUserSuggestions: 1,
      isActive: true,
    });

    const result = await service.createRequest(
      { insuranceId: 'INS-USER-A' },
      userAJwt, // JWT user
    );

    // Ensure the saved request's userId is exactly mockUserAId from JWT
    expect(result.request.userId.toString()).toBe(mockUserAId);
  });

  // 9. Duplicate assignment requests are safely handled (Idempotency)
  it('9. should safely handle duplicate assignment requests idempotently without creating duplicate slots', async () => {
    const existingRequestId = new Types.ObjectId();
    const mockExistingRequest: any = {
      _id: existingRequestId,
      userId: new Types.ObjectId(mockUserAId),
      insuranceId: 'INS-DUPLICATE-CHECK',
      requiredTreeCount: 5,
      status: PlantationRequestStatus.PENDING,
    };

    mockRequestModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockExistingRequest),
    });
    mockAssignmentModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    const result = await service.createRequest(
      { insuranceId: 'INS-DUPLICATE-CHECK' },
      userAJwt,
    );

    // Returned the existing request without creating a duplicate
    expect(result.request._id).toEqual(existingRequestId);
    expect(result.request.insuranceId).toBe('INS-DUPLICATE-CHECK');
  });

  // 10. Insufficient tree availability returns a proper error
  it('10. should return a clear business error if catalog has no eligible active trees for auto-assignment', async () => {
    const mockRequestId = new Types.ObjectId();
    const mockRequest: any = {
      _id: mockRequestId,
      userId: new Types.ObjectId(mockUserAId),
      requiredTreeCount: 5,
      status: PlantationRequestStatus.PENDING,
    };

    mockRequestModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRequest) });
    mockAssignmentModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

    // Empty catalog / no trees available
    mockTreeMasterModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(
      service.autoAssignRemaining(mockRequestId.toString(), userAJwt),
    ).rejects.toThrow(BadRequestException);
  });

  // 11. Admin can view assignments
  it('11. should allow Admin to view assignments across all users with filters and pagination', async () => {
    const mockReq1: any = {
      _id: new Types.ObjectId(),
      requestId: 'PR-0001',
      userId: {
        _id: new Types.ObjectId(mockUserAId),
        firstName: 'Citizen',
        lastName: 'One',
        email: 'cit1@example.com',
      },
      insuranceId: 'INS-111',
      vehiclePlate: 'DL01AA1111',
      vehicleType: '4-Wheeler',
      requiredTreeCount: 5,
    };

    mockRequestModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockReq1]),
            }),
          }),
        }),
      }),
    });
    mockRequestModel.countDocuments.mockResolvedValue(1);
    mockAssignmentModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await service.findAllAdmin({ page: 1, limit: 10 });

    expect(result.data.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.data[0].user.name).toBe('Citizen One');
  });

  // 12. Inactive/invalid tree options cannot be assigned
  it('12. should reject user suggestion if tree is marked OUT_OF_STOCK or inactive', async () => {
    const mockRequestId = new Types.ObjectId();
    const mockRequest: any = {
      _id: mockRequestId,
      userId: new Types.ObjectId(mockUserAId),
      requiredTreeCount: 5,
      suggestedTreeCount: 0,
      maxUserSuggestions: 1,
      status: PlantationRequestStatus.PENDING,
      suggestionDeadline: new Date(Date.now() + 86400000),
    };

    mockRequestModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRequest) });
    mockAssignmentModel.countDocuments
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    // TreeMaster is OUT_OF_STOCK
    mockTreeMasterModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        name: 'Rare Species',
        availability: TreeAvailability.OUT_OF_STOCK,
        isActive: true,
      }),
    });

    await expect(
      service.submitSuggestion(
        mockRequestId.toString(),
        { treeMasterId: new Types.ObjectId().toString() },
        userAJwt,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // 13. Assignment status transitions work correctly
  it('13. should correctly transition assignment status (ASSIGNED -> PLANTED -> VERIFIED)', async () => {
    const mockAssignmentId = new Types.ObjectId();
    const mockTreeId = new Types.ObjectId();

    const mockAssignment: any = {
      _id: mockAssignmentId,
      status: AssignmentStatus.ASSIGNED,
      treeId: mockTreeId,
      plantedAt: null,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockAssignmentModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAssignment),
    });

    // 1. Transition to PLANTED
    const plantedResult = await service.updateAssignmentStatus(
      mockAssignmentId.toString(),
      { status: AssignmentStatus.PLANTED },
      adminJwt,
    );
    expect(plantedResult.status).toBe(AssignmentStatus.PLANTED);
    expect(plantedResult.plantedAt).toBeDefined();

    // 2. Transition to VERIFIED
    const verifiedResult = await service.updateAssignmentStatus(
      mockAssignmentId.toString(),
      { status: AssignmentStatus.VERIFIED },
      adminJwt,
    );
    expect(verifiedResult.status).toBe(AssignmentStatus.VERIFIED);
    expect(mockTreesService.update).toHaveBeenCalledWith(
      mockTreeId.toString(),
      expect.objectContaining({ verifiedAt: expect.any(Date) }),
    );
  });

  // 14. QR Generation
  it('14. should generate public tree QR without sensitive user data', async () => {
    const mockAssignmentId = new Types.ObjectId();
    const mockAssignment: any = {
      _id: mockAssignmentId,
      userId: new Types.ObjectId(mockUserAId),
      treeCode: 'TR-100234',
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockAssignmentModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAssignment),
      }),
      exec: jest.fn().mockResolvedValue(mockAssignment),
    });

    const qrResult = await service.generateTreeQr(
      mockAssignmentId.toString(),
      userAJwt,
    );

    expect(qrResult.publicUrl).toBe('https://paryavaranprahri.org/tree/TR-100234');
    expect(qrResult.qrDataUrl).toBe('data:image/png;base64,mockQrCode');
    expect(qrResult.publicUrl).not.toContain('user');
    expect(qrResult.publicUrl).not.toContain('9876543210');
  });
});
