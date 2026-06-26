import { Test, TestingModule } from '@nestjs/testing';
import { CabinetPeriodController } from './cabinet-period.controller';

describe('CabinetPeriodController', () => {
  let controller: CabinetPeriodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CabinetPeriodController],
    }).compile();

    controller = module.get<CabinetPeriodController>(CabinetPeriodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
