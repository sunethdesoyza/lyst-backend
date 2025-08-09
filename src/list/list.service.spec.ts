import { Test, TestingModule } from '@nestjs/testing';
import { ListService } from './list.service';
import { getModelToken } from '@nestjs/mongoose';
import { List, ListDocument } from './schemas/list.schema';
import { ForgottenItem, ForgottenItemDocument } from './schemas/forgotten-item.schema';
import { CreateListDto } from './dto/create-list.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Model, Query } from 'mongoose';
import { DismissForgottenItemsDto, ReactivateListDto, MoveToNewListDto } from './dto/forgotten-item.dto';
import { ArchivedReason } from './schemas/list.schema';

describe('ListService', () => {
  let service: ListService;
  let listModel: Model<ListDocument>;
  let forgottenItemModel: Model<ForgottenItemDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: getModelToken(List.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            findOneAndUpdate: jest.fn().mockReturnThis(),
            findOneAndDelete: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(ForgottenItem.name),
          useValue: {
            insertMany: jest.fn(),
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            findOneAndUpdate: jest.fn().mockReturnThis(),
            deleteMany: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
    listModel = module.get<Model<ListDocument>>(getModelToken(List.name));
    forgottenItemModel = module.get<Model<ForgottenItemDocument>>(getModelToken(ForgottenItem.name));

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new list', async () => {
      const createListDto: CreateListDto = {
        name: 'Test List',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
      };
      const userId = 'user123';
      const mockList = {
        _id: '1',
        ...createListDto,
        userId,
        items: [],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: '1',
          ...createListDto,
          userId,
          items: [],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ListDocument;

      (listModel.create as jest.Mock).mockResolvedValue(mockList);

      const result = await service.create(createListDto, userId);

      expect(result).toEqual(service.mapToResponseDto(mockList));
      expect(listModel.create).toHaveBeenCalledWith({
        ...createListDto,
        userId,
      });
    });
  });

  describe('findAll', () => {
    it('should return all lists for a user', async () => {
      const userId = 'user123';
      const mockLists = [
        {
          _id: '1',
          name: 'Test List 1',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#FF0000',
          items: [],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          toObject: () => ({
            _id: '1',
            name: 'Test List 1',
            userId,
            category: 'Groceries',
            priority: 'medium',
            expiryDate: new Date(),
            color: '#FF0000',
            items: [],
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ] as unknown as ListDocument[];

      (listModel.find as jest.Mock).mockReturnThis();
      (listModel.find as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockLists)
      }));

      const result = await service.findAll(userId);

      expect(result).toEqual(mockLists.map(list => service.mapToResponseDto(list)));
      expect(listModel.find).toHaveBeenCalledWith({ userId, isArchived: false });
    });

    it('should handle expired lists and create forgotten items', async () => {
      const userId = 'user123';
      const expiredDate = new Date(Date.now() - 1000);
      const mockLists = [
        {
          _id: '1',
          name: 'Expired List',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: expiredDate,
          color: '#FF0000',
          items: [
            {
              _id: 'item1',
              name: 'Milk',
              quantity: '1 liter',
              notes: 'Get 2 liters',
              isCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              _id: 'item2',
              name: 'Bread',
              quantity: '1 loaf',
              notes: 'Whole grain',
              isCompleted: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          toObject: () => ({
            _id: '1',
            name: 'Expired List',
            userId,
            category: 'Groceries',
            priority: 'medium',
            expiryDate: expiredDate,
            color: '#FF0000',
            items: [
              {
                _id: 'item1',
                name: 'Milk',
                quantity: '1 liter',
                notes: 'Get 2 liters',
                isCompleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                _id: 'item2',
                name: 'Bread',
                quantity: '1 loaf',
                notes: 'Whole grain',
                isCompleted: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ] as unknown as ListDocument[];

      (listModel.find as jest.Mock).mockImplementation(() => ({
        exec: jest.fn()
          .mockResolvedValueOnce(mockLists)
          .mockResolvedValueOnce([])
      }));

      await service.findAll(userId);

      expect(forgottenItemModel.insertMany).toHaveBeenCalledWith([
        {
          name: 'Milk',
          quantity: '1 liter',
          notes: 'Get 2 liters',
          userId,
          originalListId: '1',
          originalListName: 'Expired List',
          expiryDate: expiredDate,
        },
      ]);

      expect(listModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { isArchived: true, archivedReason: 'EXPIRED' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific list', async () => {
      const listId = '1';
      const userId = 'user123';
      const mockList = {
        _id: listId,
        name: 'Test List',
        userId,
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        items: [],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: listId,
          name: 'Test List',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#FF0000',
          items: [],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ListDocument;

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      const result = await service.findOne(listId, userId);

      expect(result).toEqual(service.mapToResponseDto(mockList));
      expect(listModel.findOne).toHaveBeenCalledWith({ _id: listId, userId });
    });

    it('should throw NotFoundException if list not found', async () => {
      const listId = '1';
      const userId = 'user123';

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null)
      }));

      await expect(service.findOne(listId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a list', async () => {
      const listId = '1';
      const userId = 'user123';
      const updateListDto: Partial<CreateListDto> = {
        name: 'Updated List',
        expiryDate: new Date(),
        color: '#00FF00',
      };
      const mockList = {
        _id: listId,
        name: 'Updated List',
        userId,
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#00FF00',
        items: [],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: listId,
          name: 'Updated List',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#00FF00',
          items: [],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ListDocument;

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      (listModel.findOneAndUpdate as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      const result = await service.update(listId, updateListDto, userId);

      expect(result).toEqual(service.mapToResponseDto(mockList));
      expect(listModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: listId, userId },
        { $set: updateListDto },
        { new: true },
      );
    });

    it('should throw NotFoundException if list not found', async () => {
      const listId = '1';
      const userId = 'user123';
      const updateListDto: Partial<CreateListDto> = {
        name: 'Updated List',
      };

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null)
      }));

      await expect(service.update(listId, updateListDto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should archive a list with DELETED reason', async () => {
      const mockList = {
        _id: {
          toString: () => 'list123'
        },
        userId: 'user123',
        name: 'Test List',
        items: [],
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(),
        priority: 'LOW',
        category: 'GROCERIES',
        color: '#000000',
        toObject: () => ({
          _id: 'list123',
          userId: 'user123',
          name: 'Test List',
          items: [],
          isArchived: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiryDate: new Date(),
          priority: 'LOW',
          category: 'GROCERIES',
          color: '#000000',
        })
      } as unknown as ListDocument;

      const mockForgottenItems = [{
        _id: {
          toString: () => 'forgotten1'
        },
        originalListId: 'list123',
        originalListName: 'Test List',
        userId: 'user123',
        name: 'Item 1',
        quantity: 1,
        unit: 'pc',
        notes: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      }] as unknown as ForgottenItemDocument[];

      const reactivatedList = {
        _id: {
          toString: () => 'list123'
        },
        userId: 'user123',
        name: 'Test List',
        items: [{
          _id: {
            toString: () => 'item1'
          },
          name: 'Item 1',
          quantity: 1,
          notes: 'test',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(),
        priority: 'LOW',
        category: 'GROCERIES',
        color: '#000000',
        toObject: () => ({
          _id: 'list123',
          userId: 'user123',
          name: 'Test List',
          items: [{
            _id: 'item1',
            name: 'Item 1',
            quantity: 1,
            notes: 'test',
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiryDate: new Date(),
          priority: 'LOW',
          category: 'GROCERIES',
          color: '#000000',
        })
      } as unknown as ListDocument;

      jest.spyOn(listModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockList)
      } as unknown as Query<ListDocument, ListDocument>);

      jest.spyOn(listModel, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(reactivatedList)
      } as unknown as Query<ListDocument, ListDocument>);

      jest.spyOn(forgottenItemModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockForgottenItems)
      } as unknown as Query<ForgottenItemDocument[], ForgottenItemDocument>);

      jest.spyOn(forgottenItemModel, 'deleteMany').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
      } as any);

      const result = await service.archive('list123', 'user123');
      expect(result).toBeDefined();
      expect(result.isArchived).toBe(false);
    });
  });

  describe('addItem', () => {
    it('should add an item to a list', async () => {
      const listId = '1';
      const userId = 'user123';
      const createItemDto: CreateItemDto = {
        name: 'Milk',
        quantity: '1 liter',
        notes: 'Get 2 liters',
      };
      const mockList = {
        _id: listId,
        name: 'Test List',
        userId,
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        items: [
          {
            _id: 'item1',
            name: 'Milk',
            quantity: '1 liter',
            notes: 'Get 2 liters',
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: listId,
          name: 'Test List',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#FF0000',
          items: [
            {
              _id: 'item1',
              name: 'Milk',
              quantity: '1 liter',
              notes: 'Get 2 liters',
              isCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ListDocument;

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      (listModel.findOneAndUpdate as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      const result = await service.addItem(listId, userId, createItemDto);

      expect(result).toEqual(service.mapToResponseDto(mockList));
      expect(listModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: listId, userId },
        { $push: { items: createItemDto } },
        { new: true },
      );
    });

    it('should throw BadRequestException when trying to add item to archived list', async () => {
      const listId = '1';
      const userId = 'user123';
      const createItemDto: CreateItemDto = {
        name: 'Milk',
        quantity: '1 liter',
        notes: 'Get 2 liters',
      };
      const mockList = {
        _id: listId,
        name: 'Test List',
        userId,
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        items: [],
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: listId,
          name: 'Test List',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#FF0000',
          items: [],
          isArchived: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ListDocument;

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      await expect(service.addItem(listId, userId, createItemDto)).rejects.toThrow(BadRequestException);
      expect(listModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should update an item in a list', async () => {
      const listId = '1';
      const userId = 'user123';
      const itemId = 'item1';
      const updateItemDto: UpdateItemDto = {
        name: 'Updated Milk',
        quantity: '2 liters',
      };
      const mockList = {
        _id: listId,
        name: 'Test List',
        userId,
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        items: [
          {
            _id: itemId,
            name: 'Updated Milk',
            quantity: '2 liters',
            notes: 'Get 2 liters',
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: listId,
          name: 'Test List',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#FF0000',
          items: [
            {
              _id: itemId,
              name: 'Updated Milk',
              quantity: '2 liters',
              notes: 'Get 2 liters',
              isCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ListDocument;

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      (listModel.findOneAndUpdate as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      const result = await service.updateItem(listId, userId, itemId, updateItemDto);

      expect(result).toEqual(service.mapToResponseDto(mockList));
      expect(listModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: listId, userId, 'items._id': itemId },
        { $set: { 'items.$.name': 'Updated Milk', 'items.$.quantity': '2 liters' } },
        { new: true },
      );
    });
  });

  describe('deleteItem', () => {
    it('should delete an item from a list', async () => {
      const listId = '1';
      const userId = 'user123';
      const itemId = 'item1';
      const mockList = {
        _id: listId,
        name: 'Test List',
        userId,
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        items: [
          {
            _id: itemId,
            name: 'Milk',
            quantity: '1 liter',
            notes: 'Get 2 liters',
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: listId,
          name: 'Test List',
          userId,
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#FF0000',
          items: [
            {
              _id: itemId,
              name: 'Milk',
              quantity: '1 liter',
              notes: 'Get 2 liters',
              isCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ListDocument;

      (listModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      (listModel.findOneAndUpdate as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockList)
      }));

      const result = await service.deleteItem(listId, userId, itemId);

      expect(result).toEqual(service.mapToResponseDto(mockList));
      expect(listModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: listId, userId },
        { $pull: { items: { _id: itemId } } },
        { new: true },
      );
    });
  });

  describe('getForgottenItems', () => {
    it('should return forgotten items for a user', async () => {
      const mockForgottenItems = [
        {
          _id: 'forgotten1',
          name: 'Item 1',
          listId: 'list1',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'forgotten2',
          name: 'Item 2',
          listId: 'list2',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as unknown as ForgottenItemDocument[];

      (forgottenItemModel.find as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockForgottenItems)
      }));

      const result = await service.getForgottenItems('user1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Item 1');
      expect(forgottenItemModel.find).toHaveBeenCalledWith({ userId: 'user1' });
    });
  });

  describe('dismissForgottenItems', () => {
    it('should dismiss forgotten items by list', async () => {
      (forgottenItemModel.deleteMany as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 2 })
      }));

      const dto: DismissForgottenItemsDto = { listId: 'list1' };
      await service.dismissForgottenItems('user1', dto);

      expect(forgottenItemModel.deleteMany).toHaveBeenCalledWith({
        userId: 'user1',
        originalListId: 'list1',
      });
    });

    it('should dismiss specific forgotten items', async () => {
      (forgottenItemModel.deleteMany as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 2 })
      }));

      const dto: DismissForgottenItemsDto = { itemIds: ['item1', 'item2'] };
      await service.dismissForgottenItems('user1', dto);

      expect(forgottenItemModel.deleteMany).toHaveBeenCalledWith({
        userId: 'user1',
        _id: { $in: ['item1', 'item2'] },
      });
    });
  });

  describe('reactivateList', () => {
    it('should reactivate a list and move items back', async () => {
      const mockList = {
        _id: {
          toString: () => 'list123'
        },
        userId: 'user123',
        name: 'Test List',
        items: [],
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(),
        priority: 'LOW',
        category: 'GROCERIES',
        color: '#000000',
        toObject: () => ({
          _id: 'list123',
          userId: 'user123',
          name: 'Test List',
          items: [],
          isArchived: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiryDate: new Date(),
          priority: 'LOW',
          category: 'GROCERIES',
          color: '#000000',
        })
      } as unknown as ListDocument;

      const mockForgottenItems = [{
        _id: {
          toString: () => 'forgotten1'
        },
        originalListId: 'list123',
        originalListName: 'Test List',
        userId: 'user123',
        name: 'Item 1',
        quantity: 1,
        unit: 'pc',
        notes: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      }] as unknown as ForgottenItemDocument[];

      const reactivatedList = {
        _id: {
          toString: () => 'list123'
        },
        userId: 'user123',
        name: 'Test List',
        items: [{
          _id: {
            toString: () => 'item1'
          },
          name: 'Item 1',
          quantity: 1,
          notes: 'test',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(),
        priority: 'LOW',
        category: 'GROCERIES',
        color: '#000000',
        toObject: () => ({
          _id: 'list123',
          userId: 'user123',
          name: 'Test List',
          items: [{
            _id: 'item1',
            name: 'Item 1',
            quantity: 1,
            notes: 'test',
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiryDate: new Date(),
          priority: 'LOW',
          category: 'GROCERIES',
          color: '#000000',
        })
      } as unknown as ListDocument;

      jest.spyOn(listModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockList)
      } as unknown as Query<ListDocument, ListDocument>);

      jest.spyOn(listModel, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(reactivatedList)
      } as unknown as Query<ListDocument, ListDocument>);

      jest.spyOn(forgottenItemModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockForgottenItems)
      } as unknown as Query<ForgottenItemDocument[], ForgottenItemDocument>);

      jest.spyOn(forgottenItemModel, 'deleteMany').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
      } as any);

      const result = await service.reactivateList('user123', {
        listId: 'list123'
      });

      expect(result).toBeDefined();
      expect(result.isArchived).toBe(false);
    });
  });

  describe('moveToNewList', () => {
    it('should move forgotten items to a new list', async () => {
      const mockForgottenItems = [{
        _id: {
          toString: () => 'forgotten1'
        },
        originalListId: 'list123',
        originalListName: 'Test List',
        userId: 'user123',
        name: 'Item 1',
        quantity: 1,
        unit: 'pc',
        notes: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      }] as unknown as ForgottenItemDocument[];

      const mockNewList = {
        _id: 'newlist123',
        userId: 'user123',
        name: 'New List',
        items: [],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(),
        priority: 'LOW',
        category: 'GROCERIES',
        color: '#000000',
        toObject: () => ({
          _id: 'newlist123',
          userId: 'user123',
          name: 'New List',
          items: [],
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiryDate: new Date(),
          priority: 'LOW',
          category: 'GROCERIES',
          color: '#000000',
        })
      } as unknown as ListDocument;

      jest.spyOn(forgottenItemModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockForgottenItems)
      } as unknown as Query<ForgottenItemDocument[], ForgottenItemDocument>);

      jest.spyOn(listModel, 'create').mockResolvedValue({
        ...mockNewList,
        toObject: () => mockNewList.toObject()
      } as any);

      jest.spyOn(forgottenItemModel, 'deleteMany').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
      } as any);

      const result = await service.moveToNewList('user123', {
        itemIds: ['forgotten1'],
        newListName: 'New List'
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('New List');
    });
  });
});
