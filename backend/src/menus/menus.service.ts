import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, MenuDocument } from '../schemas/menu.schema';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectModel(Menu.name)
    private menuModel: Model<MenuDocument>,
  ) {}

  async findAll() {
    return this.menuModel.find().sort({ name: 1 }).exec();
  }

  async findBySlug(slug: string) {
    const menu = await this.menuModel.findOne({ slug }).exec();
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async findById(id: string) {
    const menu = await this.menuModel.findById(id).exec();
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async create(dto: CreateMenuDto) {
    const existing = await this.menuModel.findOne({ slug: dto.slug }).exec();
    if (existing) throw new BadRequestException('Menu slug already exists');
    return this.menuModel.create(dto);
  }

  async update(id: string, dto: UpdateMenuDto) {
    const menu = await this.menuModel.findById(id).exec();
    if (!menu) throw new NotFoundException('Menu not found');
    Object.assign(menu, dto);
    return menu.save();
  }

  async delete(id: string) {
    const menu = await this.menuModel.findById(id).exec();
    if (!menu) throw new NotFoundException('Menu not found');
    await menu.deleteOne();
    return { deleted: true };
  }
}
