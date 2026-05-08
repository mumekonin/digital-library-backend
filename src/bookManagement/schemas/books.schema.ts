import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class BooksSchema {
  @Prop()
  title!: string;
  @Prop()
  author!: string;
  @Prop()
  description!: string;

  @Prop() 
  category!:string;

  @Prop()
  filePath?: string;
  @Prop()
  fileType?: string; // pdf, epub
  @Prop()
  fileSize?: number; // bytes
  @Prop()
  createdAt?: Date;
  @Prop()
  updatedAt?: Date;
  @Prop()
  fileHash?: string;
  @Prop()
  downloadUrl?: string;
  @Prop()
  readUrl?: string;
  @Prop()
  coverPath?: string;
  @Prop()
  coverType?: string;
  @Prop()
  coverSize?: number;
}
export const bookSchema = SchemaFactory.createForClass(BooksSchema);

@Schema({ timestamps: true }) // This automatically handles createdAt and updatedAt
export class CategorySchema{
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ required: true })
  description!: string;
}
export const categorySchema = SchemaFactory.createForClass(CategorySchema);