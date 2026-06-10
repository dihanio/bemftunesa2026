import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
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
import { LpjService } from './lpj.service';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - LPJ & SPJ')
@Controller('ims')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class LpjController {
  constructor(private readonly lpjService: LpjService) {}

  @Get('lpj')
  @ApiOperation({ summary: 'List LPJ' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listLpj(@Query() query: any, @Request() req: any) {
    const user = req.user;
    const currentRole = user?.role;
    const isBPI = [
      'Super Admin',
      'Admin Sistem',
      'System Administrator',
      'KaBEM',
      'WaKaBEM',
      'Bendahara',
      'Sekretaris',
    ].includes(currentRole);
    const departmentId = user?.department;
    return this.lpjService.listLpj(query, departmentId, isBPI);
  }

  @Post('lpj')
  @Roles('Kadep')
  @ApiOperation({ summary: 'Submit LPJ' })
  async createLpj(@Body() body: any) {
    return this.lpjService.createLpj(body);
  }

  @Post('spj')
  @Roles('Staff')
  @ApiOperation({ summary: 'Upload bukti SPJ' })
  async createSpj(@Body() body: any) {
    return this.lpjService.createSpj(body);
  }

  @Get('spj')
  @ApiOperation({ summary: 'List SPJ entries / transaction ledger' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listSpj(@Query() query: any, @Request() req: any) {
    const user = req.user;
    const currentRole = user?.role;
    const isBPI = [
      'Super Admin',
      'Admin Sistem',
      'System Administrator',
      'KaBEM',
      'WaKaBEM',
      'Bendahara',
      'Sekretaris',
    ].includes(currentRole);
    const departmentId = user?.department;
    return this.lpjService.listSpj(query, departmentId, isBPI);
  }

  @Patch('lpj/:id/validate')
  @Roles('Bendahara')
  @ApiOperation({ summary: 'Validate LPJ' })
  async validateLpj(@Param('id') id: string) {
    return this.lpjService.validateLpj(id);
  }
}
