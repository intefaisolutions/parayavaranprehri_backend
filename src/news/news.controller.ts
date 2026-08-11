import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateNewsDto } from './dto/create-news.dto';
import { NewsQueryDto } from './dto/news-query.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

@ApiTags('News')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'news', version: '1' })
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.NEWS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new news article' })
  create(@Body() dto: CreateNewsDto) {
    return this.newsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'List news articles (public — app uses status=Published; admin may pass other filters when authenticated)',
  })
  findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a news article by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.NEWS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update the publish status of a news article' })
  setStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.newsService.update(id, { status } as UpdateNewsDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.NEWS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a news article' })
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.newsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.NEWS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a news article' })
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
