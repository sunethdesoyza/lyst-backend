import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({
    description: 'Name of the item',
    example: 'Milk',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Quantity of the item',
    example: '1 liter',
    required: false,
  })
  @IsString()
  @IsOptional()
  quantity?: string;

  @ApiProperty({
    description: 'Additional notes for the item',
    example: 'Get 2 liters',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateItemDto {
  @ApiProperty({
    description: 'Name of the item',
    example: 'Milk',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Quantity of the item',
    example: '1 liter',
    required: false,
  })
  @IsString()
  @IsOptional()
  quantity?: string;

  @ApiProperty({
    description: 'Additional notes for the item',
    example: 'Get 2 liters',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Completion status of the item',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
} 