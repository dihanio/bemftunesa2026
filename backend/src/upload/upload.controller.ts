import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Upload & simpan foto ke Google Drive' })
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: 'string',
          description: 'Base64 encoded image (atau data URI)',
        },
        fileName: { type: 'string', description: 'Nama file (opsional)' },
      },
      required: ['file'],
    },
  })
  async uploadImage(@Body() body: { file: string; fileName?: string }) {
    return this.uploadService.uploadImage(body);
  }

  @Post('document')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Upload dokumen PDF/Doc ke Google Drive (Auth required)',
  })
  @ApiBody({
    schema: {
      properties: {
        file: { type: 'string', description: 'Base64 encoded document' },
        fileName: { type: 'string', description: 'Nama file (opsional)' },
      },
      required: ['file'],
    },
  })
  async uploadDocument(@Body() body: { file: string; fileName?: string }) {
    return this.uploadService.uploadDocument(body);
  }

  @Delete(':fileId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Hapus file dari Google Drive' })
  async deleteFile(@Param('fileId') fileId: string) {
    return this.uploadService.deleteFile(fileId);
  }
}
