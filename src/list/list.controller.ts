import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiUnauthorizedResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ListService } from './list.service';
import { CategoryService } from './category.service';
import { CreateListDto } from './dto/create-list.dto';
import { ListResponseDto } from './dto/list-response.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { AuthGuard } from '@nestjs/passport';
import { DismissForgottenItemsDto, ReactivateListDto, MoveToNewListDto } from './dto/forgotten-item.dto';
import { ForgottenItemResponseDto } from './dto/forgotten-item-response.dto';

@ApiTags('Lists')
@Controller('lists')
@UseGuards(AuthGuard('firebase'))
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
export class ListController {
  private readonly logger = new Logger(ListController.name);

  constructor(
    private readonly listService: ListService,
    private readonly categoryService: CategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new list' })
  @ApiResponse({ 
    status: 201, 
    description: 'Creates a new list',
    type: ListResponseDto
  })
  @ApiBody({
    type: CreateListDto,
    examples: {
      example1: {
        value: {
          name: 'Grocery List',
          category: 'GROCERIES',
          priority: 'HIGH',
          expiryDate: '2024-12-31T23:59:59Z',
          color: '#FF0000'
        }
      }
    }
  })
  async create(@Req() req: any, @Body() createListDto: CreateListDto) {
    this.logger.debug(`Creating list for user ${req.user?.uid}`);
    return this.listService.create(createListDto, req.user.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lists' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all non-archived lists for the user',
    type: [ListResponseDto]
  })
  async findAll(@Req() req: any) {
    this.logger.debug(`Fetching all lists for user ${req.user?.uid}`);
    return this.listService.findAll(req.user.uid);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available categories for creating lists' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all categories available to the user for creating lists'
  })
  async getAvailableCategories(@Req() req: any) {
    this.logger.debug(`Fetching available categories for user ${req.user?.uid}`);
    return this.categoryService.getUserCategories(req.user.uid);
  }

  @Get('forgotten-items')
  @ApiOperation({ summary: 'Get all forgotten items' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all forgotten items for the user',
    type: [ForgottenItemResponseDto]
  })
  async getForgottenItems(@Req() req: any) {
    return this.listService.getForgottenItems(req.user.uid);
  }

  @Post('forgotten-items/dismiss')
  @ApiOperation({ summary: 'Dismiss forgotten items' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dismisses forgotten items by list or specific items'
  })
  @ApiBody({
    type: DismissForgottenItemsDto,
    examples: {
      example1: {
        summary: 'Dismiss all items from a list',
        value: {
          listId: 'list123'
        }
      },
      example2: {
        summary: 'Dismiss specific items',
        value: {
          itemIds: ['item1', 'item2']
        }
      }
    }
  })
  async dismissForgottenItems(@Req() req: any, @Body() dto: DismissForgottenItemsDto) {
    return this.listService.dismissForgottenItems(req.user.uid, dto);
  }

  @Post('forgotten-items/reactivate')
  @ApiOperation({ summary: 'Reactivate a list with forgotten items' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reactivates a list and optionally adds specific forgotten items back',
    type: ListResponseDto
  })
  @ApiBody({
    type: ReactivateListDto,
    examples: {
      example1: {
        summary: 'Reactivate all items from a list',
        value: {
          listId: 'list123'
        }
      },
      example2: {
        summary: 'Reactivate specific items',
        value: {
          listId: 'list123',
          itemIds: ['item1', 'item2']
        }
      }
    }
  })
  async reactivateList(@Req() req: any, @Body() dto: ReactivateListDto) {
    return this.listService.reactivateList(req.user.uid, dto);
  }

  @Post('forgotten-items/move-to-new')
  @ApiOperation({ summary: 'Move forgotten items to a new list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Creates a new list with the specified forgotten items',
    type: ListResponseDto
  })
  @ApiBody({
    type: MoveToNewListDto,
    examples: {
      example1: {
        value: {
          itemIds: ['item1', 'item2'],
          newListName: 'New Grocery List'
        }
      }
    }
  })
  async moveToNewList(@Req() req: any, @Body() dto: MoveToNewListDto) {
    return this.listService.moveToNewList(req.user.uid, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a specific list by ID',
    type: ListResponseDto
  })
  @ApiParam({ name: 'id', description: 'List ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    this.logger.debug(`Fetching list ${id} for user ${req.user?.uid}`);
    return this.listService.findOne(id, req.user.uid);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Updates a specific list',
    type: ListResponseDto
  })
  @ApiParam({ name: 'id', description: 'List ID' })
  @ApiBody({
    type: CreateListDto,
    examples: {
      example1: {
        value: {
          name: 'Updated Grocery List',
          category: 'GROCERIES',
          priority: 'MEDIUM',
          expiryDate: '2024-12-31T23:59:59Z',
          color: '#00FF00'
        }
      }
    }
  })
  async update(@Req() req: any, @Param('id') id: string, @Body() updateListDto: Partial<CreateListDto>) {
    this.logger.debug(`Updating list ${id} for user ${req.user?.uid}`);
    return this.listService.update(id, updateListDto, req.user.uid);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Archives a specific list',
    type: ListResponseDto
  })
  @ApiParam({ name: 'id', description: 'List ID' })
  async archive(@Req() req: any, @Param('id') id: string) {
    this.logger.debug(`Archiving list ${id} for user ${req.user?.uid}`);
    return this.listService.archive(id, req.user.uid);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add an item to a list' })
  @ApiResponse({ 
    status: 201, 
    description: 'Adds a new item to a list',
    type: ListResponseDto
  })
  @ApiParam({ name: 'id', description: 'List ID' })
  @ApiBody({
    type: CreateItemDto,
    examples: {
      example1: {
        value: {
          name: 'Milk',
          quantity: '2 liters',
          notes: 'Get whole milk'
        }
      }
    }
  })
  async addItem(@Req() req: any, @Param('id') id: string, @Body() createItemDto: CreateItemDto) {
    this.logger.debug(`Adding item to list ${id} for user ${req.user?.uid}`);
    return this.listService.addItem(id, req.user.uid, createItemDto);
  }

  @Put(':id/items/:itemId')
  @ApiOperation({ summary: 'Update an item in a list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Updates a specific item in a list',
    type: ListResponseDto
  })
  @ApiParam({ name: 'id', description: 'List ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiBody({
    type: UpdateItemDto,
    examples: {
      example1: {
        value: {
          name: 'Updated Milk',
          quantity: '1 liter',
          notes: 'Get skim milk',
          isCompleted: true
        }
      }
    }
  })
  async updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    this.logger.debug(`Updating item ${itemId} in list ${id} for user ${req.user?.uid}`);
    return this.listService.updateItem(id, req.user.uid, itemId, updateItemDto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Delete an item from a list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deletes a specific item from a list',
    type: ListResponseDto
  })
  @ApiParam({ name: 'id', description: 'List ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  async deleteItem(@Req() req: any, @Param('id') id: string, @Param('itemId') itemId: string) {
    this.logger.debug(`Deleting item ${itemId} from list ${id} for user ${req.user?.uid}`);
    return this.listService.deleteItem(id, req.user.uid, itemId);
  }
}
