import { Test, TestingModule } from '@nestjs/testing';
import { AspirationsController } from './aspirations.controller';
import { AspirationsService } from './aspirations.service';

describe('AspirationsController', () => {
  let controller: AspirationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AspirationsController],
      providers: [
        {
          provide: AspirationsService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AspirationsController>(AspirationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
