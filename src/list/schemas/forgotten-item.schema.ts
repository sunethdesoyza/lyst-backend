import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ForgottenItemDocument = ForgottenItem & Document;

@Schema({ timestamps: true, collection: 'forgotten-items' })
export class ForgottenItem extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  quantity: string;

  @Prop()
  notes: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  originalListId: string;

  @Prop({ required: true })
  originalListName: string;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ForgottenItemSchema = SchemaFactory.createForClass(ForgottenItem); 