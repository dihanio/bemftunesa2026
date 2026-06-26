import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsService } from './permissions.service';
import { Permission, PermissionSchema } from '../schemas/permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
