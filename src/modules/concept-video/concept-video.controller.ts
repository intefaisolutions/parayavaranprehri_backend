import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../common/enums/role.enum';
import { ConceptVideoService } from './concept-video.service';
import { UpdateConceptVideoDto } from './dto/update-concept-video.dto';

@ApiTags('concept-video')
@Controller('concept-video')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ConceptVideoController {
  constructor(private readonly conceptVideoService: ConceptVideoService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get active Concept Video configuration' })
  get() {
    return this.conceptVideoService.get();
  }

  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create or update active Concept Video configuration' })
  updatePost(@Body() dto: UpdateConceptVideoDto) {
    return this.conceptVideoService.update(dto);
  }

  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Patch()
  @ApiOperation({ summary: 'Patch active Concept Video configuration' })
  updatePatch(@Body() dto: UpdateConceptVideoDto) {
    return this.conceptVideoService.update(dto);
  }
}

