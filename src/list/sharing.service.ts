import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { List, ListDocument } from './schemas/list.schema';
import { SharedList, SharedListDocument, ShareStatus } from './schemas/shared-list.schema';
import { UserInvitation, UserInvitationDocument, InvitationStatus } from './schemas/user-invitation.schema';
import { ShareListDto, ShareListResponseDto, AcceptShareDto, AcceptShareResponseDto } from './dto/share-list.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);

  constructor(
    @InjectModel(List.name) private listModel: Model<ListDocument>,
    @InjectModel(SharedList.name) private sharedListModel: Model<SharedListDocument>,
    @InjectModel(UserInvitation.name) private userInvitationModel: Model<UserInvitationDocument>,
    private configService: ConfigService,
  ) {}

  async shareList(shareDto: ShareListDto, ownerId: string): Promise<ShareListResponseDto> {
    this.logger.debug(`Creating share link for list ${shareDto.listId}`);

    // Verify list exists and belongs to owner
    const list = await this.listModel.findById(shareDto.listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }
    if (list.userId !== ownerId) {
      throw new BadRequestException('You can only share your own lists');
    }

    // Check if already shared
    const existingShare = await this.sharedListModel.findOne({
      listId: shareDto.listId,
      ownerId,
      isActive: true,
    });

    if (existingShare) {
      // Update existing share
      await this.sharedListModel.findByIdAndUpdate(existingShare._id, {
        message: shareDto.message,
        updatedAt: new Date(),
      });
      
      const invitation = await this.userInvitationModel.findOne({
        invitationToken: existingShare.invitationToken,
      });

      return this.createShareResponse(existingShare._id.toString(), invitation.invitationToken);
    }

    // Create new share
    const invitation = await this.createUserInvitation(shareDto, ownerId);
    const share = await this.createSharedList(shareDto, ownerId, invitation);

    // Update list to mark as shared
    await this.listModel.findByIdAndUpdate(shareDto.listId, {
      isShared: true,
    });

    return this.createShareResponse(share._id.toString(), invitation.invitationToken);
  }

  private async createUserInvitation(
    shareDto: ShareListDto,
    ownerId: string,
  ): Promise<UserInvitationDocument> {
    const invitation = new this.userInvitationModel({
      invitationToken: uuidv4(),
      contact: '', // Will be filled when user accepts
      contactType: 'PHONE', // Default, will be updated
      invitedBy: ownerId,
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      message: shareDto.message,
    });

    return await invitation.save();
  }

  private async createSharedList(
    shareDto: ShareListDto,
    ownerId: string,
    invitation: UserInvitationDocument,
  ): Promise<SharedListDocument> {
    const share = new this.sharedListModel({
      listId: shareDto.listId,
      ownerId,
      sharedWithId: invitation.invitationToken,
      status: ShareStatus.PENDING,
      invitationToken: invitation.invitationToken,
      invitationExpiry: invitation.expiresAt,
      isActive: true,
      message: shareDto.message,
    });

    return await share.save();
  }

  private createShareResponse(shareId: string, invitationToken: string): ShareListResponseDto {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const sharingLink = `${frontendUrl}/shared/${invitationToken}`;
    
    return {
      success: true,
      message: 'List shared successfully',
      shareId,
      invitationToken,
      sharingLink,
      shareMessageTemplate: `Check out this list: ${sharingLink}`,
    };
  }

  async acceptShare(acceptDto: AcceptShareDto, userId: string): Promise<AcceptShareResponseDto> {
    this.logger.debug(`User ${userId} accepting share with token ${acceptDto.invitationToken}`);

    // Find the invitation
    const invitation = await this.userInvitationModel.findOne({
      invitationToken: acceptDto.invitationToken,
      status: InvitationStatus.PENDING,
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    // Find the associated share
    const share = await this.sharedListModel.findOne({
      invitationToken: acceptDto.invitationToken,
      status: ShareStatus.PENDING,
    });

    if (!share) {
      throw new NotFoundException('Share not found for this invitation');
    }

    // Update invitation status
    await this.userInvitationModel.findByIdAndUpdate(invitation._id, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
      userId,
    });

    // Update share status
    await this.sharedListModel.findByIdAndUpdate(share._id, {
      status: ShareStatus.ACCEPTED,
      acceptedAt: new Date(),
      sharedWithId: userId,
    });

    // Update list to include the new user
    await this.listModel.findByIdAndUpdate(share.listId, {
      $addToSet: { sharedWith: userId },
    });

    return {
      success: true,
      message: 'List shared successfully',
      listId: share.listId,
    };
  }

  async getSharedLists(userId: string): Promise<any[]> {
    // Get lists shared with this user
    const sharedLists = await this.sharedListModel
      .find({
        sharedWithId: userId,
        status: ShareStatus.ACCEPTED,
        isActive: true,
      })
      .populate('listId')
      .populate('ownerId')
      .exec();

    return sharedLists.map(share => ({
      shareId: share._id,
      list: share.listId,
      owner: share.ownerId,
      status: share.status,
      createdAt: share.createdAt,
      message: share.message,
    }));
  }

  async getMySharedLists(userId: string): Promise<any[]> {
    // Get lists that this user has shared with others
    const sharedLists = await this.sharedListModel
      .find({
        ownerId: userId,
        isActive: true,
      })
      .populate('listId')
      .populate('sharedWithId')
      .exec();

    return sharedLists.map(share => ({
      shareId: share._id,
      list: share.listId,
      sharedWith: share.sharedWithId,
      status: share.status,
      createdAt: share.createdAt,
      message: share.message,
    }));
  }

  async revokeShare(shareId: string, userId: string): Promise<void> {
    const share = await this.sharedListModel.findById(shareId);
    if (!share) {
      throw new NotFoundException('Share not found');
    }
    if (share.ownerId !== userId) {
      throw new BadRequestException('You can only revoke your own shares');
    }

    await this.sharedListModel.findByIdAndUpdate(shareId, {
      isActive: false,
      status: ShareStatus.EXPIRED,
    });

    // Remove from list's sharedWith array if it exists
    if (share.sharedWithContact) {
      await this.listModel.findByIdAndUpdate(share.listId, {
        $pull: { sharedWith: share.sharedWithContact },
      });
    }

    // Check if list has no more shares
    const remainingShares = await this.sharedListModel.countDocuments({
      listId: share.listId,
      isActive: true,
    });

    if (remainingShares === 0) {
      await this.listModel.findByIdAndUpdate(share.listId, {
        isShared: false,
        sharedWith: [],
      });
    }
  }
} 