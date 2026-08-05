import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { BoundaryLookupDto } from './dto/boundary-lookup.dto';
import {
  ConstituenciesQueryDto,
  DistrictsQueryDto,
  StatesQueryDto,
} from './dto/geography-query.dto';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { GeoService } from './geo.service';

const GEO_ROLES = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ADMIN,
  SystemRole.FIELD_OFFICER,
  SystemRole.GOVERNMENT_OFFICER,
] as const;

/** Staff + citizen app (register / profile GPS). */
const GEO_CITIZEN_ROLES = [...GEO_ROLES, SystemRole.CUSTOMER] as const;

@ApiTags('Geo')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'geo', version: '1' })
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('countries')
  @Roles(...GEO_ROLES)
  @ApiOperation({ summary: 'Master catalog: countries' })
  listCountries() {
    return this.geoService.listCountries();
  }

  @Get('states')
  @Roles(...GEO_ROLES)
  @ApiOperation({ summary: 'Master catalog: states (optional ?country=India)' })
  listStates(@Query() query: StatesQueryDto) {
    return this.geoService.listStates(query.country);
  }

  @Get('districts')
  @Roles(...GEO_ROLES)
  @ApiOperation({ summary: 'Master catalog: districts for a state' })
  listDistricts(@Query() query: DistrictsQueryDto) {
    return this.geoService.listDistricts(query.state, query.country);
  }

  @Get('constituencies')
  @Roles(...GEO_CITIZEN_ROLES)
  @ApiOperation({
    summary:
      'Master catalog: Vidhan Sabha / AC list for a district (staff + customer)',
  })
  listConstituencies(@Query() query: ConstituenciesQueryDto) {
    return this.geoService.listConstituencies(
      query.state,
      query.district,
      query.country,
    );
  }

  @Get('constituencies/:id/boundary')
  @Roles(...GEO_ROLES)
  @ApiOperation({
    summary: 'Load GeoJSON boundary for a master constituency id',
  })
  getConstituencyBoundary(@Param('id') id: string) {
    return this.geoService.getConstituencyBoundary(id);
  }

  @Post('reverse')
  @Roles(...GEO_CITIZEN_ROLES)
  @ApiOperation({
    summary:
      'Reverse-geocode lat/lng (OSM) and auto-detect Vidhan Sabha (staff + customer)',
  })
  reverse(@Body() dto: ReverseGeocodeDto) {
    return this.geoService.reverse(dto);
  }

  @Get('boundary-lookup')
  @Roles(...GEO_ROLES)
  @ApiOperation({
    summary:
      'Legacy name-based boundary lookup (prefers masterId via /constituencies/:id/boundary)',
  })
  lookupBoundary(@Query() query: BoundaryLookupDto) {
    return this.geoService.lookupBoundary(query);
  }
}
