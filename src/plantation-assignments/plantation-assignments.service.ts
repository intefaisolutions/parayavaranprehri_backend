import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import * as QRCode from 'qrcode';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { oxygenToCo2Kg } from '../common/utils/carbon.util';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { Vehicle, VehicleDocument } from '../modules/vehicles/schemas/vehicle.schema';
import {
  TreeAvailability,
  TreeMaster,
  TreeMasterDocument,
} from '../tree-masters/schemas/tree-master.schema';
import { TreesService } from '../trees/trees.service';
import { VehicleTreeRulesService } from '../vehicle-tree-rules/vehicle-tree-rules.service';
import { CreatePlantationRequestDto } from './dto/create-plantation-request.dto';
import { PlantationAssignmentQueryDto } from './dto/plantation-assignment-query.dto';
import { SubmitTreeSuggestionDto } from './dto/submit-tree-suggestion.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import {
  AssignmentStatus,
  AssignmentType,
  PlantationAssignment,
  PlantationAssignmentDocument,
} from './schemas/plantation-assignment.schema';
import {
  PlantationRequest,
  PlantationRequestDocument,
  PlantationRequestStatus,
} from './schemas/plantation-request.schema';

@Injectable()
export class PlantationAssignmentsService {
  constructor(
    @InjectModel(PlantationRequest.name)
    private readonly requestModel: Model<PlantationRequestDocument>,
    @InjectModel(PlantationAssignment.name)
    private readonly assignmentModel: Model<PlantationAssignmentDocument>,
    @InjectModel(TreeMaster.name)
    private readonly treeMasterModel: Model<TreeMasterDocument>,
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly vehicleTreeRulesService: VehicleTreeRulesService,
    private readonly treesService: TreesService,
    private readonly configService: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async generateRequestId(): Promise<string> {
    const result = await this.connection
      .collection('counters')
      .findOneAndUpdate(
        { _id: 'plantationRequestId' as any },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true },
      );
    const seq = result?.seq || 1;
    return `PR-${seq.toString().padStart(4, '0')}`;
  }

  private async generateAssignmentId(): Promise<string> {
    const result = await this.connection
      .collection('counters')
      .findOneAndUpdate(
        { _id: 'plantationAssignmentId' as any },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true },
      );
    const seq = result?.seq || 1;
    return `PA-${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Initiates a plantation request for the authenticated user's verified insurance.
   */
  async createRequest(
    dto: CreatePlantationRequestDto,
    user: JwtPayload,
  ): Promise<{ request: PlantationRequest; assignments: PlantationAssignment[] }> {
    const userId = user.sub;
    const insuranceId = String(dto.insuranceId || '').trim().toUpperCase();

    if (!insuranceId) {
      throw new BadRequestException('Insurance ID / Policy Number is required');
    }

    // 1. Check idempotency / duplicate protection
    const existing = await this.requestModel
      .findOne({ insuranceId, isDeleted: false })
      .exec();

    if (existing) {
      if (existing.userId.toString() !== userId) {
        throw new ForbiddenException(
          'This insurance policy is already associated with another account',
        );
      }
      const existingAssignments = await this.assignmentModel
        .find({ plantationRequestId: existing._id, isDeleted: false })
        .exec();
      return { request: existing, assignments: existingAssignments };
    }

    // 2. Verify insurance belongs to the authenticated user
    const currentUser = await this.userModel.findById(userId).exec();
    if (!currentUser) {
      throw new NotFoundException('Authenticated user account not found');
    }

    let vehicle: VehicleDocument | null = null;
    if (dto.vehicleId) {
      vehicle = await this.vehicleModel
        .findOne({
          _id: dto.vehicleId,
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .exec();
      if (!vehicle) {
        throw new ForbiddenException(
          'Vehicle not found or does not belong to your account',
        );
      }
    } else {
      // Find vehicle by insuranceId or plate
      const query: Record<string, unknown> = {
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      };
      if (dto.vehiclePlate) {
        query.plate = String(dto.vehiclePlate).trim().toUpperCase();
      } else {
        query.insuranceId = insuranceId;
      }
      vehicle = await this.vehicleModel.findOne(query).exec();
    }

    // If vehicle found with an insuranceId, confirm match
    if (vehicle?.insuranceId && vehicle.insuranceId.toUpperCase() !== insuranceId) {
      throw new ForbiddenException(
        'The provided insurance ID does not match the insurance on this vehicle',
      );
    }

    const vehiclePlate =
      vehicle?.plate ||
      String(dto.vehiclePlate || 'VH-TEMP').trim().toUpperCase();

    const vehicleType =
      dto.vehicleType ||
      (vehicle as any)?.vehicleType ||
      (vehiclePlate.startsWith('2W') ? '2-Wheeler' : '4-Wheeler');

    // 3. Apply dynamic plantation rule from Admin
    const rule = await this.vehicleTreeRulesService.findByVehicleType(vehicleType);
    if (!rule) {
      throw new BadRequestException(
        `No dynamic plantation rule configured for vehicle type '${vehicleType}'. Please contact administrator.`,
      );
    }

    const requiredTreeCount = rule.treesRequired;
    const maxUserSuggestions = rule.maxUserSuggestions ?? 1;

    const deadlineHours =
      Number(this.configService.get<number>('SUGGESTION_DEADLINE_HOURS')) || 48;
    const suggestionDeadline = new Date(Date.now() + deadlineHours * 3600 * 1000);

    const requestId = await this.generateRequestId();

    const request = new this.requestModel({
      requestId,
      userId: new Types.ObjectId(userId),
      insuranceId,
      vehicleId: vehicle?._id ?? null,
      vehiclePlate,
      vehicleType: rule.vehicleType,
      requiredTreeCount,
      suggestedTreeCount: 0,
      autoAssignedTreeCount: 0,
      maxUserSuggestions,
      status:
        requiredTreeCount === 0
          ? PlantationRequestStatus.ASSIGNED
          : PlantationRequestStatus.PENDING,
      suggestionDeadline,
    });

    const savedRequest = await request.save();
    return { request: savedRequest, assignments: [] };
  }

  /**
   * Citizen suggests a preferred tree species from the catalog.
   */
  async submitSuggestion(
    requestId: string,
    dto: SubmitTreeSuggestionDto,
    user: JwtPayload,
  ): Promise<{ assignment: PlantationAssignment; request: PlantationRequest }> {
    const request = await this.requestModel.findById(requestId).exec();
    if (!request || request.isDeleted) {
      throw new NotFoundException(`Plantation request #${requestId} not found`);
    }

    // Security: Validate user ownership from JWT
    if (request.userId.toString() !== user.sub) {
      throw new ForbiddenException(
        'You can only submit suggestions for your own plantation requests',
      );
    }

    // Verify request is eligible for suggestions
    if (
      request.status === PlantationRequestStatus.ASSIGNED ||
      request.status === PlantationRequestStatus.COMPLETED ||
      request.status === PlantationRequestStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'All required trees for this request have already been assigned',
      );
    }

    // Verify deadline
    if (new Date() > new Date(request.suggestionDeadline)) {
      throw new BadRequestException(
        'The suggestion deadline for this plantation request has expired',
      );
    }

    // Verify suggestion slot limits
    const currentSuggestions = await this.assignmentModel.countDocuments({
      plantationRequestId: request._id,
      assignmentType: AssignmentType.USER_SUGGESTED,
      isDeleted: false,
    });

    if (currentSuggestions >= request.maxUserSuggestions) {
      throw new BadRequestException(
        `You have reached the maximum allowed tree suggestions (${request.maxUserSuggestions}) for this vehicle`,
      );
    }

    const totalAssigned = await this.assignmentModel.countDocuments({
      plantationRequestId: request._id,
      isDeleted: false,
    });

    if (totalAssigned >= request.requiredTreeCount) {
      throw new BadRequestException(
        'All required tree slots have already been assigned',
      );
    }

    // Validate tree species from TreeMaster catalog
    const treeMaster = await this.treeMasterModel
      .findOne({ _id: dto.treeMasterId, isDeleted: false, isActive: true })
      .exec();

    if (!treeMaster) {
      throw new BadRequestException('Selected tree species is invalid or inactive');
    }

    if (treeMaster.availability === TreeAvailability.OUT_OF_STOCK) {
      throw new BadRequestException(
        `Tree species '${treeMaster.name}' is currently out of stock`,
      );
    }

    // Resolve owner details
    const currentUser = await this.userModel.findById(user.sub).exec();
    const ownerName = currentUser
      ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ')
      : 'Citizen';

    // Create actual tree instance in trees collection
    const tree = await this.treesService.create({
      treeName: treeMaster.name,
      species: treeMaster.species || treeMaster.name,
      scientificName: treeMaster.scientificName || '',
      userId: user.sub,
      userName: ownerName,
      mobile: currentUser?.phone || '0000000000',
      vehicleNumber: request.vehiclePlate,
      policyNumber: request.insuranceId,
      insuranceStatus: 'ACTIVE',
      status: 'PLANTED',
      height: 1,
      remarks: 'Citizen suggested tree',
    } as any);

    // Create PlantationAssignment
    const assignmentId = await this.generateAssignmentId();
    const assignment = new this.assignmentModel({
      assignmentId,
      plantationRequestId: request._id,
      userId: request.userId,
      insuranceId: request.insuranceId,
      vehicleId: request.vehicleId,
      vehiclePlate: request.vehiclePlate,
      treeMasterId: treeMaster._id,
      treeMasterName: treeMaster.name,
      treeId: (tree as any)._id,
      treeCode: (tree as any).treeId,
      assignmentType: AssignmentType.USER_SUGGESTED,
      status: AssignmentStatus.ASSIGNED,
      assignedAt: new Date(),
    });

    const savedAssignment = await assignment.save();

    // Update PlantationRequest state
    request.suggestedTreeCount = currentSuggestions + 1;
    const newTotal = totalAssigned + 1;
    if (newTotal >= request.requiredTreeCount) {
      request.status = PlantationRequestStatus.ASSIGNED;
    } else {
      request.status = PlantationRequestStatus.PARTIALLY_ASSIGNED;
    }
    const savedRequest = await request.save();

    return { assignment: savedAssignment, request: savedRequest };
  }

  /**
   * Automatically assigns the remaining trees from the active TreeMaster pool.
   */
  async autoAssignRemaining(
    requestId: string,
    user: JwtPayload,
  ): Promise<{
    message: string;
    assignments: PlantationAssignment[];
    request: PlantationRequest;
  }> {
    const request = await this.requestModel.findById(requestId).exec();
    if (!request || request.isDeleted) {
      throw new NotFoundException(`Plantation request #${requestId} not found`);
    }

    // Security: Only owner or admin/staff
    const isStaff =
      user.roles?.includes(SystemRole.SUPER_ADMIN) ||
      user.roles?.includes(SystemRole.ADMIN);

    if (!isStaff && request.userId.toString() !== user.sub) {
      throw new ForbiddenException(
        'You can only manage your own plantation requests',
      );
    }

    const existingAssignments = await this.assignmentModel
      .find({ plantationRequestId: request._id, isDeleted: false })
      .exec();

    const remaining = request.requiredTreeCount - existingAssignments.length;

    if (remaining <= 0) {
      if (
        request.status !== PlantationRequestStatus.ASSIGNED &&
        request.status !== PlantationRequestStatus.COMPLETED
      ) {
        request.status = PlantationRequestStatus.ASSIGNED;
        await request.save();
      }
      return {
        message: 'All required trees are already assigned',
        assignments: existingAssignments,
        request,
      };
    }

    // Find eligible active species from Admin-configured catalog
    const eligibleSpecies = await this.treeMasterModel
      .find({
        isActive: true,
        isDeleted: false,
        availability: TreeAvailability.AVAILABLE,
      })
      .sort({ displayOrder: 1, name: 1 })
      .exec();

    if (eligibleSpecies.length === 0) {
      throw new BadRequestException(
        'Insufficient eligible trees available in catalog for automatic assignment. Please contact administrator.',
      );
    }

    const currentUser = await this.userModel.findById(request.userId).exec();
    const ownerName = currentUser
      ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ')
      : 'Citizen';

    const createdAssignments: PlantationAssignmentDocument[] = [];

    for (let i = 0; i < remaining; i++) {
      const species = eligibleSpecies[i % eligibleSpecies.length];

      const tree = await this.treesService.create({
        treeName: species.name,
        species: species.species || species.name,
        scientificName: species.scientificName || '',
        userId: request.userId.toString(),
        userName: ownerName,
        mobile: currentUser?.phone || '0000000000',
        vehicleNumber: request.vehiclePlate,
        policyNumber: request.insuranceId,
        insuranceStatus: 'ACTIVE',
        status: 'PLANTED',
        height: 1,
        remarks: 'Auto-assigned via Admin rule',
      } as any);

      const assignmentId = await this.generateAssignmentId();
      const assignment = new this.assignmentModel({
        assignmentId,
        plantationRequestId: request._id,
        userId: request.userId,
        insuranceId: request.insuranceId,
        vehicleId: request.vehicleId,
        vehiclePlate: request.vehiclePlate,
        treeMasterId: species._id,
        treeMasterName: species.name,
        treeId: (tree as any)._id,
        treeCode: (tree as any).treeId,
        assignmentType: AssignmentType.AUTO_ASSIGNED,
        status: AssignmentStatus.ASSIGNED,
        assignedAt: new Date(),
      });

      const saved = await assignment.save();
      createdAssignments.push(saved);
    }

    request.autoAssignedTreeCount += remaining;
    request.status = PlantationRequestStatus.ASSIGNED;
    const updatedRequest = await request.save();

    return {
      message: `Successfully auto-assigned ${remaining} tree(s)`,
      assignments: [...existingAssignments, ...createdAssignments],
      request: updatedRequest,
    };
  }

  /**
   * Citizen view: get authenticated user's plantation requests with assignments.
   */
  async findMy(user: JwtPayload): Promise<Array<{
    request: PlantationRequest;
    assignments: PlantationAssignment[];
  }>> {
    const requests = await this.requestModel
      .find({ userId: new Types.ObjectId(user.sub), isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();

    const results = await Promise.all(
      requests.map(async (req) => {
        const assignments = await this.assignmentModel
          .find({ plantationRequestId: req._id, isDeleted: false })
          .populate('treeId')
          .sort({ assignedAt: 1 })
          .exec();
        return { request: req, assignments };
      }),
    );

    return results;
  }

  /**
   * Get single plantation request by ID with ownership/admin check.
   */
  async findOne(
    id: string,
    user: JwtPayload,
  ): Promise<{
    request: PlantationRequest;
    assignments: PlantationAssignment[];
  }> {
    const request = await this.requestModel.findById(id).exec();
    if (!request || request.isDeleted) {
      throw new NotFoundException(`Plantation request #${id} not found`);
    }

    const isStaff =
      user.roles?.includes(SystemRole.SUPER_ADMIN) ||
      user.roles?.includes(SystemRole.ADMIN);

    if (!isStaff && request.userId.toString() !== user.sub) {
      throw new ForbiddenException(
        'You can only view your own plantation requests',
      );
    }

    const assignments = await this.assignmentModel
      .find({ plantationRequestId: request._id, isDeleted: false })
      .populate('treeId')
      .sort({ assignedAt: 1 })
      .exec();

    return { request, assignments };
  }

  /**
   * Admin view: list all plantation requests with filters and pagination.
   */
  async findAllAdmin(query: PlantationAssignmentQueryDto): Promise<{
    data: Array<{
      request: PlantationRequest;
      user: { id: string; name: string; email?: string; phone?: string };
      assignments: PlantationAssignment[];
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { requestId: new RegExp(s, 'i') },
        { insuranceId: new RegExp(s, 'i') },
        { vehiclePlate: new RegExp(s, 'i') },
        { vehicleType: new RegExp(s, 'i') },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 20);
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .populate('userId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.requestModel.countDocuments(filter),
    ]);

    const data = await Promise.all(
      requests.map(async (req) => {
        const userDoc = req.userId as unknown as UserDocument;
        const assignments = await this.assignmentModel
          .find({ plantationRequestId: req._id, isDeleted: false })
          .populate('treeId')
          .sort({ assignedAt: 1 })
          .exec();

        return {
          request: req,
          user: {
            id: userDoc?._id?.toString() || '',
            name: [userDoc?.firstName, userDoc?.lastName].filter(Boolean).join(' ') || 'Citizen',
            email: userDoc?.email,
            phone: userDoc?.phone,
          },
          assignments,
        };
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Update assignment status and optional mitra assignment (Admin/Mitra).
   */
  async updateAssignmentStatus(
    assignmentId: string,
    dto: UpdateAssignmentStatusDto,
    user: JwtPayload,
  ): Promise<PlantationAssignment> {
    const isStaff =
      user.roles?.includes(SystemRole.SUPER_ADMIN) ||
      user.roles?.includes(SystemRole.ADMIN) ||
      user.roles?.includes(SystemRole.MITRA);

    if (!isStaff) {
      throw new ForbiddenException(
        'Only administrators or assigned mitras can update assignment status',
      );
    }

    const assignment = await this.assignmentModel.findById(assignmentId).exec();
    if (!assignment || assignment.isDeleted) {
      throw new NotFoundException(`Plantation assignment #${assignmentId} not found`);
    }

    assignment.status = dto.status;
    if (dto.status === AssignmentStatus.PLANTED && !assignment.plantedAt) {
      assignment.plantedAt = new Date();
    }
    if (dto.mitraId) {
      assignment.mitraId = new Types.ObjectId(dto.mitraId);
    }

    const updated = await assignment.save();

    // Sync status with the actual Tree document
    if (assignment.treeId) {
      if (dto.status === AssignmentStatus.VERIFIED) {
        await this.treesService.update(assignment.treeId.toString(), {
          verifiedAt: new Date(),
        } as any);
      }
    }

    return updated;
  }

  /**
   * Generate QR Code for an assignment/tree.
   */
  async generateTreeQr(
    assignmentId: string,
    user: JwtPayload,
  ): Promise<{ qrDataUrl: string; publicUrl: string; treeCode: string }> {
    const assignment = await this.assignmentModel.findById(assignmentId).exec();
    if (!assignment || assignment.isDeleted) {
      throw new NotFoundException(`Plantation assignment #${assignmentId} not found`);
    }

    const isStaff =
      user.roles?.includes(SystemRole.SUPER_ADMIN) ||
      user.roles?.includes(SystemRole.ADMIN);

    if (!isStaff && assignment.userId.toString() !== user.sub) {
      throw new ForbiddenException(
        'You can only generate QR codes for your own trees',
      );
    }

    const publicAppUrl =
      this.configService.get<string>('PUBLIC_APP_URL') ||
      'https://paryavaranprahri.org';

    const treeCode = assignment.treeCode || assignment.assignmentId;
    const publicUrl = `${publicAppUrl}/tree/${treeCode}`;
    const qrDataUrl = await QRCode.toDataURL(publicUrl);

    assignment.qrCodeUrl = publicUrl;
    await assignment.save();

    return { qrDataUrl, publicUrl, treeCode };
  }

  /**
   * Public tree lookup for QR scanning without exposing sensitive user data.
   */
  async getPublicTree(treeId: string) {
    const tree = await this.treesService.findByTreeId(treeId);
    if (!tree) {
      throw new NotFoundException(`Tree with ID "${treeId}" not found`);
    }

    return {
      treeId: tree.treeId,
      treeName: tree.treeName,
      species: tree.species,
      scientificName: tree.scientificName,
      plantedDate: tree.plantedDate,
      status: tree.status,
      height: tree.height,
      annualOxygenProductionKg: tree.annualOxygenProductionKg ?? 0,
      annualCo2Kg: oxygenToCo2Kg(tree.annualOxygenProductionKg ?? 0),
      vidhanSabha: tree.vidhanSabha || null,
      image: tree.image || null,
    };
  }
}
