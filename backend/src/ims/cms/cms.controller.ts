import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { RequirePermissions } from '../../permissions/permissions.decorator';
import { PermissionsGuard } from '../../permissions/permissions.guard';
import { CmsService } from './cms.service';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - CMS Articles')
@Controller('ims/articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  @Roles('Sekretaris')
  @RequirePermissions('cms.read')
  @ApiOperation({ summary: 'List articles (termasuk draft)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async list(@Query() query: any) {
    return this.cmsService.list(query);
  }

  @Post()
  @Roles('Sekretaris')
  @RequirePermissions('cms.manage')
  @ApiOperation({ summary: 'Create article' })
  async create(@Body() body: any) {
    return this.cmsService.create(body);
  }

  @Put(':id')
  @Roles('Sekretaris')
  @RequirePermissions('cms.manage')
  @ApiOperation({ summary: 'Update article' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.cmsService.update(id, body);
  }

  @Delete(':id')
  @Roles('Super Admin')
  @RequirePermissions('cms.manage')
  @ApiOperation({ summary: 'Soft delete article' })
  async delete(@Param('id') id: string) {
    return this.cmsService.softDelete(id);
  }
}
