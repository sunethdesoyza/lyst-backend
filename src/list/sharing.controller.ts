import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  Logger,
  HttpStatus,
  HttpCode 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiUnauthorizedResponse,
  ApiParam,
  ApiBody 
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SharingService } from './sharing.service';
import { 
  ShareListDto, 
  ShareListResponseDto, 
  AcceptShareDto, 
  AcceptShareResponseDto,
  SharedListDto 
} from './dto/share-list.dto';

@ApiTags('List Sharing')
@Controller('sharing')
@UseGuards(AuthGuard('firebase'))
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
export class SharingController {
  private readonly logger = new Logger(SharingController.name);

  constructor(private readonly sharingService: SharingService) {}

  @Post('share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Create a sharing link for a list',
    description: 'Generate a public sharing link that can be shared via any channel (WhatsApp, SMS, email, etc.)'
  })
  @ApiBody({
    type: ShareListDto,
    examples: {
      example1: {
        summary: 'Create share link',
        value: {
          listId: '507f1f77bcf86cd799439011',
          message: 'Check out this grocery list!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List shared successfully',
    type: ShareListResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data or already shared' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'List not found' 
  })
  async shareList(@Body() shareDto: ShareListDto, @Req() req: any): Promise<ShareListResponseDto> {
    this.logger.debug(`User ${req.user?.uid} sharing list ${shareDto.listId}`);
    return this.sharingService.shareList(shareDto, req.user.uid);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Accept a shared list invitation',
    description: 'Accept a list share invitation using the invitation token'
  })
  @ApiBody({
    type: AcceptShareDto,
    examples: {
      example1: {
        summary: 'Accept invitation',
        value: {
          invitationToken: 'abc123def456'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Share accepted successfully',
    type: AcceptShareResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Invitation not found or expired' 
  })
  async acceptShare(@Body() acceptDto: AcceptShareDto, @Req() req: any): Promise<AcceptShareResponseDto> {
    this.logger.debug(`User ${req.user?.uid} accepting share with token ${acceptDto.invitationToken}`);
    return this.sharingService.acceptShare(acceptDto, req.user.uid);
  }

  @Get('received')
  @ApiOperation({ 
    summary: 'Get lists shared with the current user',
    description: 'Retrieve all lists that have been shared with the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all lists shared with the user',
    type: [SharedListDto]
  })
  async getSharedLists(@Req() req: any): Promise<SharedListDto[]> {
    this.logger.debug(`User ${req.user?.uid} fetching shared lists`);
    return this.sharingService.getSharedLists(req.user.uid);
  }

  @Get('sent')
  @ApiOperation({ 
    summary: 'Get lists shared by the current user',
    description: 'Retrieve all lists that the authenticated user has shared with others'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all lists shared by the user',
    type: [SharedListDto]
  })
  async getMySharedLists(@Req() req: any): Promise<SharedListDto[]> {
    this.logger.debug(`User ${req.user?.uid} fetching their shared lists`);
    return this.sharingService.getMySharedLists(req.user.uid);
  }

  @Delete(':shareId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Revoke a list share',
    description: 'Revoke access to a list that was previously shared'
  })
  @ApiParam({
    name: 'shareId',
    description: 'ID of the share to revoke',
    example: '507f1f77bcf86cd799439012'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Share revoked successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Cannot revoke this share' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Share not found' 
  })
  async revokeShare(@Param('shareId') shareId: string, @Req() req: any): Promise<void> {
    this.logger.debug(`User ${req.user?.uid} revoking share ${shareId}`);
    await this.sharingService.revokeShare(shareId, req.user.uid);
  }

  @Get('invitation/:token')
  @ApiOperation({ 
    summary: 'Get invitation details',
    description: 'Get details about a list sharing invitation (public endpoint)'
  })
  @ApiParam({
    name: 'token',
    description: 'Invitation token',
    example: 'abc123def456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns invitation details' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Invitation not found or expired' 
  })
  async getInvitationDetails(@Param('token') token: string): Promise<any> {
    this.logger.debug(`Getting invitation details for token ${token}`);
    // This would return invitation details for the frontend to display
    // Implementation would depend on your frontend needs
    return { token, message: 'Invitation details retrieved' };
  }
} 