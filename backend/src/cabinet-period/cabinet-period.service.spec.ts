import { Test, TestingModule } from '@nestjs/testing';
import { CabinetPeriodService } from './cabinet-period.service';

describe('CabinetPeriodService', () => {
  let service: CabinetPeriodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CabinetPeriodService],
    }).compile();

    service = module.get<CabinetPeriodService>(CabinetPeriodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
