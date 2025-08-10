import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsHexColor, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Shopping',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Color code for the category',
    example: '#FF0000',
    default: '#3B82F6',
  })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Shopping',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Color code for the category',
    example: '#FF0000',
  })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'Whether this is a default category',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  listCount: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 