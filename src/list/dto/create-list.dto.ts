import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsEnum, IsNotEmpty, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateListDto {
  @ApiProperty({
    description: 'Name of the list',
    example: 'Grocery Shopping',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Expiry date of the list',
    example: '2024-12-31',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  expiryDate: Date;

  @ApiProperty({
    description: 'Priority of the list',
    enum: ['low', 'medium', 'high'],
    example: 'medium',
  })
  @IsEnum(['low', 'medium', 'high'])
  @IsNotEmpty()
  priority: string;

  @ApiProperty({
    description: 'Category of the list',
    example: 'shopping',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Color code for the list',
    example: '#FF0000',
  })
  @IsHexColor()
  @IsNotEmpty()
  color: string;
} 