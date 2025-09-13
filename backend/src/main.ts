import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { BaseModule } from './base.module';
import { secrets } from './config/secrets';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(BaseModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sky-S API')
    .setDescription('API documentation for the Sky-S application')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);
  
  app.enableCors();
  app.enableVersioning();
  app.setGlobalPrefix('api');
  
  await app.listen(secrets.Port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
