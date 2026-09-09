import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({
  path: ['paryavaran/crm-leads', 'crm-leads', 'paryavaran/leads', 'leads'],
  version: ['1', VERSION_NEUTRAL],
})
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Submit a new lead — saves to Paryavaran MongoDB and forwards to IntefAI CRM',
  })
  @ApiResponse({
    status: 201,
    description: 'Lead created in MongoDB and submitted to IntefAI CRM',
  })
  createLead(@Body() dto: CreateLeadDto) {
    return this.leadsService.createLead(dto);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get CRM Lead synchronization statistics' })
  @ApiResponse({ status: 200, description: 'Summary KPI counts' })
  getStats() {
    return this.leadsService.getCrmStats();
  }

  @Public()
  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry CRM submission for an existing lead' })
  retryLead(@Param('id') id: string) {
    return this.leadsService.retryLead(id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List leads with CRM sync status (paginated with filters)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('leadType') leadType?: string,
    @Query('company') company?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.leadsService.findCrmLeads({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
      leadType,
      company,
      from,
      to,
      sortBy,
      sortOrder,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID with complete CRM audit details' })
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }
}
