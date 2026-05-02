import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingsSchema } from '../schema/setting.schema';

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(SettingsSchema.name)
    private readonly settingsModel: Model<SettingsSchema>,
  ) {}

  async getSettings() {
    let settings = await this.settingsModel.findOne({ slug: 'system_config' }).exec();
    if (!settings) {
      settings = await this.settingsModel.create({ slug: 'system_config' });
    }
    return settings;
  }

  async updateSettings(data: Partial<SettingsSchema>) {
    return this.settingsModel.findOneAndUpdate(
      { slug: 'system_config' },
      { $set: data },
      { upsert: true, new: true },
    );
  }
}