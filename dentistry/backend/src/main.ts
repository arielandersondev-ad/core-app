import { env } from './config/env.js'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks()
  app.enableCors({
    origin: env.frontendOrigins,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = env.port;
  await app.listen(port, '0.0.0.0');
  console.log(`[Dentistry Backend] Server running at http://localhost:${port}`);
}
void bootstrap();
