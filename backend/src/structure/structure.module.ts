import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StructureController } from './structure.controller';
import { StructureService } from './structure.service';
import { DepartmentSchema } from '../schemas/department.schema';
import { UserSchema } from '../schemas/user.schema';
import { RoleSchema } from '../schemas/role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Department', schema: DepartmentSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
    ]),
  ],
  controllers: [StructureController],
  providers: [StructureService],
})
export class StructureModule {}
