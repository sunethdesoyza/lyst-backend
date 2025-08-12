import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ShareListDto {
  @ApiProperty({
    description: 'List ID to share',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  listId: string;

  @ApiProperty({
    description: 'Custom message to include with the share',
    example: 'Check out this grocery list!',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;
}

export class ShareListResponseDto {
  @ApiProperty({
    description: 'Whether the share was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'List shared successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Share ID for tracking',
    example: '507f1f77bcf86cd799439012',
  })
  shareId: string;

  @ApiProperty({
    description: 'Public sharing link',
    example: 'https://your-app.com/shared/abc123def456',
  })
  sharingLink: string;

  @ApiProperty({
    description: 'Invitation token for unregistered users',
    example: 'abc123def456',
  })
  invitationToken: string;

  @ApiProperty({
    description: 'Share message template for easy copying',
    example: 'Check out this list: https://your-app.com/shared/abc123def456',
  })
  shareMessageTemplate: string;
}

export class AcceptShareDto {
  @ApiProperty({
    description: 'Invitation token to accept',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  invitationToken: string;
}

export class AcceptShareResponseDto {
  @ApiProperty({
    description: 'Whether the share was accepted successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'List shared successfully',
  })
  message: string;

  @ApiProperty({
    description: 'List ID that was shared',
    example: '507f1f77bcf86cd799439011',
  })
  listId: string;
}

export class SharedListDto {
  @ApiProperty({
    description: 'Share ID',
    example: '507f1f77bcf86cd799439012',
  })
  shareId: string;

  @ApiProperty({
    description: 'List information',
  })
  list: any;

  @ApiProperty({
    description: 'Owner information',
  })
  owner: any;

  @ApiProperty({
    description: 'Share status',
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'],
  })
  status: string;

  @ApiProperty({
    description: 'When the share was created',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Custom message from the owner',
    example: 'Check out this list!',
  })
  message: string;
} 