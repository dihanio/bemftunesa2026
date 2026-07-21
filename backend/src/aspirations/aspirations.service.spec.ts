import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AspirationsService } from './aspirations.service';
import { Aspiration } from '../schemas/aspiration.schema';

describe('AspirationsService', () => {
  let service: AspirationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AspirationsService,
        {
          provide: getModelToken(Aspiration.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AspirationsService>(AspirationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
