import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { List, ListSchema } from './schemas/list.schema';
import { ForgottenItem, ForgottenItemSchema } from './schemas/forgotten-item.schema';
import { Category, CategorySchema } from './schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema },
      { name: ForgottenItem.name, schema: ForgottenItemSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [ListController, CategoryController],
  providers: [ListService, CategoryService],
  exports: [ListService, CategoryService],
})
export class ListModule {}
