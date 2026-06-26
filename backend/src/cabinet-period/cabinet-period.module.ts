import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CabinetPeriodService } from './cabinet-period.service';
import { CabinetPeriodController } from './cabinet-period.controller';
import { CabinetPeriod, CabinetPeriodSchema } from '../schemas/cabinet-period.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CabinetPeriod.name, schema: CabinetPeriodSchema },
    ]),
  ],
  controllers: [CabinetPeriodController],
  providers: [CabinetPeriodService],
  exports: [CabinetPeriodService],
})
export class CabinetPeriodModule {}
