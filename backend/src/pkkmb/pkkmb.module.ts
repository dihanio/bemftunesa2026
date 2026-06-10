import { Module } from '@nestjs/common';
import { PkkmbController } from './pkkmb.controller';
import { PkkmbService } from './pkkmb.service';

@Module({
  controllers: [PkkmbController],
  providers: [PkkmbService],
})
export class PkkmbModule {}
