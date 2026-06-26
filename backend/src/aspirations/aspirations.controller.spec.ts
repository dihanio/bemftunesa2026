import { Test, TestingModule } from '@nestjs/testing';
import { AspirationsController } from './aspirations.controller';

describe('AspirationsController', () => {
  let controller: AspirationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AspirationsController],
    }).compile();

    controller = module.get<AspirationsController>(AspirationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
