import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserInvitationDocument = UserInvitation & Document;

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class UserInvitation {
  @Prop({ required: true, unique: true })
  invitationToken: string;

  @Prop({ required: true })
  contact: string; // Phone number or email

  @Prop({ required: true, enum: ['PHONE', 'EMAIL'] })
  contactType: string;

  @Prop({ required: true })
  invitedBy: string; // User ID who sent the invitation

  @Prop({ required: true, enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  acceptedAt: Date;

  @Prop()
  userId: string; // User ID after registration

  @Prop()
  message: string; // Custom invitation message

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserInvitationSchema = SchemaFactory.createForClass(UserInvitation);

// Indexes for better query performance
UserInvitationSchema.index({ invitationToken: 1 });
UserInvitationSchema.index({ contact: 1, contactType: 1 });
UserInvitationSchema.index({ invitedBy: 1, status: 1 });
UserInvitationSchema.index({ expiresAt: 1 }); 