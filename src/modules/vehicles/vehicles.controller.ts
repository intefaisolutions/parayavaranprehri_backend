import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  VehicleOtpRequestDto,
  VehicleOtpVerifyDto,
} from './dto/vehicle-otp.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller({ path: 'vehicles', version: '1' })
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Public()
  @Get('certificate-download/:token')
  @ApiOperation({ summary: 'One-time public PDF download (opens in browser)' })
  @Header('Content-Type', 'application/pdf')
  downloadCertificate(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } =
      this.vehiclesService.consumeCertificateDownload(token);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    res.send(buffer);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('otp/request')
  @ApiOperation({ summary: 'Send OTP to verify vehicle against account mobile' })
  requestOtp(
    @Body() dto: VehicleOtpRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.vehiclesService.requestOtp(dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify vehicle OTP (does not issue login tokens)' })
  verifyOtp(
    @Body() dto: VehicleOtpVerifyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.vehiclesService.verifyOtp(dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.vehiclesService.create(createVehicleDto, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.vehiclesService.findAll(user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/certificate')
  @ApiOperation({
    summary: 'Generate vehicle environmental contribution certificate (PDF)',
  })
  getCertificate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vehiclesService.buildCertificate(id, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/trees')
  @ApiOperation({
    summary:
      'Trees planted against this vehicle (match by plate ↔ tree.vehicleNumber)',
  })
  findTrees(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vehiclesService.findTreesForVehicle(id, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
