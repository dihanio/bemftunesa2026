import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { CleanLogger } from './common/utils/clean-logger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { requestLoggingMiddleware } from './common/middleware/request-logging.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CleanLogger(),
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(requestLoggingMiddleware);

  // CORS
  const configuredOrigins = (configService.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaultOrigins = [
    'https://bemftunesa.org',
    'https://www.bemftunesa.org',
    'https://ims.bemftunesa.org',
    'https://or.bemftunesa.org',
    'https://shop.bemftunesa.org',
    'https://pkkmb.bemftunesa.org',
  ];
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3004',
    'http://127.0.0.1:3005',
  ];
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const allowedOrigins =
    configuredOrigins.length > 0
      ? configuredOrigins
      : nodeEnv === 'production'
        ? defaultOrigins
        : [...defaultOrigins, ...devOrigins];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') || 3001;
  const config = new DocumentBuilder()
    .setTitle('API Backend BEM FT UNESA 2026')
    .setDescription('Satu API backend terpusat untuk ekosistem BEM FT UNESA')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(port);


  console.log(`
  \x1b[35mâ”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”\x1b[0m
  \x1b[35mâ”‚\x1b[0m                                                          \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”‚\x1b[0m   \x1b[1;35mBEM FT UNESA - API GATEWAY\x1b[0m   \x1b[90mv1.0\x1b[0m                    \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”‚\x1b[0m   \x1b[90m"Integrity & Innovation"\x1b[0m                               \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”‚\x1b[0m                                                          \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤\x1b[0m
  \x1b[35mâ”‚\x1b[0m                                                          \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”‚\x1b[0m   \x1b[32mStatus:\x1b[0m   \x1b[1mREADY\x1b[0m                                       \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”‚\x1b[0m   \x1b[34mLocal:\x1b[0m    \x1b[4mhttp://localhost:${port}/api/v1\x1b[0m           \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”‚\x1b[0m   \x1b[34mSwagger:\x1b[0m  \x1b[4mhttp://localhost:${port}/api/v1/docs\x1b[0m      \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ”‚\x1b[0m                                                          \x1b[35mâ”‚\x1b[0m
  \x1b[35mâ””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜\x1b[0m
  `);
}
bootstrap(); // Watcher rebuild trigger
