import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({ timestamps: false })
export class ReportSchema{
  @Prop({ required: true })
  userId!: string;

  @Prop()
  bookId?: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop()
  details?: string;
}
export const reportSchema = SchemaFactory.createForClass(ReportSchema);
@Schema({ timestamps: false })
export class ReportBooKSchema {
  @Prop({ required: true })
  userId!: string;

  @Prop()
  bookId?: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop()
  details?: string;
}
export const reportBookSchema = SchemaFactory.createForClass(ReportBooKSchema);