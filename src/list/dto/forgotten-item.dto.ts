import { IsString, IsOptional, IsArray } from 'class-validator';

export class ForgottenItemResponseDto {
  id: string;
  name: string;
  quantity?: string;
  notes?: string;
  userId: string;
  originalListId: string;
  originalListName: string;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DismissForgottenItemsDto {
  @IsOptional()
  @IsString()
  listId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];
}

export class ReactivateListDto {
  @IsString()
  listId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];
}

export class MoveToNewListDto {
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];

  @IsString()
  newListName: string;
} 