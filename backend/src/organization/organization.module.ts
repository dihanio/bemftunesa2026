import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentController } from './department.controller';
import { UserController } from './user.controller';
import { DepartmentSchema } from '../schemas/department.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RoleSchema } from '../schemas/role.schema';

import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Department', schema: DepartmentSchema },
      { name: User.name, schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
    ]),
  ],
  controllers: [DepartmentController, UserController],
  providers: [UserService],
  exports: [UserService],
})
export class OrganizationModule {}
