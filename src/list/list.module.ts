import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';
import { List, ListSchema } from './schemas/list.schema';
import { ForgottenItem, ForgottenItemSchema } from './schemas/forgotten-item.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { SharedList, SharedListSchema } from './schemas/shared-list.schema';
import { UserInvitation, UserInvitationSchema } from './schemas/user-invitation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema },
      { name: ForgottenItem.name, schema: ForgottenItemSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SharedList.name, schema: SharedListSchema },
      { name: UserInvitation.name, schema: UserInvitationSchema },
    ]),
  ],
  controllers: [ListController, CategoryController, SharingController],
  providers: [ListService, CategoryService, SharingService],
  exports: [ListService, CategoryService, SharingService],
})
export class ListModule {}
