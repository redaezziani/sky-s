import { NestFactory } from '@nestjs/core';
import { BaseModule } from './base.module';
import { secrets } from './config/secrets';

async function bootstrap() {
  const app = await NestFactory.create(BaseModule);
  app.enableCors();
  app.enableVersioning();
  app.setGlobalPrefix('api');
  await app.listen(secrets.Port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
