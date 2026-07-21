import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private isS3Configured = false;

  constructor(private configService: ConfigService) {
    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT');
    const s3Region = this.configService.get<string>('S3_REGION');
    const s3AccessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const s3SecretKey = this.configService.get<string>('S3_SECRET_KEY');

    if (s3Endpoint && s3AccessKey && s3SecretKey) {
      this.s3Client = new S3Client({
        endpoint: s3Endpoint,
        region: s3Region || 'us-east-1',
        credentials: {
          accessKeyId: s3AccessKey,
          secretAccessKey: s3SecretKey,
        },
        forcePathStyle: true,
      });
      this.isS3Configured = true;
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const extension = extname(file.originalname);
    const filename = `${uniqueSuffix}${extension}`;

    if (this.isS3Configured) {
      return this.uploadToS3(file, filename);
    } else {
      return this.uploadLocally(file, filename);
    }
  }

  private async uploadToS3(file: Express.Multer.File, filename: string): Promise<string> {
    const bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'bemft-bucket';
    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT');

    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: `public/${filename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }));

      // Return Supabase/S3 public URL pattern
      return `${s3Endpoint}/${bucketName}/public/${filename}`;
    } catch (err: any) {
      this.logger.error(`S3 upload failed: ${err.message}`);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  private async uploadLocally(file: Express.Multer.File, filename: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${filename}`;
  }
}
