import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Assuming default Passport JWT guard
import { SystemRole } from '../../src/common/enums/role.enum';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { QueryKnowledgeBaseDto } from './dto/query-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { KnowledgeBaseService } from './knowledge-base.service';

@Controller('api/admin/chatbot/knowledge')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(SystemRole.ADMIN)
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Post()
  create(
    @Body() createDto: CreateKnowledgeBaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.kbService.create(createDto, user?.sub);
  }

  @Get()
  findAll(@Query() queryDto: QueryKnowledgeBaseDto) {
    return this.kbService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kbService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateKnowledgeBaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.kbService.update(id, updateDto, user?.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.kbService.remove(id, user?.sub);
  }
}
