import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  process.on('warning', (warning) => {
    if (
      warning.name === 'DeprecationWarning' &&
      (warning.message.includes('url.parse') ||
        warning.message.includes('shell option true'))
    ) {
      return;
    }
    console.warn(warning);
  });

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept',
    credentials: false,
  });

  await app.listen(process.env.PORT ?? 3000,'0.0.0.0');
  console.log(`🚀 Server running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();