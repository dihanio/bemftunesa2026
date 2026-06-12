import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateAspirationSchema,
  ListArticlesQuerySchema,
  ListProkerQuerySchema,
  ListEventsQuerySchema,
  ListGalleryQuerySchema,
} from './public.dto';
import type {
  CreateAspirationDto,
  ListArticlesQueryDto,
  ListProkerQueryDto,
  ListEventsQueryDto,
  ListGalleryQueryDto,
} from './public.dto';
import { PaginationQuerySwagger } from '../common/dto/pagination.dto';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // --- Articles ---

  @Get('articles')
  @ApiOperation({ summary: 'List berita/artikel (paginated)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listArticles(
    @Query(new ZodValidationPipe(ListArticlesQuerySchema))
    query: ListArticlesQueryDto,
  ) {
    return this.publicService.listArticles(query);
  }

  @Get('articles/:slug')
  @ApiOperation({ summary: 'Detail artikel berdasarkan slug' })
  async getArticle(@Param('slug') slug: string) {
    return this.publicService.getArticleBySlug(slug);
  }

  // --- Proker ---

  @Get('proker')
  @ApiOperation({ summary: 'List program kerja publik (paginated)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listProker(
    @Query(new ZodValidationPipe(ListProkerQuerySchema))
    query: ListProkerQueryDto,
  ) {
    return this.publicService.listProker(query);
  }

  @Get('proker/:slug')
  @ApiOperation({ summary: 'Detail program kerja' })
  async getProker(@Param('slug') slug: string) {
    return this.publicService.getProkerBySlug(slug);
  }

  // --- Structure ---

  @Get('structure')
  @ApiOperation({ summary: 'Struktur organisasi BEM FT' })
  async getStructure() {
    return this.publicService.getStructure();
  }

  // --- Events ---

  @Get('events')
  @ApiOperation({ summary: 'Kalender kegiatan publik (paginated)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listEvents(
    @Query(new ZodValidationPipe(ListEventsQuerySchema))
    query: ListEventsQueryDto,
  ) {
    return this.publicService.listEvents(query);
  }

  // --- Gallery ---

  @Get('gallery')
  @ApiOperation({ summary: 'List album galeri (paginated)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listGallery(
    @Query(new ZodValidationPipe(ListGalleryQuerySchema))
    query: ListGalleryQueryDto,
  ) {
    return this.publicService.listGallery(query);
  }

  @Get('gallery/:id')
  @ApiOperation({ summary: 'Detail album + foto' })
  async getGalleryAlbum(@Param('id') id: string) {
    return this.publicService.getGalleryAlbum(id);
  }

  // --- Stats ---

  @Get('stats')
  @ApiOperation({ summary: 'Summary statistics untuk beranda' })
  async getStats() {
    return this.publicService.getStats();
  }

  // --- Aspirations ---

  @Post('aspirations')
  @ApiOperation({ summary: 'Submit aspirasi mahasiswa' })
  @UsePipes(new ZodValidationPipe(CreateAspirationSchema))
  async submitAspiration(@Body() body: CreateAspirationDto) {
    return this.publicService.submitAspiration(body);
  }

  @Get('aspirations/:id/status')
  @ApiOperation({ summary: 'Cek status aspirasi' })
  async getAspirationStatus(@Param('id') id: string) {
    return this.publicService.getAspirationStatus(id);
  }

  // --- Verify ---

  @Get('verify/:uuid')
  @ApiOperation({ summary: 'Verifikasi dokumen via QR UUID' })
  async verifyDocument(@Param('uuid') uuid: string) {
    return this.publicService.verifyDocument(uuid);
  }

  // --- Settings ---

  @Get('settings')
  @ApiOperation({ summary: 'Ambil public settings seperti maintenance mode' })
  async getSettings() {
    return this.publicService.getSettings();
  }
}
