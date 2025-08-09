import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { List, ListSchema } from './schemas/list.schema';
import { ForgottenItem, ForgottenItemSchema } from './schemas/forgotten-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema },
      { name: ForgottenItem.name, schema: ForgottenItemSchema },
    ]),
  ],
  controllers: [ListController],
  providers: [ListService],
  exports: [ListService],
})
export class ListModule {}
