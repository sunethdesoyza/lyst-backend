import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('firebase'))
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Create a new category for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this name already exists',
  })
  async createCategory(
    @Request() req,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.createCategory(req.user.uid, createCategoryDto);
    return {
      id: category._id.toString(),
      name: category.name,
      userId: category.userId,
      color: category.color,
      listCount: category.listCount,
      isDefault: category.isDefault,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get user categories',
    description: 'Get all categories for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  async getUserCategories(@Request() req): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.getUserCategories(req.user.uid);
    return categories.map(category => ({
      id: category._id.toString(),
      name: category.name,
      userId: category.userId,
      color: category.color,
      listCount: category.listCount,
      isDefault: category.isDefault,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get category statistics',
    description: 'Get statistics for all categories of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Category statistics retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' },
          color: { type: 'string' },
        },
      },
    },
  })
  async getCategoryStats(@Request() req) {
    return await this.categoryService.getCategoryStats(req.user.uid);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Get a specific category by ID for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getCategoryById(@Request() req, @Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.getCategoryById(req.user.uid, id);
    return {
      id: category._id.toString(),
      name: category.name,
      userId: category.userId,
      color: category.color,
      listCount: category.listCount,
      isDefault: category.isDefault,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Update a category for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this name already exists',
  })
  async updateCategory(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.updateCategory(req.user.uid, id, updateCategoryDto);
    return {
      id: category._id.toString(),
      name: category.name,
      userId: category.userId,
      color: category.color,
      listCount: category.listCount,
      isDefault: category.isDefault,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Delete a category for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete category - it is in use by lists',
  })
  async deleteCategory(@Request() req, @Param('id') id: string): Promise<void> {
    await this.categoryService.deleteCategory(req.user.uid, id);
  }

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize default categories',
    description: 'Create default categories for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Default categories created successfully',
  })
  async initializeDefaultCategories(@Request() req): Promise<void> {
    await this.categoryService.createDefaultCategories(req.user.uid);
  }
} 