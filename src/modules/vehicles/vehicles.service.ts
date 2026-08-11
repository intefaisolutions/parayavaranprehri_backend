import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { SystemRole } from '../../common/enums/role.enum';
import { WhatsappService } from '../../common/services/whatsapp.service';
import { oxygenToCo2Kg } from '../../common/utils/carbon.util';
import { normalizeMobile } from '../../common/utils/identity.util';
import { buildSimplePdf } from '../../reports/utils/report-export.util';
import { Tree, TreeDocument } from '../../trees/schemas/tree.schema';
import { UsersService } from '../users/users.service';
import { OtpRepository } from '../auth/services/email.service';
import { SmsService } from '../auth/services/sms.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  VehicleOtpRequestDto,
  VehicleOtpVerifyDto,
} from './dto/vehicle-otp.dto';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';

function normalizePlate(plate: string): string {
  return String(plate || '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
}

type CertDownloadEntry = {
  buffer: Buffer;
  fileName: string;
  expiresAt: number;
};

@Injectable()
export class VehiclesService {
  /** One-time public PDF download tokens (no auth header needed for browser/share). */
  private readonly certDownloads = new Map<string, CertDownloadEntry>();

  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    @InjectModel(Tree.name) private treeModel: Model<TreeDocument>,
    private readonly usersService: UsersService,
    private readonly otpRepository: OtpRepository,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  private otpIdentifier(userId: string, plate: string): string {
    return `vehicle-otp:${userId}:${normalizePlate(plate)}`;
  }

  private generateOtp(): string {
    const staticMode = this.configService.get<string>('STATIC_OTP_MODE');
    if (staticMode === 'true') {
      return this.configService.get<string>('STATIC_OTP_CODE') ?? '1234';
    }
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async requestOtp(dto: VehicleOtpRequestDto, user: JwtPayload) {
    const plate = String(dto.plate || '').trim().toUpperCase();
    if (plate.length < 6) {
      throw new BadRequestException('Enter a valid vehicle number');
    }

    const me = (await this.usersService.findOne(user.sub)) as {
      phone?: string;
      firstName?: string;
      lastName?: string;
    };
    const phone = normalizeMobile(me.phone);
    if (!phone) {
      throw new BadRequestException(
        'No mobile number on your account. Update profile before verifying a vehicle.',
      );
    }

    const code = this.generateOtp();
    const expiresMinutes =
      this.configService.get<number>('OTP_EXPIRES_IN_MINUTES') ?? 10;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
    const identifier = this.otpIdentifier(user.sub, plate);

    await this.otpRepository.create(identifier, code, expiresAt, user.sub);

    const staticMode =
      this.configService.get<string>('STATIC_OTP_MODE') === 'true';
    if (staticMode) {
      return {
        message: 'OTP has been sent successfully',
        maskedMobile: this.maskMobile(phone),
        plate,
      };
    }

    const smsSent = await this.smsService.sendOtp(phone, code);
    const company =
      this.configService.get<string>('COMPANY_NAME') || 'Shield Sure Insurance';
    const waMessage = `${company} ,Dear User ${code} is your OTP to verify vehicle ${plate}. GGISKB`;
    const waResult = await this.whatsappService.sendMessage(phone, waMessage);

    if (!smsSent && !waResult.success) {
      throw new InternalServerErrorException(
        'Failed to send OTP via SMS and WhatsApp. Please try again.',
      );
    }

    return {
      message: smsSent
        ? 'OTP has been sent successfully'
        : 'OTP has been sent successfully via WhatsApp',
      maskedMobile: this.maskMobile(phone),
      plate,
    };
  }

  async verifyOtp(dto: VehicleOtpVerifyDto, user: JwtPayload) {
    const plate = String(dto.plate || '').trim().toUpperCase();
    const code = String(dto.code || '').trim();
    const identifier = this.otpIdentifier(user.sub, plate);
    const otp = await this.otpRepository.findValid(identifier, code);
    if (!otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.otpRepository.markUsed(otp._id.toString());
    return {
      verified: true,
      plate,
      message: 'Vehicle OTP verified successfully',
    };
  }

  private maskMobile(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return digits.length >= 4 ? `+91 ••••••${last4}` : phone;
  }

  private allocateVhId(): string {
    const year = new Date().getFullYear();
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `VH-IND-${year}-${suffix}`;
  }

  async create(
    createVehicleDto: CreateVehicleDto,
    userId: string,
  ): Promise<Vehicle> {
    const vhId =
      String(createVehicleDto.vhId || '').trim() || this.allocateVhId();
    const createdVehicle = new this.vehicleModel({
      ...createVehicleDto,
      vhId,
      userId,
    });
    return createdVehicle.save();
  }

  async findAll(userId?: string): Promise<Vehicle[]> {
    const filter = userId ? { userId } : {};
    return this.vehicleModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async findTreesForVehicle(id: string, user: JwtPayload) {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const ownerId = String(vehicle.userId);
    const isStaff =
      user.role === SystemRole.SUPER_ADMIN || user.role === SystemRole.ADMIN;
    if (!isStaff && ownerId !== user.sub) {
      throw new ForbiddenException(
        'You can only view trees for your own vehicles',
      );
    }

    const plateNorm = normalizePlate(vehicle.plate);
    const rawPlate = String(vehicle.plate || '').trim();
    const candidates = await this.treeModel
      .find({
        vehicleNumber: { $exists: true, $nin: [null, ''] },
      })
      .sort({ plantedDate: -1 })
      .lean()
      .exec();

    const list = candidates.filter((t) => {
      const vn = normalizePlate(String(t.vehicleNumber || ''));
      if (plateNorm && vn === plateNorm) return true;
      if (
        rawPlate &&
        String(t.vehicleNumber || '').toLowerCase() === rawPlate.toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    return {
      vehicleId: String(vehicle._id),
      plate: vehicle.plate,
      trees: list.map((t) => ({
        _id: t._id,
        treeId: t.treeId,
        treeName: t.treeName,
        species: t.species,
        status: t.status,
        plantedDate: t.plantedDate,
        height: t.height,
        oxygenKg: t.annualOxygenProductionKg ?? 0,
        co2Kg: oxygenToCo2Kg(t.annualOxygenProductionKg ?? 0),
        image: t.image || null,
        vidhanSabha: t.vidhanSabha || null,
      })),
      totalTrees: list.length,
    };
  }

  async buildCertificate(
    id: string,
    user: JwtPayload,
  ): Promise<{
    pdfBase64: string;
    fileName: string;
    text: string;
    downloadToken: string;
    downloadPath: string;
  }> {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const ownerId = String(vehicle.userId);
    const isStaff =
      user.role === SystemRole.SUPER_ADMIN || user.role === SystemRole.ADMIN;
    if (!isStaff && ownerId !== user.sub) {
      throw new ForbiddenException(
        'You can only download certificates for your own vehicles',
      );
    }

    const me = (await this.usersService.findOne(ownerId)) as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
    };
    const ownerName =
      [me.firstName, me.lastName].filter(Boolean).join(' ').trim() ||
      'Citizen';

    const trees = await this.findTreesForVehicle(id, user);
    const today = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const lines = [
      'Digital Environmental Contribution Certificate',
      '',
      `Citizen: ${ownerName}`,
      `Mobile: ${me.phone || '—'}`,
      `Email: ${me.email || '—'}`,
      `Vehicle: ${vehicle.name || '—'}`,
      `Plate: ${vehicle.plate}`,
      `Vehicle ID: ${vehicle.vhId || '—'}`,
      `Fuel: ${vehicle.fuel || '—'}`,
      `Insurance: ${vehicle.insuranceId || '—'}`,
      `Trees linked: ${trees.totalTrees}`,
      `Issued: ${today}`,
      '',
      'Mission 2047 · Paryavaran Prahri',
    ];

    const text = ['Paryavaran Prahri — Mission 2047', ...lines].join('\n');
    const pdf = buildSimplePdf('Paryavaran Prahri Certificate', lines);
    const fileName = `vehicle-certificate-${normalizePlate(vehicle.plate)}.pdf`;
    const downloadToken = randomBytes(16).toString('hex');
    this.certDownloads.set(downloadToken, {
      buffer: pdf,
      fileName,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return {
      pdfBase64: pdf.toString('base64'),
      fileName,
      text,
      downloadToken,
      downloadPath: `/vehicles/certificate-download/${downloadToken}`,
    };
  }

  consumeCertificateDownload(token: string): {
    buffer: Buffer;
    fileName: string;
  } {
    const entry = this.certDownloads.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      this.certDownloads.delete(token);
      throw new NotFoundException('Certificate download link expired or invalid');
    }
    this.certDownloads.delete(token);
    return { buffer: entry.buffer, fileName: entry.fileName };
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const updatedVehicle = await this.vehicleModel
      .findByIdAndUpdate(id, updateVehicleDto, { new: true })
      .exec();
    if (!updatedVehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return updatedVehicle;
  }

  async remove(id: string): Promise<Vehicle> {
    const deletedVehicle = await this.vehicleModel.findByIdAndDelete(id).exec();
    if (!deletedVehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return deletedVehicle;
  }
}
