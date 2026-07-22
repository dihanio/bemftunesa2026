import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '../schemas/organization.schema';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
  ) {}

  async findAll() {
    return this.orgModel.find().sort({ period: -1 }).exec();
  }

  async findActive() {
    return this.orgModel.findOne({ isActive: true }).exec();
  }

  async findById(id: string) {
    const org = await this.orgModel.findById(id).exec();
    if (!org) throw new NotFoundException('Periode organisasi tidak ditemukan');
    return org;
  }

  async create(dto: {
    name: string;
    period: string;
    vision?: string;
    missions?: string[];
  }) {
    return this.orgModel.create(dto);
  }

  async update(id: string, dto: Partial<Organization>) {
    const org = await this.findById(id);
    Object.assign(org, dto);
    return org.save();
  }
}
