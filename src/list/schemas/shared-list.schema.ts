import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SharedListDocument = SharedList & Document;

export enum ShareStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

// Removed ShareMethod enum since we're just generating links

@Schema({ timestamps: true })
export class SharedList {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'List' })
  listId: string;

  @Prop({ required: true })
  ownerId: string; // User who owns the list

  @Prop({ required: true })
  sharedWithId: string; // User ID if registered, or phone/email if not registered

  @Prop()
  sharedWithContact: string; // Optional: can be added when user accepts

  @Prop({ required: true, enum: ShareStatus, default: ShareStatus.PENDING })
  status: ShareStatus;

  @Prop()
  invitationToken: string; // For unregistered users

  @Prop()
  invitationExpiry: Date; // When invitation expires

  @Prop()
  acceptedAt: Date;

  @Prop()
  declinedAt: Date;

  @Prop({ default: false })
  isActive: boolean; // Whether the sharing is currently active

  @Prop()
  message: string; // Custom message sent with the share

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SharedListSchema = SchemaFactory.createForClass(SharedList);

// Indexes for better query performance
SharedListSchema.index({ listId: 1, sharedWithId: 1 });
SharedListSchema.index({ ownerId: 1, status: 1 });
SharedListSchema.index({ invitationToken: 1 });
SharedListSchema.index({ sharedWithContact: 1 }); 