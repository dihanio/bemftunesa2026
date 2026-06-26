import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security — disable CSP in dev so Swagger UI works
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );

  const frontendUrl = configService.get<string>('FRONTEND_URL') as string;
  const imsUrl = configService.get<string>('IMS_URL') as string;

  app.enableCors({
    origin: [frontendUrl, imsUrl],
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
  app.useWebSocketAdapter(new IoAdapter(app));

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
      .addTag('users', 'User management')
      .addTag('roles', 'Role management')
      .addTag('permissions', 'Permission management')
      .addTag('contents', 'News, Announcements, Pages, Services')
      .addTag('events', 'Event management')
      .addTag('departments', 'Department / Kementerian management')
      .addTag('media', 'Media library & file uploads')
      .addTag('menus', 'Navigation menu management')
      .addTag('settings', 'Site settings & Homepage Builder')
      .addTag('audit-logs', 'Audit log viewer')
      .addTag('partners', 'Partner & Sponsor management')
      .addTag('recruitment', 'Open Recruitment management')
      .addTag('gallery', 'Gallery album management')
      .build();



    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    console.log(`📖 Swagger UI: http://localhost:${configService.get<number>('PORT', 4000)}/api/docs`);
  }

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`🚀 BEM FT UNESA CMS API running on http://localhost:${port}/api/v1`);
}

bootstrap();
