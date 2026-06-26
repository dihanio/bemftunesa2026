import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { Media, MediaDocument } from '../schemas/media.schema';
import { UpdateMediaDto } from './dto/media.dto';
import {
  PaginationQueryDto,
  buildPaginateQuery,
  buildPaginateResponse,
} from '../common/dto/pagination.dto';

@Injectable()
export class MediaService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(
    @InjectModel(Media.name)
    private mediaModel: Model<MediaDocument>,
    private configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>(
      'UPLOAD_DIR',
      path.join(process.cwd(), 'public', 'uploads'),
    );
    this.baseUrl = this.configService.get<string>('BASE_URL') as string;

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(query: PaginationQueryDto & { folder?: string; mimeType?: string; tag?: string }) {
    const { skip, limit, sortObj } = buildPaginateQuery(query);
    const filter: Record<string, unknown> = {};

    if (query.folder !== undefined) filter.folder = query.folder;
    if (query.mimeType) filter.mimeType = { $regex: query.mimeType, $options: 'i' };
    if (query.tag) filter.tags = query.tag;
    if (query.search) {
      filter.$or = [
        { originalName: { $regex: query.search, $options: 'i' } },
        { alt: { $regex: query.search, $options: 'i' } },
        { caption: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.mediaModel
        .find(filter)
        .populate('uploadedBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.mediaModel.countDocuments(filter).exec(),
    ]);

    return buildPaginateResponse(data, total, query);
  }

  async findById(id: string) {
    const media = await this.mediaModel
      .findById(id)
      .populate('uploadedBy', 'name email')
      .exec();
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async upload(
    file: Express.Multer.File,
    uploadedBy: string,
    folder?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    // Determine subfolder
    const subFolder = folder || this.getAutoFolder(file.mimetype);
    const targetDir = path.join(this.uploadDir, subFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, safeName);
    fs.writeFileSync(filePath, file.buffer);

    const url = `${this.baseUrl}/uploads/${subFolder}/${safeName}`;
    let thumbnail: string | undefined;
    let dimensions: { width: number; height: number } | undefined;

    // Attempt image processing with sharp if available
    if (file.mimetype.startsWith('image/')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sharp = require('sharp');
        const metadata = await sharp(file.buffer).metadata();
        dimensions = { width: metadata.width || 0, height: metadata.height || 0 };

        const thumbName = `thumb_${safeName.replace(ext, '.webp')}`;
        const thumbPath = path.join(targetDir, thumbName);
        await sharp(file.buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(thumbPath);
        thumbnail = `${this.baseUrl}/uploads/${subFolder}/${thumbName}`;
      } catch {
        // sharp not installed; skip thumbnail generation
      }
    }

    return this.mediaModel.create({
      filename: safeName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      thumbnail,
      folder: subFolder,
      dimensions,
      uploadedBy: new Types.ObjectId(uploadedBy),
    });
  }

  async uploadBatch(
    files: Express.Multer.File[],
    uploadedBy: string,
    folder?: string,
  ) {
    return Promise.all(files.map((f) => this.upload(f, uploadedBy, folder)));
  }

  async update(id: string, dto: UpdateMediaDto) {
    const media = await this.mediaModel.findById(id).exec();
    if (!media) throw new NotFoundException('Media not found');
    Object.assign(media, dto);
    return media.save();
  }

  async delete(id: string) {
    const media = await this.mediaModel.findById(id).exec();
    if (!media) throw new NotFoundException('Media not found');

    // Remove file from disk
    const filePath = path.join(this.uploadDir, media.folder || '', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (media.thumbnail) {
      const thumbFile = path.basename(media.thumbnail);
      const thumbPath = path.join(this.uploadDir, media.folder || '', thumbFile);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    await media.deleteOne();
    return { deleted: true };
  }

  async createFolder(folderPath: string) {
    const fullPath = path.join(this.uploadDir, folderPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return { path: folderPath, created: true };
  }

  async getFolders() {
    // Return distinct folder values from media collection
    return this.mediaModel.distinct('folder').exec();
  }

  private getAutoFolder(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType === 'application/pdf') return 'documents';
    return 'files';
  }
}
