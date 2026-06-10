import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private drive: drive_v3.Drive | null = null;
  private folderId: string | undefined;
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
    this.initGoogleDrive();
  }

  private initGoogleDrive() {
    const clientEmail = this.configService.get<string>(
      'GOOGLE_DRIVE_CLIENT_EMAIL',
    );
    const privateKey = this.configService.get<string>(
      'GOOGLE_DRIVE_PRIVATE_KEY',
    );
    this.folderId = this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID');

    if (clientEmail && privateKey) {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
    }
  }

  private isConfigured(): boolean {
    return !!(this.drive && this.folderId);
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
          'Google Drive belum dikonfigurasi. Set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, dan GOOGLE_DRIVE_FOLDER_ID di .env',
        );
      }
      const fileName =
        data.fileName || `img-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;

      const response = await this.drive!.files.create({
        requestBody: {
          name: fileName,
          parents: [this.folderId!],
        },
        media: {
          mimeType,
          body: this.bufferToStream(buffer),
        },
        fields: 'id, name, webViewLink, webContentLink',
      });

      // Set file to be publicly readable
      await this.drive!.permissions.create({
        fileId: response.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const fileId = response.data.id;
      const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;

      return {
        data: {
          fileId,
          url: publicUrl,
          name: response.data.name,
          webViewLink: response.data.webViewLink,
        },
        message: 'Image berhasil diupload',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Gagal upload ke Google Drive: ' + (err.message || 'Unknown error'),
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
          'Google Drive belum dikonfigurasi. Set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, dan GOOGLE_DRIVE_FOLDER_ID di .env',
        );
      }
      const fileName = data.fileName || `doc-${Date.now()}.pdf`;

      const response = await this.drive!.files.create({
        requestBody: {
          name: fileName,
          parents: [this.folderId!],
        },
        media: {
          mimeType,
          body: this.bufferToStream(buffer),
        },
        fields: 'id, name, webViewLink, webContentLink',
      });

      // Set file to be publicly readable
      await this.drive!.permissions.create({
        fileId: response.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const fileId = response.data.id;

      return {
        data: {
          fileId,
          url: `https://drive.google.com/uc?id=${fileId}&export=download`,
          previewUrl: response.data.webViewLink,
          name: response.data.name,
        },
        message: 'Dokumen berhasil diupload',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Gagal upload ke Google Drive: ' + (err.message || 'Unknown error'),
      );
    }
  }

  async deleteFile(fileId: string) {
    if (!fileId) throw new BadRequestException('File ID wajib diisi');

    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Google Drive belum dikonfigurasi. Set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, dan GOOGLE_DRIVE_FOLDER_ID di .env',
      );
    }

    try {
      await this.drive!.files.delete({ fileId });
      return { message: `File ${fileId} berhasil dihapus dari Google Drive` };
    } catch (err: any) {
      if (err.code === 404) {
        throw new BadRequestException('File tidak ditemukan di Google Drive');
      }
      throw new InternalServerErrorException(
        'Gagal menghapus file: ' + (err.message || 'Unknown error'),
      );
    }
  }
}
