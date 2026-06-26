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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { UpdateMediaDto, CreateFolderDto } from './dto/media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
};

@Controller('media')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  @RequiredPermissions('media:read')
  async findAll(@Query() query: PaginationQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Get(':id')
  @RequiredPermissions('media:read')
  async findById(@Param('id') id: string) {
    const data = await this.mediaService.findById(id);
    return { success: true, data };
  }

  @Post('upload')
  @RequiredPermissions('media:create')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserDocument,
    @Body('folder') folder?: string,
  ) {
    const data = await this.mediaService.upload(
      file,
      (user._id as unknown as string).toString(),
      folder,
    );
    return { success: true, data };
  }

  @Post('upload/batch')
  @RequiredPermissions('media:create')
  @UseInterceptors(FilesInterceptor('files', 20, multerOptions))
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: UserDocument,
    @Body('folder') folder?: string,
  ) {
    const data = await this.mediaService.uploadBatch(
      files,
      (user._id as unknown as string).toString(),
      folder,
    );
    return { success: true, data };
  }

  @Patch(':id')
  @RequiredPermissions('media:update')
  async update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    const data = await this.mediaService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequiredPermissions('media:delete')
  async delete(@Param('id') id: string) {
    const data = await this.mediaService.delete(id);
    return { success: true, data };
  }

  @Post('folders')
  @RequiredPermissions('media:create')
  async createFolder(@Body() dto: CreateFolderDto) {
    const data = await this.mediaService.createFolder(dto.path);
    return { success: true, data };
  }
}
