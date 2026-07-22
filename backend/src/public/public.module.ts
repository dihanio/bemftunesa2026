import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicController } from './public.controller';
import { DepartmentSchema } from '../schemas/department.schema';
import { UserSchema } from '../schemas/user.schema';
import { RoleSchema } from '../schemas/role.schema';
import { ProgramSchema } from '../schemas/program.schema';
import { AspirationSchema } from '../schemas/aspiration.schema';
import { Contact, ContactSchema } from '../schemas/contact.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Department', schema: DepartmentSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'Program', schema: ProgramSchema },
      { name: 'Aspiration', schema: AspirationSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [PublicController],
})
export class PublicModule {}
