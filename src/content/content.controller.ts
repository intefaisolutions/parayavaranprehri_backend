import { Controller, Get, Put, Param, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { UpdateContentDto } from './dto/update-content.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Content')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'content', version: '1' })
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get(':type')
  @ApiOperation({ summary: 'Get content by type (privacy_policy, terms_conditions, about_us)' })
  getContent(@Param('type') type: string) {
    return this.contentService.getContent(type);
  }

  @Put(':type')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @ApiOperation({ summary: 'Update content by type (Admin only)' })
  updateContent(
    @Param('type') type: string,
    @Body() updateContentDto: UpdateContentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.updateContent(type, updateContentDto, user);
  }
}
