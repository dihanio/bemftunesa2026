import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Article } from '../database/schema/articles';
import { Aspiration } from '../database/schema/aspiration';
import { GalleryAlbum, GalleryPhoto } from '../database/schema/gallery';
import { Proker } from '../database/schema/proker';
import { Event } from '../database/schema/proker';
import { BEMDocument } from '../database/schema/documents';
import { User, Department } from '../database/schema/users';
import { SiteSetting } from '../database/schema/core';
import {
  escapeRegex,
  paginate,
  parsePaginationQuery,
} from '../common/helpers/pagination.helper';
import {
  ListArticlesQueryDto,
  ListProkerQueryDto,
  ListEventsQueryDto,
  ListGalleryQueryDto,
  CreateAspirationDto,
} from './public.dto';

@Injectable()
export class PublicService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(Aspiration.name) private aspirationModel: Model<Aspiration>,
    @InjectModel(GalleryAlbum.name)
    private galleryAlbumModel: Model<GalleryAlbum>,
    @InjectModel(GalleryPhoto.name)
    private galleryPhotoModel: Model<GalleryPhoto>,
    @InjectModel(Proker.name) private prokerModel: Model<Proker>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(BEMDocument.name) private documentModel: Model<BEMDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    @InjectModel(SiteSetting.name) private siteSettingModel: Model<SiteSetting>,
    @Inject(CACHE_MANAGER) private cacheManager: any,
  ) {}

  async getSettings() {
    const settings = await this.siteSettingModel.find({
      key: { $in: ['maintenanceMode', 'publicAspirationFlow'] }
    });
    
    const flags = {
      maintenanceMode: false,
      publicAspirationFlow: true,
    };
    
    settings.forEach(s => {
      if (s.key in flags) {
        (flags as any)[s.key] = s.value;
      }
    });

    return { data: flags };
  }

  private getPaginationConfig(query: any, defaultSortBy: string) {
    const options = parsePaginationQuery(query ?? {});
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const sortBy: string = query?.sortBy || defaultSortBy;
    const sortOrder: 1 | -1 = options.sortOrder === 'asc' ? 1 : -1;

    return {
      page,
      limit,
      sortBy,
      sortOrder,
      search: options.search,
    };
  }

  private buildSearchFilter(
    search: string | undefined,
    searchFields: string[],
  ) {
    if (!search || searchFields.length === 0) {
      return {};
    }

    const escapedSearch = escapeRegex(search);
    return {
      $or: searchFields.map((field) => ({
        [field]: { $regex: escapedSearch, $options: 'i' },
      })),
    };
  }

  private buildMeta(page: number, limit: number, totalDocs: number) {
    return {
      page,
      limit,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
    };
  }

  private getTimestampFromDoc(doc: { createdAt?: Date; _id?: unknown }) {
    if (doc.createdAt) {
      return new Date(doc.createdAt);
    }

    if (
      doc._id &&
      typeof doc._id === 'object' &&
      'getTimestamp' in doc._id &&
      typeof doc._id.getTimestamp === 'function'
    ) {
      return doc._id.getTimestamp();
    }

    return undefined;
  }

  private formatArticle(article: any) {
    const publishedAt = this.getTimestampFromDoc(article);

    return {
      _id: String(article._id),
      slug: article.slug,
      title: article.title,
      content: article.content,
      thumbnailUrl: article.thumbnailUrl,
      category: article.category,
      date: publishedAt?.toISOString(),
      author: article.authorId?.name || 'BEM FT UNESA',
    };
  }

  private normalizeProkerStatus(status: string | undefined) {
    switch (status) {
      case 'Active':
      case 'In Progress':
        return 'Ongoing';
      case 'Event Finished':
      case 'LPJ Revision':
      case 'LPJ Approved':
      case 'Completed':
        return 'Completed';
      case 'Archived':
        return 'Archived';
      case 'Cancelled':
        return 'Cancelled';
      default:
        return 'Upcoming';
    }
  }

  private formatProker(proker: any) {
    return {
      _id: String(proker._id),
      slug: proker.slug,
      title: proker.title,
      description: proker.description,
      status: this.normalizeProkerStatus(proker.status),
      startDate: proker.startDate
        ? new Date(proker.startDate).toISOString()
        : undefined,
      endDate: proker.endDate
        ? new Date(proker.endDate).toISOString()
        : undefined,
      progress: proker.progress ?? 0,
      departmentId: proker.departmentId
        ? {
            _id: String(proker.departmentId._id ?? proker.departmentId),
            name: proker.departmentId.name ?? 'BEM FT UNESA',
            code: proker.departmentId.code,
          }
        : undefined,
      pjId: proker.pjId
        ? {
            _id: String(proker.pjId._id ?? proker.pjId),
            name: proker.pjId.name,
            avatar: proker.pjId.avatar,
          }
        : undefined,
    };
  }

  private formatTimeRange(startTime: Date, endTime: Date) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${formatter.format(new Date(startTime))} - ${formatter.format(
      new Date(endTime),
    )}`;
  }

  private getEventStatus(startTime: Date, endTime: Date) {
    const now = new Date();

    if (new Date(endTime) < now) {
      return 'Completed';
    }

    if (new Date(startTime) <= now) {
      return 'Ongoing';
    }

    return 'Upcoming';
  }

  private formatEvent(event: any) {
    return {
      _id: String(event._id),
      title: event.title,
      description: event.description || '',
      date: new Date(event.startTime).toISOString(),
      time: this.formatTimeRange(event.startTime, event.endTime),
      location: event.location || 'TBA',
      status: this.getEventStatus(event.startTime, event.endTime),
      type: 'Event',
    };
  }

  // --- Articles ---

  async listArticles(query: ListArticlesQueryDto) {
    const cacheKey = `public:articles:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const { page, limit, sortBy, sortOrder, search } = this.getPaginationConfig(
      query,
      '_id',
    );
    const filter = {
      status: 'Published',
      deletedAt: null,
      ...this.buildSearchFilter(search, ['title', 'content']),
    };

    const [articles, totalDocs] = await Promise.all([
      this.articleModel
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'name avatar')
        .lean()
        .exec(),
      this.articleModel.countDocuments(filter),
    ]);

    const result = {
      data: articles.map((article) => this.formatArticle(article)),
      meta: this.buildMeta(page, limit, totalDocs),
    };

    await this.cacheManager.set(cacheKey, result, 60000); // 1 min cache
    return result;
  }

  async getArticleBySlug(slug: string) {
    const article = await this.articleModel
      .findOne({ slug, status: 'Published', deletedAt: null })
      .populate('authorId', 'name avatar')
      .lean();
    if (!article) throw new NotFoundException('Artikel tidak ditemukan');
    return { data: this.formatArticle(article) };
  }

  // --- Proker ---

  async listProker(query: ListProkerQueryDto) {
    const cacheKey = `public:proker:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const { page, limit, sortBy, sortOrder, search } = this.getPaginationConfig(
      query,
      'startDate',
    );
    const filter = {
      deletedAt: null,
      ...this.buildSearchFilter(search, ['title', 'description']),
    };

    const [prokers, totalDocs] = await Promise.all([
      this.prokerModel
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('departmentId', 'name code')
        .lean()
        .exec(),
      this.prokerModel.countDocuments(filter),
    ]);

    const result = {
      data: prokers.map((proker) => this.formatProker(proker)),
      meta: this.buildMeta(page, limit, totalDocs),
    };

    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  async getProkerBySlug(slug: string) {
    const proker = await this.prokerModel
      .findOne({ slug, deletedAt: null })
      .populate('departmentId', 'name code')
      .populate('pjId', 'name avatar')
      .lean();
    if (!proker) throw new NotFoundException('Program kerja tidak ditemukan');
    return { data: this.formatProker(proker) };
  }

  // --- Structure ---

  async getStructure() {
    const cacheKey = 'public:structure';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const departments = await this.departmentModel
      .find({ deletedAt: null })
      .populate('headId', 'name avatar role')
      .lean();

    const bpiUsers = await this.userModel
      .find({
        role: { $in: ['Super Admin', 'Sekretaris', 'Bendahara'] },
        isActive: true,
        deletedAt: null,
      })
      .select('name email role avatar departmentId')
      .lean();

    const activeMembers = await this.userModel
      .find({
        isActive: true,
        deletedAt: null,
        role: { $nin: ['Guest', 'Admin Sistem'] },
      })
      .select('name email role avatar departmentId nim')
      .lean();

    const result = {
      data: {
        bpi: bpiUsers,
        departments,
        members: activeMembers,
      },
    };

    await this.cacheManager.set(cacheKey, result, 300000); // 5 min cache
    return result;
  }

  // --- Events ---

  async listEvents(query: ListEventsQueryDto) {
    const cacheKey = `public:events:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const paginationQuery = { ...query };
    if (paginationQuery.limit === undefined) {
      paginationQuery.limit = 100; // Limit default yang besar untuk kalender publik
    }

    const { page, limit, sortBy, sortOrder, search } = this.getPaginationConfig(
      paginationQuery,
      'startTime',
    );

    // 1. Filter untuk model Event
    const eventFilter = {
      isPublic: true,
      deletedAt: null,
      ...this.buildSearchFilter(search, ['title', 'description']),
    };

    // 2. Filter untuk model Proker (sebagai pelengkap agenda strategis)
    const prokerFilter = {
      startDate: { $ne: null },
      deletedAt: null,
      status: { $ne: 'Cancelled' },
      ...this.buildSearchFilter(search, ['title', 'description']),
    };

    // 3. Ambil data secara paralel dari database
    const [rawEvents, rawProkers] = await Promise.all([
      this.eventModel.find(eventFilter).lean().exec(),
      this.prokerModel.find(prokerFilter).lean().exec(),
    ]);

    // 4. Format data Event
    const formattedEvents = rawEvents.map((event) => this.formatEvent(event));

    // 5. Format data Proker menjadi agenda terintegrasi
    const formattedProkers = rawProkers.map((proker: any) => {
      const startTime = new Date(proker.startDate);
      const endTime = proker.endDate ? new Date(proker.endDate) : startTime;

      return {
        _id: String(proker._id),
        title: proker.title,
        description: proker.description || '',
        date: startTime.toISOString(),
        time: this.formatTimeRange(startTime, endTime),
        location: proker.location || 'Fakultas Teknik UNESA',
        status: this.getEventStatus(startTime, endTime),
        type: 'Proker',
      };
    });

    // 6. Gabungkan semua agenda publik
    const allEvents = [...formattedEvents, ...formattedProkers];

    // 7. Urutkan berdasarkan waktu mulai (secara kronologis, default: ascending/maju)
    const effectiveSortOrder = query?.sortOrder === 'desc' ? -1 : 1;
    allEvents.sort((a: any, b: any) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return effectiveSortOrder === 1 ? timeA - timeB : timeB - timeA;
    });

    // 8. Terapkan paginasi di memori
    const totalDocs = allEvents.length;
    const startIndex = (page - 1) * limit;
    const paginatedEvents = allEvents.slice(startIndex, startIndex + limit);

    const result = {
      data: paginatedEvents,
      meta: this.buildMeta(page, limit, totalDocs),
    };

    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  // --- Gallery ---

  async listGallery(query: ListGalleryQueryDto) {
    const options = parsePaginationQuery(query);
    return paginate(this.galleryAlbumModel, {}, options, ['title']);
  }

  async getGalleryAlbum(id: string) {
    const album = await this.galleryAlbumModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!album) throw new NotFoundException('Album tidak ditemukan');

    const photos = await this.galleryPhotoModel.find({ albumId: id });
    return { data: { album, photos } };
  }

  // --- Stats ---

  async getStats() {
    const cacheKey = 'public:stats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const departments = await this.departmentModel.countDocuments({
      deletedAt: null,
    });
    const members = await this.userModel.countDocuments({
      isActive: true,
      deletedAt: null,
      role: { $nin: ['Guest', 'Admin Sistem'] },
    });
    const proker = await this.prokerModel.countDocuments({ deletedAt: null });

    // Using simple find/count for aspirations
    const aspirationsTotal = await this.aspirationModel.countDocuments();
    const aspirationsPending = await this.aspirationModel.countDocuments({
      status: { $in: ['Pending', 'Reviewed'] },
    });
    const aspirationsResolved = await this.aspirationModel.countDocuments({
      status: 'Done',
    });

    const result = {
      data: {
        departments,
        members,
        proker,
        aspirations: {
          total: aspirationsTotal,
          pending: aspirationsPending,
          resolved: aspirationsResolved,
        },
      },
    };

    await this.cacheManager.set(cacheKey, result, 300000); // 5 min cache
    return result;
  }

  // --- Aspirations ---

  async submitAspiration(data: CreateAspirationDto) {
    const aspiration = await this.aspirationModel.create(data);
    return {
      data: { id: aspiration._id },
      message: 'Aspirasi berhasil dikirim',
    };
  }

  async getAspirationStatus(id: string) {
    const aspiration = await this.aspirationModel
      .findById(id)
      .select('status category createdAt');
    if (!aspiration) throw new NotFoundException('Aspirasi tidak ditemukan');
    return { data: aspiration };
  }

  // --- Document Verify ---

  async verifyDocument(uuid: string) {
    const doc = await this.documentModel
      .findOne({ qrUuid: uuid, deletedAt: null })
      .select('title type documentNumber status signedAt')
      .populate('signedById', 'name role')
      .lean();

    if (!doc) {
      return {
        data: {
          status: 'Invalid',
          message: 'Dokumen tidak ditemukan atau tidak valid',
        },
      };
    }

    return {
      data: {
        status: doc.status === 'Approved' ? 'Valid' : 'Pending',
        documentNumber: doc.documentNumber,
        title: doc.title,
        type: doc.type,
        signedAt: doc.signedAt,
        signedBy: doc.signedById,
      },
    };
  }
}
