import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(CACHE_MANAGER) private cacheManager: any,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Cek status infrastruktur server (Server/DB/Redis)',
  })
  async healthCheck() {
    const mongoStatus =
      this.mongoConnection.readyState === 1 ? 'connected' : 'disconnected';

    let redisStatus = 'disconnected';
    try {
      await this.cacheManager.set('health-check', 'ok', 5000);
      const val = await this.cacheManager.get('health-check');
      redisStatus = val === 'ok' ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'error';
    }

    const allHealthy =
      mongoStatus === 'connected' && redisStatus === 'connected';

    return {
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        server: 'running',
        database: mongoStatus,
        redis: redisStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
