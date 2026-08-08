import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KtmsOcrService } from './ktms-ocr.service';

@ApiTags('pkkmb')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('pkkmb/ktms')
export class KtmsOcrController {
  constructor(private readonly ocrService: KtmsOcrService) {}

  @Post('ocr')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async ocr(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File KTMS wajib diunggah.');
    }
    const data = await this.ocrService.recognize(file.buffer);
    return { success: true, data };
  }
}
