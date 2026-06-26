import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicController } from './public.controller';
import { DepartmentSchema } from '../schemas/department.schema';
import { ContentSchema } from '../schemas/content.schema';
import { UserSchema } from '../schemas/user.schema';
import { RoleSchema } from '../schemas/role.schema';
import { Surat, SuratSchema } from '../schemas/surat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Department', schema: DepartmentSchema },
      { name: 'Content', schema: ContentSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: Surat.name, schema: SuratSchema },
    ]),
  ],
  controllers: [PublicController],
})
export class PublicModule {}
