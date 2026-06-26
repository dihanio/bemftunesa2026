import { Module, Global } from '@nestjs/common';
import { NotificationEngineService } from './notification-engine.service';

@Global()
@Module({
  providers: [NotificationEngineService],
  exports: [NotificationEngineService],
})
export class NotificationEngineModule {}
