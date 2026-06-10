import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UsePipes,
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
import { RequirePermissions } from '../../permissions/permissions.decorator';
import { PermissionsGuard } from '../../permissions/permissions.guard';
import { DocumentsService } from './documents.service';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - Documents')
@Controller('ims/documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'List surat/dokumen' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async list(@Query() query: any) {
    return this.documentsService.list(query);
  }

  @Post()
  @RequirePermissions('documents.manage')
  @ApiOperation({ summary: 'Create draft surat baru' })
  async create(@Body() body: any) {
    return this.documentsService.create(body);
  }

  @Put(':id')
  @Roles('Sekretaris')
  @RequirePermissions('documents.manage')
  @ApiOperation({ summary: 'Update surat' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.documentsService.update(id, body);
  }

  @Patch(':id/approve')
  @Roles('Super Admin')
  @RequirePermissions('documents.approve')
  @ApiOperation({ summary: 'Approve & sign surat' })
  async approve(@Param('id') id: string) {
    return this.documentsService.approve(id);
  }

  @Get(':id/pdf')
  @Roles('Sekretaris')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Generate PDF surat' })
  async generatePdf(@Param('id') id: string) {
    return this.documentsService.generatePdf(id);
  }

  @Get(':id/history')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Get document VCS version history' })
  async listHistory(@Param('id') id: string) {
    return this.documentsService.listHistory(id);
  }

  @Post(':id/snapshots')
  @RequirePermissions('documents.manage')
  @ApiOperation({ summary: 'Create new document version snapshot' })
  async createSnapshot(
    @Param('id') id: string,
    @Body() body: { note?: string; snapshot: any },
    @Request() req: any,
  ) {
    return this.documentsService.createSnapshot(id, {
      ...body,
      userId: req.user.userId,
    });
  }

  @Post(':id/rollback')
  @RequirePermissions('documents.manage')
  @ApiOperation({ summary: 'Rollback document to specific version' })
  async rollback(
    @Param('id') id: string,
    @Body() body: { version: number },
    @Request() req: any,
  ) {
    return this.documentsService.rollback(id, body.version, req.user.userId);
  }
}
