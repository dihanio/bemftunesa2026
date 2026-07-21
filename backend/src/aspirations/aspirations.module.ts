import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AspirationsService } from './aspirations.service';
import { AspirationsController } from './aspirations.controller';
import { Aspiration, AspirationSchema } from '../schemas/aspiration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Aspiration.name, schema: AspirationSchema },
    ]),
  ],
  controllers: [AspirationsController],
  providers: [AspirationsService],
  exports: [AspirationsService],
})
export class AspirationsModule {}
