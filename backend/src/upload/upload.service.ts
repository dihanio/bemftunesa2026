import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient | null = null;
  private readonly defaultBucket = 'media';
  private readonly maxImageSizeBytes = 5 * 1024 * 1024; // 5MB
  private readonly maxDocumentSizeBytes = 10 * 1024 * 1024; // 10MB
  private readonly allowedImageMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ]);
  private readonly allowedDocumentMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  constructor(private configService: ConfigService) {
    this.initSupabase();
  }

  private initSupabase() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private isConfigured(): boolean {
    return !!this.supabase;
  }

  private bufferFromBase64(base64String: string): Buffer {
    // Handle data URI format: "data:image/png;base64,iVBOR..."
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      return Buffer.from(matches[2], 'base64');
    }
    return Buffer.from(base64String, 'base64');
  }

  private getMimeType(base64String: string, fallback: string): string {
    const matches = base64String.match(/^data:(.+);base64,/);
    return matches ? matches[1] : fallback;
  }

  private validateUpload(
    mimeType: string,
    size: number,
    type: 'image' | 'document',
  ) {
    if (type === 'image') {
      if (!this.allowedImageMimeTypes.has(mimeType)) {
        throw new BadRequestException(
          'Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP',
        );
      }
      if (size > this.maxImageSizeBytes) {
        throw new BadRequestException('Ukuran gambar melebihi batas 5MB');
      }
      return;
    }

    if (!this.allowedDocumentMimeTypes.has(mimeType)) {
      throw new BadRequestException(
        'Format dokumen tidak didukung. Gunakan PDF atau DOC/DOCX',
      );
    }
    if (size > this.maxDocumentSizeBytes) {
      throw new BadRequestException('Ukuran dokumen melebihi batas 10MB');
    }
  }

  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async uploadImage(data: {
    file: string;
    fileName?: string;
    bucket?: string;
  }) {
    if (!data.file)
      throw new BadRequestException('Field "file" (base64) wajib diisi');

    try {
      const buffer = this.bufferFromBase64(data.file);
      const mimeType = this.getMimeType(data.file, 'image/jpeg');
      this.validateUpload(mimeType, buffer.length, 'image');
      if (!this.isConfigured()) {
        throw new BadRequestException(
          'Supabase belum dikonfigurasi. Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env',
        );
      }
      const extension = mimeType.split('/')[1] || 'jpg';
      const fileName = data.fileName || `img-${Date.now()}.${extension}`;
      const bucketName = data.bucket || this.defaultBucket;

      const { data: uploadData, error } = await this.supabase!.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        throw new InternalServerErrorException('Gagal upload ke Supabase: ' + error.message);
      }

      const { data: publicUrlData } = this.supabase!.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      return {
        data: {
          fileId: uploadData.path,
          url: publicUrlData.publicUrl,
          name: fileName,
          webViewLink: publicUrlData.publicUrl,
        },
        message: 'Image berhasil diupload',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Gagal upload ke Supabase: ' + (err.message || 'Unknown error'),
      );
    }
  }

  async uploadDocument(data: {
    file: string;
    fileName?: string;
    bucket?: string;
  }) {
    if (!data.file)
      throw new BadRequestException('Field "file" (base64) wajib diisi');

    try {
      const buffer = this.bufferFromBase64(data.file);
      const mimeType = this.getMimeType(data.file, 'application/pdf');
      this.validateUpload(mimeType, buffer.length, 'document');
      if (!this.isConfigured()) {
        throw new BadRequestException(
          'Supabase belum dikonfigurasi. Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env',
        );
      }
      const fileName = data.fileName || `doc-${Date.now()}.pdf`;
      const bucketName = data.bucket || 'documents';

      const { data: uploadData, error } = await this.supabase!.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        throw new InternalServerErrorException('Gagal upload dokumen ke Supabase: ' + error.message);
      }

      const { data: publicUrlData } = this.supabase!.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      return {
        data: {
          fileId: uploadData.path,
          url: publicUrlData.publicUrl,
          previewUrl: publicUrlData.publicUrl,
          name: fileName,
        },
        message: 'Dokumen berhasil diupload',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Gagal upload ke Supabase: ' + (err.message || 'Unknown error'),
      );
    }
  }

  async deleteFile(fileId: string, bucket: string = this.defaultBucket) {
    if (!fileId) throw new BadRequestException('File ID wajib diisi');

    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Supabase belum dikonfigurasi. Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env',
      );
    }

    try {
      const { error } = await this.supabase!.storage.from(bucket).remove([fileId]);
      
      if (error) {
        throw new InternalServerErrorException('Gagal menghapus file dari Supabase: ' + error.message);
      }
      
      return { message: `File ${fileId} berhasil dihapus dari Supabase Storage` };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Gagal menghapus file: ' + (err.message || 'Unknown error'),
      );
    }
  }
}
