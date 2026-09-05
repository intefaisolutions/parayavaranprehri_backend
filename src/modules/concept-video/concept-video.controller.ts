import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ConceptVideoService } from './concept-video.service';
import { UpdateConceptVideoDto } from './dto/update-concept-video.dto';

@ApiTags('concept-video')
@ApiBearerAuth()
@Controller('concept-video')
export class ConceptVideoController {
  constructor(private readonly conceptVideoService: ConceptVideoService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get active Concept Video configuration' })
  get() {
    return this.conceptVideoService.get();
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create or update active Concept Video configuration' })
  updatePost(@Body() dto: UpdateConceptVideoDto) {
    return this.conceptVideoService.update(dto);
  }

  @Public()
  @Patch()
  @ApiOperation({ summary: 'Patch active Concept Video configuration' })
  updatePatch(@Body() dto: UpdateConceptVideoDto) {
    return this.conceptVideoService.update(dto);
  }
}
