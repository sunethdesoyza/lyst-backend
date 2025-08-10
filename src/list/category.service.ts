import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { List, ListDocument } from './schemas/list.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(List.name) private listModel: Model<ListDocument>,
  ) {}

  async createCategory(userId: string, createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const category = new this.categoryModel({
        ...createCategoryDto,
        userId,
      });
      return await category.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    return await this.categoryModel.find({ userId }).sort({ name: 1 }).exec();
  }

  async getCategoryById(userId: string, categoryId: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ _id: categoryId, userId }).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.getCategoryById(userId, categoryId);
    
    // Check if name change would conflict with existing category
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryModel.findOne({
        userId,
        name: updateCategoryDto.name,
        _id: { $ne: categoryId },
      }).exec();
      
      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryModel.findByIdAndUpdate(categoryId, updateCategoryDto, { new: true });
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const category = await this.getCategoryById(userId, categoryId);
    
    // Check if category is in use
    const listCount = await this.listModel.countDocuments({
      userId,
      category: category.name,
    });

    if (listCount > 0) {
      throw new ConflictException(
        `Cannot delete category. It is used by ${listCount} list(s). Please reassign or delete those lists first.`,
      );
    }

    await this.categoryModel.deleteOne({ _id: categoryId, userId });
  }

  async getCategoryStats(userId: string): Promise<{ name: string; count: number; color: string }[]> {
    const categories = await this.categoryModel.find({ userId }).exec();
    const stats = [];

    for (const category of categories) {
      const count = await this.listModel.countDocuments({
        userId,
        category: category.name,
      });
      
      stats.push({
        name: category.name,
        count,
        color: category.color,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Shopping', color: '#3B82F6' },
      { name: 'Work', color: '#10B981' },
      { name: 'Personal', color: '#F59E0B' },
      { name: 'Health', color: '#EF4444' },
      { name: 'Finance', color: '#8B5CF6' },
    ];

    for (const defaultCat of defaultCategories) {
      try {
        await this.createCategory(userId, defaultCat);
      } catch (error) {
        // Ignore conflicts if categories already exist
        if (error.code !== 11000) {
          throw error;
        }
      }
    }
  }

  async updateListCounts(userId: string): Promise<void> {
    const categories = await this.categoryModel.find({ userId }).exec();
    
    for (const category of categories) {
      const count = await this.listModel.countDocuments({
        userId,
        category: category.name,
      });
      
      if (category.listCount !== count) {
        category.listCount = count;
        await this.categoryModel.findByIdAndUpdate(category._id, { listCount: count });
      }
    }
  }
} 