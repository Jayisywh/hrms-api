import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PrismaService } from '../prisma.service';

describe('PositionsService', () => {
  let service: PositionsService;

  const prismaServiceMock = {
    position: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionsService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<PositionsService>(PositionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllPositions', () => {
    it('should return all positions when no search is provided', async () => {
      const positions = [{ id: 'p1' }];
      prismaServiceMock.position.findMany.mockResolvedValue(positions);

      const result = await service.getAllPositions();

      expect(result).toEqual(positions);
      expect(prismaServiceMock.position.findMany).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should search by code/name when search is provided', async () => {
      prismaServiceMock.position.findMany.mockResolvedValue([]);

      await service.getAllPositions('engineer');

      expect(prismaServiceMock.position.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { code: { contains: 'engineer', mode: 'insensitive' } },
            { name: { contains: 'engineer', mode: 'insensitive' } },
          ],
        },
      });
    });
  });

  describe('getPositionById', () => {
    it('should return a position when found', async () => {
      const position = { id: 'p1', name: 'Engineer' };
      prismaServiceMock.position.findUnique.mockResolvedValue(position);

      const result = await service.getPositionById('p1');

      expect(result).toEqual(position);
      expect(prismaServiceMock.position.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });

    it('should throw NotFoundException when position is missing', async () => {
      prismaServiceMock.position.findUnique.mockResolvedValue(null);

      await expect(service.getPositionById('p1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPosition', () => {
    const dto = {
      code: 'ENG',
      name: 'Engineer',
      departmentId: 'd1',
    };

    it('should throw NotFoundException when department does not exist', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue(null);

      await expect(service.createPosition(dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaServiceMock.position.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when code already exists', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue({ id: 'p1' });

      await expect(service.createPosition(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaServiceMock.position.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when name exists in the department', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue(null);
      prismaServiceMock.position.findFirst.mockResolvedValue({ id: 'p1' });

      await expect(service.createPosition(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create a position when validations pass', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue(null);
      prismaServiceMock.position.findFirst.mockResolvedValue(null);
      const created = { id: 'p2', ...dto };
      prismaServiceMock.position.create.mockResolvedValue(created);

      const result = await service.createPosition(dto);

      expect(result).toEqual(created);
      expect(prismaServiceMock.position.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('updatePosition', () => {
    it('should throw NotFoundException when position is missing', async () => {
      prismaServiceMock.position.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePosition('p1', { name: 'Senior' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaServiceMock.position.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when new department does not exist', async () => {
      const current = { id: 'p1', departmentId: 'd1', name: 'Engineer' };
      prismaServiceMock.position.findUnique
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(null);
      prismaServiceMock.department.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePosition('p1', { departmentId: 'd2' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update the position when validations pass', async () => {
      const current = { id: 'p1', departmentId: 'd1', name: 'Engineer' };
      prismaServiceMock.position.findUnique.mockResolvedValue(current);
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findFirst.mockResolvedValue(null);
      const updated = { ...current, name: 'Senior Engineer' };
      prismaServiceMock.position.update.mockResolvedValue(updated);

      const result = await service.updatePosition('p1', {
        name: 'Senior Engineer',
      });

      expect(result).toEqual(updated);
      expect(prismaServiceMock.position.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { name: 'Senior Engineer' },
      });
    });
  });

  describe('deletePosition', () => {
    it('should throw NotFoundException when position is missing', async () => {
      prismaServiceMock.position.findUnique.mockResolvedValue(null);

      await expect(service.deletePosition('p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when employees are assigned', async () => {
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p1',
        _count: { employees: 1 },
      });

      await expect(service.deletePosition('p1')).rejects.toThrow(
        ConflictException,
      );
      expect(prismaServiceMock.position.delete).not.toHaveBeenCalled();
    });

    it('should delete the position when no employees are assigned', async () => {
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p1',
        _count: { employees: 0 },
      });
      prismaServiceMock.position.delete.mockResolvedValue({ id: 'p1' });

      const result = await service.deletePosition('p1');

      expect(result).toEqual({ id: 'p1' });
      expect(prismaServiceMock.position.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });
  });
});
