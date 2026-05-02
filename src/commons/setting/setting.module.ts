import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { settingsSchema, SettingsSchema } from './schema/setting.schema';
import { SettingsController } from './controller/setting.controller';
import { SettingService } from './service/setting.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SettingsSchema.name, schema:settingsSchema}]),CloudinaryModule
  ],
  controllers: [SettingsController],
  providers: [SettingService],
})
export class SettingsModule {}