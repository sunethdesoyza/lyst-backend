import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { List, ListDocument } from './schemas/list.schema';
import { ForgottenItem, ForgottenItemDocument } from './schemas/forgotten-item.schema';
import { CreateListDto } from './dto/create-list.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { ListResponseDto } from './dto/list-response.dto';
import { ForgottenItemResponseDto, DismissForgottenItemsDto, ReactivateListDto, MoveToNewListDto } from './dto/forgotten-item.dto';

@Injectable()
export class ListService {
  constructor(
    @InjectModel(List.name) private listModel: Model<ListDocument>,
    @InjectModel(ForgottenItem.name) private forgottenItemModel: Model<ForgottenItemDocument>,
  ) {}

  private async handleExpiredList(list: ListDocument): Promise<void> {
    if (list.expiryDate && new Date() > list.expiryDate && !list.isArchived) {
      // Find incomplete items
      const incompleteItems = list.items.filter(item => !item.isCompleted);

      if (incompleteItems.length > 0) {
        // Create forgotten items
        const forgottenItems = incompleteItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
          userId: list.userId,
          originalListId: list._id.toString(),
          originalListName: list.name,
          expiryDate: list.expiryDate,
        }));

        await this.forgottenItemModel.insertMany(forgottenItems);
      }

      // Archive the list with EXPIRED reason
      await this.listModel.findByIdAndUpdate(list._id, { 
        isArchived: true,
        archivedReason: 'EXPIRED'
      });
    }
  }

  async create(createListDto: CreateListDto, userId: string): Promise<ListResponseDto> {
    try {
      const createdList = await this.listModel.create({
        ...createListDto,
        userId,
      });
      return this.mapToResponseDto(createdList);
    } catch (error) {
      throw new Error(`Failed to create list: ${error.message}`);
    }
  }

  async findAll(userId: string): Promise<ListResponseDto[]> {
    try {
      // Get all non-archived lists
      const lists = await this.listModel.find({ userId, isArchived: false }).exec();
      
      // Handle expired lists and create forgotten items
      for (const list of lists) {
        if (list.expiryDate && new Date() > list.expiryDate && !list.isArchived) {
          // Find incomplete items
          const incompleteItems = list.items.filter(item => !item.isCompleted);

          if (incompleteItems.length > 0) {
            // Create forgotten items
            const forgottenItems = incompleteItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              notes: item.notes,
              userId: list.userId,
              originalListId: list._id.toString(),
              originalListName: list.name,
              expiryDate: list.expiryDate,
            }));

            // Create forgotten items first
            await this.forgottenItemModel.insertMany(forgottenItems);
            
            // Then archive the list
            await this.listModel.findByIdAndUpdate(list._id, { 
              isArchived: true,
              archivedReason: 'EXPIRED'
            });
          } else {
            // If no incomplete items, just archive the list
            await this.listModel.findByIdAndUpdate(list._id, { 
              isArchived: true,
              archivedReason: 'EXPIRED'
            });
          }
        }
      }
      
      // Get updated lists after potential archiving
      const updatedLists = await this.listModel.find({ userId, isArchived: false }).exec();
      return updatedLists.map(list => this.mapToResponseDto(list));
    } catch (error) {
      throw new Error(`Failed to fetch lists: ${error.message}`);
    }
  }

  async findOne(id: string, userId: string): Promise<ListResponseDto> {
    try {
      const list = await this.listModel.findOne({ _id: id, userId }).exec();
      if (!list) {
        throw new NotFoundException('List not found');
      }

      // Handle expired list
      await this.handleExpiredList(list);

      // Get updated list after potential archiving
      const updatedList = await this.listModel.findOne({ _id: id, userId }).exec();
      if (!updatedList) {
        throw new NotFoundException('List not found');
      }

      return this.mapToResponseDto(updatedList);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch list: ${error.message}`);
    }
  }

  async update(id: string, updateListDto: Partial<CreateListDto>, userId: string): Promise<ListResponseDto> {
    try {
      const list = await this.listModel.findOne({ _id: id, userId }).exec();
      if (!list) {
        throw new NotFoundException('List not found');
      }

      const updatedList = await this.listModel
        .findOneAndUpdate(
          { _id: id, userId },
          { $set: updateListDto },
          { new: true }
        )
        .exec();
      
      return this.mapToResponseDto(updatedList);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update list: ${error.message}`);
    }
  }

  async archive(id: string, userId: string): Promise<ListResponseDto> {
    try {
      const list = await this.listModel.findOne({ _id: id, userId }).exec();
      if (!list) {
        throw new NotFoundException('List not found');
      }

      const archivedList = await this.listModel
        .findOneAndUpdate(
          { _id: id, userId },
          { 
            $set: { 
              isArchived: true,
              archivedReason: 'DELETED'
            } 
          },
          { new: true }
        )
        .exec();
      
      return this.mapToResponseDto(archivedList);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to archive list: ${error.message}`);
    }
  }

  async addItem(listId: string, userId: string, createItemDto: CreateItemDto): Promise<ListResponseDto> {
    try {
      const list = await this.listModel.findOne({ _id: listId, userId }).exec();
      if (!list) {
        throw new NotFoundException('List not found');
      }

      if (list.isArchived) {
        throw new BadRequestException('Cannot add items to an archived list');
      }

      const updatedList = await this.listModel
        .findOneAndUpdate(
          { _id: listId, userId },
          { $push: { items: createItemDto } },
          { new: true }
        )
        .exec();

      return this.mapToResponseDto(updatedList);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to add item: ${error.message}`);
    }
  }

  async updateItem(listId: string, userId: string, itemId: string, updateItemDto: UpdateItemDto): Promise<ListResponseDto> {
    try {
      const list = await this.listModel.findOne({ _id: listId, userId }).exec();
      if (!list) {
        throw new NotFoundException('List not found');
      }

      const itemIndex = list.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        throw new NotFoundException('Item not found');
      }

      const updateObject = {};
      Object.entries(updateItemDto).forEach(([key, value]) => {
        updateObject[`items.$.${key}`] = value;
      });

      const updatedList = await this.listModel
        .findOneAndUpdate(
          { _id: listId, userId, 'items._id': itemId },
          { $set: updateObject },
          { new: true }
        )
        .exec();

      return this.mapToResponseDto(updatedList);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  async deleteItem(listId: string, userId: string, itemId: string): Promise<ListResponseDto> {
    try {
      const list = await this.listModel.findOne({ _id: listId, userId }).exec();
      if (!list) {
        throw new NotFoundException('List not found');
      }

      const itemIndex = list.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        throw new NotFoundException('Item not found');
      }

      const updatedList = await this.listModel
        .findOneAndUpdate(
          { _id: listId, userId },
          { $pull: { items: { _id: itemId } } },
          { new: true }
        )
        .exec();

      return this.mapToResponseDto(updatedList);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  async getForgottenItems(userId: string): Promise<ForgottenItemResponseDto[]> {
    try {
      const items = await this.forgottenItemModel.find({ userId }).exec();
      return items.map(item => this.mapToForgottenItemResponseDto(item));
    } catch (error) {
      throw new Error(`Failed to fetch forgotten items: ${error.message}`);
    }
  }

  async dismissForgottenItems(userId: string, dto: DismissForgottenItemsDto): Promise<void> {
    try {
      if (dto.listId) {
        // Dismiss all items from a specific list
        await this.forgottenItemModel.deleteMany({ 
          userId, 
          originalListId: dto.listId 
        }).exec();
      } else if (dto.itemIds && dto.itemIds.length > 0) {
        // Dismiss specific items
        await this.forgottenItemModel.deleteMany({ 
          userId, 
          _id: { $in: dto.itemIds } 
        }).exec();
      } else {
        throw new BadRequestException('Either listId or itemIds must be provided');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to dismiss forgotten items: ${error.message}`);
    }
  }

  async reactivateList(userId: string, dto: ReactivateListDto): Promise<ListResponseDto> {
    try {
      const list = await this.listModel.findOne({ _id: dto.listId, userId }).exec();
      if (!list) {
        throw new NotFoundException('List not found');
      }

      // Get forgotten items for this list
      const query: any = { userId, originalListId: dto.listId };
      if (dto.itemIds && dto.itemIds.length > 0) {
        query._id = { $in: dto.itemIds };
      }

      const forgottenItems = await this.forgottenItemModel.find(query).exec();
      
      // Create items from forgotten items
      const items = forgottenItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        isCompleted: false,
      }));

      // Update list
      const updatedList = await this.listModel
        .findOneAndUpdate(
          { _id: dto.listId, userId },
          { 
            $set: { isArchived: false },
            $push: { items: { $each: items } }
          },
          { new: true }
        )
        .exec();

      // Delete the reactivated forgotten items
      await this.forgottenItemModel.deleteMany(query).exec();

      return this.mapToResponseDto(updatedList);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to reactivate list: ${error.message}`);
    }
  }

  async moveToNewList(userId: string, dto: MoveToNewListDto): Promise<ListResponseDto> {
    try {
      // Get the forgotten items
      const forgottenItems = await this.forgottenItemModel
        .find({ userId, _id: { $in: dto.itemIds } })
        .exec();

      if (forgottenItems.length === 0) {
        throw new NotFoundException('No forgotten items found');
      }

      // Create new list with the items
      const newList = await this.listModel.create({
        name: dto.newListName,
        userId,
        items: forgottenItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
          isCompleted: false,
        })),
      });

      // Delete the moved forgotten items
      await this.forgottenItemModel.deleteMany({ 
        userId, 
        _id: { $in: dto.itemIds } 
      }).exec();

      return this.mapToResponseDto(newList);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to move items to new list: ${error.message}`);
    }
  }

  mapToResponseDto(list: ListDocument): ListResponseDto {
    return {
      id: list._id.toString(),
      name: list.name,
      userId: list.userId,
      category: list.category,
      priority: list.priority,
      expiryDate: list.expiryDate,
      color: list.color,
      isArchived: list.isArchived,
      items: list.items.map(item => ({
        id: item._id.toString(),
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        isCompleted: item.isCompleted,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }

  private mapToForgottenItemResponseDto(item: ForgottenItemDocument): ForgottenItemResponseDto {
    return {
      id: item._id.toString(),
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      userId: item.userId,
      originalListId: item.originalListId,
      originalListName: item.originalListName,
      expiryDate: item.expiryDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

