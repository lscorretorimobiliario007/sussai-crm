import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { resolveJwtSecret } from './common/utils/jwt-secret';
import { getUploadsRoot } from './common/utils/uploads-root';

async function bootstrap() {
  // Fail fast in production if JWT_SECRET is missing
  resolveJwtSecret();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(getUploadsRoot(), {
    prefix: '/uploads/',
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGIN must be set in production (comma-separated origins). Refusing to start with open CORS.',
    );
  }

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
