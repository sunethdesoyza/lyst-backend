import { ApiProperty } from '@nestjs/swagger';

export class ForgottenItemResponseDto {
  @ApiProperty({ description: 'The unique identifier of the forgotten item' })
  _id: string;

  @ApiProperty({ description: 'The name of the item' })
  name: string;

  @ApiProperty({ description: 'The quantity of the item', required: false })
  quantity?: number;

  @ApiProperty({ description: 'The unit of measurement for the item', required: false })
  unit?: string;

  @ApiProperty({ description: 'Any additional notes about the item', required: false })
  notes?: string;

  @ApiProperty({ description: 'The ID of the list this item came from' })
  listId: string;

  @ApiProperty({ description: 'The name of the list this item came from' })
  listName: string;

  @ApiProperty({ description: 'The date when the item was added to forgotten items' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the item was last updated' })
  updatedAt: Date;
} 