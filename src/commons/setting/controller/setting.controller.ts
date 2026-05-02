import {
  Controller, Post, Get,
  UseInterceptors, UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SettingService } from '../service/setting.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo',  maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        fileFilter: (req, file, cb) => {
          const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
          const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

          if (file.fieldname === 'logo' && imageTypes.includes(file.mimetype)) {
            cb(null, true);
          } else if (file.fieldname === 'video' && videoTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                file.fieldname === 'logo'
                  ? 'Logo must be JPEG, PNG, WebP or SVG'
                  : 'Video must be MP4, WebM or OGG',
              ),
              false,
            );
          }
        },
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB covers both logo and video
        },
      },
    ),
  )
  async uploadAssets(
    @UploadedFiles() files: {
      logo?:  Express.Multer.File[];
      video?: Express.Multer.File[];
    },
  ) {
    if (!files?.logo && !files?.video) {
      throw new BadRequestException('Send at least a logo or video file');
    }

    const updates: { logoUrl?: string; welcomeVideoUrl?: string } = {};

    if (files.logo?.[0]) {
      updates.logoUrl = await this.cloudinaryService.uploadImage(
        files.logo[0], 'system/logos',
      );
    }

    if (files.video?.[0]) {
      updates.welcomeVideoUrl = await this.cloudinaryService.uploadVideo(
        files.video[0], 'system/videos',
      );
    }

    await this.settingsService.updateSettings(updates);

    return {
      message: 'Settings updated successfully',
      ...updates,
    };
  }
}