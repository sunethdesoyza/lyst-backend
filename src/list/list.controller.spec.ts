import { Test, TestingModule } from '@nestjs/testing';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { CreateListDto } from './dto/create-list.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { ListResponseDto } from './dto/list-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

// Mock AuthGuard
class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    return true;
  }
}

// Mock Request object
const mockRequest = {
  user: {
    uid: 'user123'
  }
};

// Mock ListService
const mockListService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  archive: jest.fn(),
  addItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
};

describe('ListController', () => {
  let controller: ListController;
  let service: ListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListController],
      providers: [
        {
          provide: ListService,
          useValue: mockListService,
        },
      ],
    })
      .overrideGuard(AuthGuard('firebase'))
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<ListController>(ListController);
    service = module.get<ListService>(ListService);
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
      const mockList: ListResponseDto = {
        id: '1',
        name: 'Test List',
        userId: 'user123',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        isArchived: false,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockListService.create.mockResolvedValue(mockList);

      const result = await controller.create(mockRequest, createListDto);

      expect(result).toEqual(mockList);
      expect(mockListService.create).toHaveBeenCalledWith(createListDto, 'user123');
    });
  });

  describe('findAll', () => {
    it('should return all lists for the user', async () => {
      const mockLists: ListResponseDto[] = [
        {
          id: '1',
          name: 'Test List 1',
          userId: 'user123',
          category: 'Groceries',
          priority: 'medium',
          expiryDate: new Date(),
          color: '#FF0000',
          isArchived: false,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      mockListService.findAll.mockResolvedValue(mockLists);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockLists);
      expect(mockListService.findAll).toHaveBeenCalledWith('user123');
    });
  });

  describe('findOne', () => {
    it('should return a single list', async () => {
      const mockList: ListResponseDto = {
        id: '1',
        name: 'Test List',
        userId: 'user123',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        isArchived: false,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockListService.findOne.mockResolvedValue(mockList);

      const result = await controller.findOne(mockRequest, '1');

      expect(result).toEqual(mockList);
      expect(mockListService.findOne).toHaveBeenCalledWith('1', 'user123');
    });
  });

  describe('update', () => {
    it('should update a list', async () => {
      const updateListDto: Partial<CreateListDto> = {
        name: 'Updated List',
      };
      const mockList: ListResponseDto = {
        id: '1',
        name: 'Updated List',
        userId: 'user123',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        isArchived: false,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockListService.update.mockResolvedValue(mockList);

      const result = await controller.update(mockRequest, '1', updateListDto);

      expect(result).toEqual(mockList);
      expect(mockListService.update).toHaveBeenCalledWith('1', updateListDto, 'user123');
    });
  });

  describe('archive', () => {
    it('should archive a list', async () => {
      const mockList: ListResponseDto = {
        id: '1',
        name: 'Test List',
        userId: 'user123',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        isArchived: true,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockListService.archive.mockResolvedValue(mockList);

      const result = await controller.archive(mockRequest, '1');

      expect(result).toEqual(mockList);
      expect(mockListService.archive).toHaveBeenCalledWith('1', 'user123');
    });
  });

  describe('addItem', () => {
    it('should add an item to a list', async () => {
      const createItemDto: CreateItemDto = {
        name: 'Test Item',
        quantity: '1',
      };
      const mockList: ListResponseDto = {
        id: '1',
        name: 'Test List',
        userId: 'user123',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        isArchived: false,
        items: [{
          id: 'item1',
          name: 'Test Item',
          quantity: '1',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockListService.addItem.mockResolvedValue(mockList);

      const result = await controller.addItem(mockRequest, '1', createItemDto);

      expect(result).toEqual(mockList);
      expect(mockListService.addItem).toHaveBeenCalledWith('1', createItemDto, 'user123');
    });
  });

  describe('updateItem', () => {
    it('should update an item in a list', async () => {
      const updateItemDto: UpdateItemDto = {
        isCompleted: true,
      };
      const mockList: ListResponseDto = {
        id: '1',
        name: 'Test List',
        userId: 'user123',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        isArchived: false,
        items: [{
          id: 'item1',
          name: 'Test Item',
          quantity: '1',
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockListService.updateItem.mockResolvedValue(mockList);

      const result = await controller.updateItem(mockRequest, '1', 'item1', updateItemDto);

      expect(result).toEqual(mockList);
      expect(mockListService.updateItem).toHaveBeenCalledWith('1', 'item1', updateItemDto, 'user123');
    });
  });

  describe('deleteItem', () => {
    it('should delete an item from a list', async () => {
      const mockList: ListResponseDto = {
        id: '1',
        name: 'Test List',
        userId: 'user123',
        category: 'Groceries',
        priority: 'medium',
        expiryDate: new Date(),
        color: '#FF0000',
        isArchived: false,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockListService.deleteItem.mockResolvedValue(mockList);

      const result = await controller.deleteItem(mockRequest, '1', 'item1');

      expect(result).toEqual(mockList);
      expect(mockListService.deleteItem).toHaveBeenCalledWith('1', 'item1', 'user123');
    });
  });
});
