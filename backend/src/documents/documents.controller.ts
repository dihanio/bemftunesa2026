import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(@Body() createDocumentDto: CreateDocumentDto, @Req() req: any) {
    const data = await this.documentsService.create(createDocumentDto, req.user.userId);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: QueryDocumentDto) {
    const result = await this.documentsService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.documentsService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    const data = await this.documentsService.update(id, updateDocumentDto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.documentsService.delete(id);
    return { success: true, data };
  }
}
