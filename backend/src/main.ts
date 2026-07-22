import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { StructuredLogger } from './common/logger/structured-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new StructuredLogger(),
  });
  const configService = app.get(ConfigService);

  // Serve static assets (local fallback uploads)
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Cookie parser middleware (required for JWT authentication via cookies)
  app.use(cookieParser());

  // Security — disable CSP in dev so Swagger UI works
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );

  const frontendUrl = configService.get<string>('FRONTEND_URL') as string;
  const imsUrl = configService.get<string>('IMS_URL') as string;
  const pkkmbUrl =
    configService.get<string>('PKKMB_URL') || 'http://localhost:3002';

  app.enableCors({
    origin: (origin, callback) => {
      const staticOrigins = [frontendUrl, imsUrl, pkkmbUrl].filter(Boolean);
      if (
        !origin ||
        staticOrigins.includes(origin) ||
        /\.bemftunesa\.org$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('CORS Error: Origin not allowed'));
      }
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger / OpenAPI (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BEM FT UNESA — Public CMS API')
      .setDescription(
        'REST API untuk Content Management System website publik BEM Fakultas Teknik UNESA.\n\n' +
          '**Authentication**: Gunakan endpoint `/api/v1/auth/google` untuk login via Google OAuth, ' +
          'lalu salin `accessToken` dari response dan klik **Authorize** di atas.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentication via Google OAuth 2.0')
      .addTag('public', 'Public read endpoints for frontend')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    console.log(
      `📖 Swagger UI: http://localhost:${configService.get<number>('PORT', 4000)}/api/docs`,
    );
  }

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(
    `🚀 BEM FT UNESA CMS API running on http://localhost:${port}/api/v1`,
  );
}

bootstrap().catch((err) => console.error('Failed to bootstrap app:', err));
