import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Item, ItemSchema } from './item.schema';

export type ListDocument = List & Document;

export enum ArchivedReason {
  DELETED = 'DELETED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class List {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  expiryDate: Date;

  @Prop({ default: 'medium' })
  priority: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  color: string;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ 
    type: String,
    enum: ArchivedReason,
    default: null
  })
  archivedReason: ArchivedReason;

  @Prop({ type: [ItemSchema], default: [] })
  items: Item[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ListSchema = SchemaFactory.createForClass(List); 