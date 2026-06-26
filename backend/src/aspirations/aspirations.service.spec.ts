import { Test, TestingModule } from '@nestjs/testing';
import { AspirationsService } from './aspirations.service';

describe('AspirationsService', () => {
  let service: AspirationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AspirationsService],
    }).compile();

    service = module.get<AspirationsService>(AspirationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
