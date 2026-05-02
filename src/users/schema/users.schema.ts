import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({ timestamps: true })
export class UsersSchema {
  @Prop()
  firstName!: string;
  @Prop()
  lastName!: string;
  @Prop()
  username!: string;
  @Prop()
  email!: string;
  @Prop()
  password!: string;
  @Prop({default:'student'})
  role!:string;
 @Prop({default:null,type:String})
  refreshToken!: string| null;
  @Prop({ default: null, type: String })
  resetToken!: string | null; 

  @Prop({ default: null, type: Date })
  resetTokenExpiry!: Date | null;
}
export const userSchema = SchemaFactory.createForClass(UsersSchema);
