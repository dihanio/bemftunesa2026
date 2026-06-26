import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from '../schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll() {
    return this.permissionModel.find().sort({ resource: 1, action: 1 }).exec();
  }

  async findByResource(resource: string) {
    return this.permissionModel.find({ resource }).exec();
  }

  async findByName(name: string) {
    return this.permissionModel.findOne({ name }).exec();
  }
}
