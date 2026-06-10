import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorator';
import { PartnershipsService } from './partnerships.service';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - Partnerships')
@Controller('ims/partnerships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnershipsController {
  constructor(private readonly partnershipsService: PartnershipsService) {}

  @Get()
  @ApiOperation({ summary: 'List mitra/sponsor' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async list(@Query() query: any) {
    return this.partnershipsService.list(query);
  }

  @Post()
  @Roles('Kadep')
  @ApiOperation({ summary: 'Input prospek mitra baru' })
  async create(@Body() body: any) {
    return this.partnershipsService.create(body);
  }

  @Patch(':id/status')
  @Roles('Kadep')
  @ApiOperation({ summary: 'Update status mitra (Follow Up/Deal)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.partnershipsService.updateStatus(id, body.status);
  }
}
