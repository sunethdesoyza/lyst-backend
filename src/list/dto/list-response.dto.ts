import { ApiProperty } from '@nestjs/swagger';
import { ArchivedReason } from '../schemas/list.schema';

export class ItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  quantity?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  isCompleted: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  expiryDate: Date;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  priority: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty({ enum: ArchivedReason, required: false })
  archivedReason?: ArchivedReason;

  @ApiProperty({ type: [ItemResponseDto] })
  items: ItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 