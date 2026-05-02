import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class SettingsSchema {
  @Prop({ default: 'E-Library' })
  siteName!: string;

  @Prop({ unique: true, default: 'system_config' })
  slug!: string;

  @Prop({ default: null })
  logoUrl!: string;

  @Prop({ default: null })
  welcomeVideoUrl!: string;
}

export const settingsSchema = SchemaFactory.createForClass(SettingsSchema);