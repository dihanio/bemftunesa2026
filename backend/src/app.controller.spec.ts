import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { getConnectionToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: { readyState: 1 },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: async () => 'ok',
            set: async () => {},
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return healthy status', async () => {
      const result = await appController.healthCheck();
      expect(result.data.status).toBe('healthy');
      expect(result.data.server).toBe('running');
      expect(result.data.database).toBe('connected');
    });
  });
});
