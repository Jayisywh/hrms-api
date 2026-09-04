import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma.service';

describe('EmployeesService', () => {
  let service: EmployeesService;

  const prismaServiceMock = {
    employee: {
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
    position: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllEmployees', () => {
    it('should return all employees when no search is provided', async () => {
      const employees = [{ id: 'e1' }];
      prismaServiceMock.employee.findMany.mockResolvedValue(employees);

      const result = await service.getAllEmployees();

      expect(result).toEqual(employees);
      expect(prismaServiceMock.employee.findMany).toHaveBeenCalledTimes(1);
    });

    it('should search by code/firstName/lastName when search is provided', async () => {
      prismaServiceMock.employee.findMany.mockResolvedValue([]);

      await service.getAllEmployees('john');

      expect(prismaServiceMock.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { employeeCode: { contains: 'john', mode: 'insensitive' } },
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });
  });

  describe('getEmployeeById', () => {
    it('should return an employee when found', async () => {
      const employee = { id: 'e1', firstName: 'John' };
      prismaServiceMock.employee.findUnique.mockResolvedValue(employee);

      const result = await service.getEmployeeById('e1');

      expect(result).toEqual(employee);
      expect(prismaServiceMock.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'e1' } }),
      );
    });

    it('should throw NotFoundException when employee is missing', async () => {
      prismaServiceMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.getEmployeeById('e1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createEmployee', () => {
    const baseDto = {
      firstName: 'John',
      lastName: 'Doe',
      hireDate: '2026-01-01',
      departmentId: 'd1',
      positionId: 'p1',
    };

    it('should throw NotFoundException when department does not exist', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue(null);

      await expect(service.createEmployee(baseDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaServiceMock.employee.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when position does not exist', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue(null);

      await expect(service.createEmployee(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when position belongs to another department', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p1',
        departmentId: 'd2',
      });

      await expect(service.createEmployee(baseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when the user is already linked', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p1',
        departmentId: 'd1',
      });
      prismaServiceMock.user.findUnique.mockResolvedValue({ id: 'u1' });
      prismaServiceMock.employee.findUnique.mockResolvedValue({ id: 'e2' });

      await expect(
        service.createEmployee({ ...baseDto, userId: 'u1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should auto-generate the employee code and create the employee', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p1',
        departmentId: 'd1',
      });
      prismaServiceMock.employee.count.mockResolvedValue(2);
      prismaServiceMock.employee.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      const created = { id: 'e1', employeeCode: 'EMP-000003', ...baseDto };
      prismaServiceMock.employee.create.mockResolvedValue(created);

      const result = await service.createEmployee(baseDto);

      expect(result).toEqual(created);
      expect(prismaServiceMock.employee.create).toHaveBeenCalledWith({
        data: {
          employeeCode: 'EMP-000003',
          firstName: 'John',
          lastName: 'Doe',
          hireDate: new Date(baseDto.hireDate),
          departmentId: 'd1',
          positionId: 'p1',
        },
      });
    });

    it('should throw ConflictException when a provided employee code already exists', async () => {
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p1',
        departmentId: 'd1',
      });
      prismaServiceMock.employee.findUnique.mockResolvedValue({ id: 'e9' });

      await expect(
        service.createEmployee({ ...baseDto, employeeCode: 'EMP-000001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateEmployee', () => {
    const current = {
      id: 'e1',
      departmentId: 'd1',
      positionId: 'p1',
      firstName: 'John',
    };

    it('should throw NotFoundException when employee is missing', async () => {
      prismaServiceMock.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEmployee('e1', { firstName: 'Jane' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new department does not exist', async () => {
      prismaServiceMock.employee.findUnique
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(null);
      prismaServiceMock.department.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEmployee('e1', { departmentId: 'd2' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new position is in another department', async () => {
      prismaServiceMock.employee.findUnique
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(null);
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd2',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p2',
        departmentId: 'd3',
      });

      await expect(
        service.updateEmployee('e1', { departmentId: 'd2', positionId: 'p2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update the employee when validations pass', async () => {
      prismaServiceMock.employee.findUnique
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(null);
      prismaServiceMock.department.findUnique.mockResolvedValue({
        id: 'd1',
      });
      prismaServiceMock.position.findUnique.mockResolvedValue({
        id: 'p1',
        departmentId: 'd1',
      });
      const updated = { ...current, firstName: 'Jane' };
      prismaServiceMock.employee.update.mockResolvedValue(updated);

      const result = await service.updateEmployee('e1', {
        firstName: 'Jane',
      });

      expect(result).toEqual(updated);
      expect(prismaServiceMock.employee.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: { firstName: 'Jane' },
      });
    });
  });

  describe('deleteEmployee', () => {
    it('should throw NotFoundException when employee is missing', async () => {
      prismaServiceMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.deleteEmployee('e1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete the employee when found', async () => {
      prismaServiceMock.employee.findUnique
        .mockResolvedValueOnce({ id: 'e1' })
        .mockResolvedValueOnce({ id: 'e1' });
      prismaServiceMock.employee.delete.mockResolvedValue({ id: 'e1' });

      const result = await service.deleteEmployee('e1');

      expect(result).toEqual({ id: 'e1' });
      expect(prismaServiceMock.employee.delete).toHaveBeenCalledWith({
        where: { id: 'e1' },
      });
    });
  });
});
