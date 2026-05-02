import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/users.module';
import { BookManagementModule } from './bookManagement/bookManagement.module';
import { AccessManagementModule } from './accessManagement/accessManagement.module';
import { JwtStrategy } from './commons/guards/jwt.strategy';
import { ReportModule } from './reporting/report.module';
import { SettingsModule } from './commons/setting/setting.module';
import { AiAssistantModule } from './commons/ai-assistant/ai-assistant.module';
import { CloudinaryModule } from '@scwar/nestjs-cloudinary';
import dns from 'dns';
dns.setServers(["8.8.8.8","1.1.1.1"]);
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    // ── Mailer ────────────────────────────────
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host:   config.get<string>('MAIL_HOST'),
          port:   465,
          secure: true,
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"E-Library" <${config.get<string>('MAIL_USER')}>`,
        },
      }),
    }),

    SettingsModule,
    ReportModule,
    UserModule,
    AccessManagementModule,
    BookManagementModule,
    AiAssistantModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}