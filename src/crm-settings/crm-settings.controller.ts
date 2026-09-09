import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CrmSettingsService } from './crm-settings.service';
import { UpdateCrmSettingsDto } from './dto/update-crm-settings.dto';

@ApiTags('CRM Settings')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({
  path: ['crm-settings', 'paryavaran/crm-settings'],
  version: ['1', VERSION_NEUTRAL],
})
export class CrmSettingsController {
  constructor(private readonly crmSettingsService: CrmSettingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get CRM settings and sync toggles' })
  @ApiResponse({ status: 200, description: 'Current CRM settings' })
  async getSettings() {
    const settings = await this.crmSettingsService.getSettings();
    return {
      success: true,
      message: 'CRM settings fetched successfully',
      data: settings,
    };
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Update CRM settings' })
  async updateSettingsPost(@Body() dto: UpdateCrmSettingsDto) {
    const updated = await this.crmSettingsService.updateSettings(dto);
    return {
      success: true,
      message: 'CRM settings updated successfully',
      data: updated,
    };
  }

  @Public()
  @Post('update')
  @ApiOperation({ summary: 'Update CRM settings (compatibility endpoint)' })
  async updateSettingsCompat(@Body() dto: UpdateCrmSettingsDto) {
    const updated = await this.crmSettingsService.updateSettings(dto);
    return {
      success: true,
      message: 'CRM settings updated successfully',
      data: updated,
    };
  }

  @Public()
  @Put()
  @ApiOperation({ summary: 'Update CRM settings (PUT)' })
  async updateSettingsPut(@Body() dto: UpdateCrmSettingsDto) {
    const updated = await this.crmSettingsService.updateSettings(dto);
    return {
      success: true,
      message: 'CRM settings updated successfully',
      data: updated,
    };
  }

  @Public()
  @Patch()
  @ApiOperation({ summary: 'Update CRM settings (PATCH)' })
  async updateSettingsPatch(@Body() dto: UpdateCrmSettingsDto) {
    const updated = await this.crmSettingsService.updateSettings(dto);
    return {
      success: true,
      message: 'CRM settings updated successfully',
      data: updated,
    };
  }

  @Public()
  @Post('test-connection')
  @ApiOperation({ summary: 'Test connection to IntefAI CRM' })
  async testConnection(@Body() dto?: UpdateCrmSettingsDto) {
    const result = await this.crmSettingsService.testConnection(dto);
    return {
      success: result.ok,
      message: result.message,
      data: result,
    };
  }
}
