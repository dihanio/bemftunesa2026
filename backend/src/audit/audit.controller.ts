import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles('super-admin')
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('user') user?: string,
  ) {
    return this.auditService.findAll({ ...query, entity, action, user });
  }
}
