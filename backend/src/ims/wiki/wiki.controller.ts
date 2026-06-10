import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WikiService } from './wiki.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorator';

@ApiTags('IMS - Wiki Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ims/wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua artikel Wiki & SOP organisasi' })
  async list(@Query() query: any) {
    return this.wikiService.list(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detail artikel Wiki berdasarkan slug' })
  async findOne(@Param('slug') slug: string) {
    return this.wikiService.findOneBySlug(slug);
  }

  @Post()
  @Roles('Sekretaris')
  @ApiOperation({ summary: 'Buat artikel Wiki/SOP baru' })
  async create(@Body() body: any) {
    return this.wikiService.create(body);
  }

  @Patch(':id')
  @Roles('Sekretaris')
  @ApiOperation({ summary: 'Perbarui isi artikel Wiki' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.wikiService.update(id, body);
  }

  @Delete(':id')
  @Roles('Sekretaris')
  @ApiOperation({ summary: 'Hapus artikel Wiki' })
  async delete(@Param('id') id: string) {
    return this.wikiService.delete(id);
  }
}
