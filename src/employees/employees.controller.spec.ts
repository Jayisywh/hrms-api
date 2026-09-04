import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

describe('EmployeesController', () => {
  let controller: EmployeesController;

  const serviceMock = {
    getAllEmployees: jest.fn(),
    getEmployeeById: jest.fn(),
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        { provide: EmployeesService, useValue: serviceMock },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findAll to the service with search query', async () => {
    serviceMock.getAllEmployees.mockResolvedValue([]);
    await controller.findAll('john');

    expect(serviceMock.getAllEmployees).toHaveBeenCalledWith('john');
  });

  it('should delegate findOne to the service', async () => {
    serviceMock.getEmployeeById.mockResolvedValue({ id: 'e1' });
    await controller.findOne('e1');

    expect(serviceMock.getEmployeeById).toHaveBeenCalledWith('e1');
  });

  it('should delegate create to the service', async () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      hireDate: '2026-01-01',
      departmentId: 'd1',
      positionId: 'p1',
    };
    serviceMock.createEmployee.mockResolvedValue({ id: 'e1' });
    await controller.create(dto);

    expect(serviceMock.createEmployee).toHaveBeenCalledWith(dto);
  });

  it('should delegate update to the service', async () => {
    serviceMock.updateEmployee.mockResolvedValue({ id: 'e1' });
    await controller.update('e1', { firstName: 'Jane' });

    expect(serviceMock.updateEmployee).toHaveBeenCalledWith('e1', {
      firstName: 'Jane',
    });
  });

  it('should delegate delete to the service', async () => {
    serviceMock.deleteEmployee.mockResolvedValue({ id: 'e1' });
    await controller.delete('e1');

    expect(serviceMock.deleteEmployee).toHaveBeenCalledWith('e1');
  });
});
