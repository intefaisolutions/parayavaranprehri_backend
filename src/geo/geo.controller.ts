import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { GeoService } from './geo.service';

@ApiTags('Geo')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'geo', version: '1' })
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Post('reverse')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ADMIN,
    SystemRole.FIELD_OFFICER,
    SystemRole.GOVERNMENT_OFFICER,
  )
  @ApiOperation({
    summary:
      'Reverse-geocode lat/lng (OSM) and auto-detect Vidhan Sabha from polygon',
  })
  reverse(@Body() dto: ReverseGeocodeDto) {
    return this.geoService.reverse(dto);
  }
}
