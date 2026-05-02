import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
@Schema({ timestamps: true })
export class BookCatalog {
  @Prop({ required: true })
  title!: string;
  @Prop({ required: true })
  author!: string;
  @Prop()
  category!: string;
  @Prop({ required: true })
  floorNumber!: number;
  @Prop({ required: true })
  section!: string;
  @Prop({ required: true })
  shelfNumber!: string;
 @Prop({ required: true })
  totalCopies!: number;
  @Prop({ required: true, min: 0 })
  availableCopies!: number;
  @Prop()
  borrowUrl!: string;
}
export const bookCatalogSchema = SchemaFactory.createForClass(BookCatalog);
@Schema({ timestamps: true })
export class Borrow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BookCatalog', required: true })
  bookCatalogId!: Types.ObjectId;

  @Prop({ default: false })
  returned!: boolean;

  @Prop()
  borrowDate!: Date;

  @Prop()
  returnDate!: Date;                  
  @Prop({ default: null })
  actualReturnDate!: Date;             
  @Prop({
    type: String,
    enum: ['borrowed', 'return_requested', 'returned'],
    default: 'borrowed'
  })
  status!: string;                  
}
export const borrowSchema = SchemaFactory.createForClass(Borrow); 
