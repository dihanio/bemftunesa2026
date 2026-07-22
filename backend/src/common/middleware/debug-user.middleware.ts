/**
 * Debug script to check what's in the JWT payload and request user object
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type CustomUser = {
  role?: { slug?: string };
  activeRoleId?: string;
  [key: string]: unknown;
};

@Injectable()
export class DebugUserMiddleware implements NestMiddleware {
  private readonly logger = new Logger('DebugUserMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.includes('/ims/audit')) {
      this.logger.log('=== DEBUG REQUEST TO /ims/audit ===');
      const reqUser = (req as unknown as { user?: CustomUser }).user;
      this.logger.log('User object:', JSON.stringify(reqUser, null, 2));
      this.logger.log('Has user:', !!reqUser);
      this.logger.log('Has user.role:', !!reqUser?.role);
      this.logger.log('Has user.role.slug:', !!reqUser?.role?.slug);
      this.logger.log('user.role value:', reqUser?.role);
      this.logger.log('user.activeRoleId:', reqUser?.activeRoleId);
      this.logger.log('===================================');
    }
    next();
  }
}
