import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

@Controller('health')
export class HealthController {
  private redisClient: Redis.Redis | null = null;

  constructor(
    @InjectConnection() private connection: Connection,
    private configService: ConfigService,
  ) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    
    // Create a dedicated lightweight connection to check Redis health
    this.redisClient = new Redis.default({
      host,
      port,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  @Get()
  async checkHealth() {
    const start = Date.now();
    
    // 1. Check MongoDB
    let dbStatus = 'unhealthy';
    try {
      if (this.connection.readyState === 1) {
        dbStatus = 'healthy';
      }
    } catch (err) {
      dbStatus = 'unhealthy';
    }

    // 2. Check Redis
    let redisStatus = 'unhealthy';
    try {
      await this.redisClient?.connect();
      const pong = await this.redisClient?.ping();
      if (pong === 'PONG') {
        redisStatus = 'healthy';
      }
      await this.redisClient?.disconnect();
    } catch (err) {
      redisStatus = 'unhealthy';
    }

    // 3. Check Storage (local write/read check)
    let storageStatus = 'unhealthy';
    try {
      const uploadDir = this.configService.get<string>('UPLOAD_DIR', './public/uploads');
      const resolvedPath = path.resolve(uploadDir);
      
      if (!fs.existsSync(resolvedPath)) {
        fs.mkdirSync(resolvedPath, { recursive: true });
      }
      
      const testFile = path.join(resolvedPath, '.healthcheck');
      fs.writeFileSync(testFile, 'healthcheck_write_ok');
      const content = fs.readFileSync(testFile, 'utf8');
      if (content === 'healthcheck_write_ok') {
        storageStatus = 'healthy';
      }
      fs.unlinkSync(testFile);
    } catch (err) {
      storageStatus = 'unhealthy';
    }

    const duration = Date.now() - start;
    const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy' && storageStatus === 'healthy';

    return {
      success: isHealthy,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      services: {
        database: dbStatus,
        redis: redisStatus,
        storage: storageStatus,
      },
    };
  }
}
