import { Test, TestingModule } from '@nestjs/testing';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

describe('PositionsController', () => {
  let controller: PositionsController;

  const serviceMock = {
    getAllPositions: jest.fn(),
    getPositionById: jest.fn(),
    createPosition: jest.fn(),
    updatePosition: jest.fn(),
    deletePosition: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [{ provide: PositionsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<PositionsController>(PositionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getAll to the service with search query', async () => {
    serviceMock.getAllPositions.mockResolvedValue([]);
    await controller.getAll('engineer');

    expect(serviceMock.getAllPositions).toHaveBeenCalledWith('engineer');
  });

  it('should delegate getPositionById to the service', async () => {
    serviceMock.getPositionById.mockResolvedValue({ id: 'p1' });
    await controller.getPositionById('p1');

    expect(serviceMock.getPositionById).toHaveBeenCalledWith('p1');
  });

  it('should delegate createPosition to the service', async () => {
    const dto = { code: 'ENG', name: 'Engineer', departmentId: 'd1' };
    serviceMock.createPosition.mockResolvedValue({ id: 'p1' });
    await controller.createPosition(dto);

    expect(serviceMock.createPosition).toHaveBeenCalledWith(dto);
  });

  it('should delegate updatePosition to the service', async () => {
    serviceMock.updatePosition.mockResolvedValue({ id: 'p1' });
    await controller.updatePosition('p1', { name: 'Senior' });

    expect(serviceMock.updatePosition).toHaveBeenCalledWith('p1', {
      name: 'Senior',
    });
  });

  it('should delegate deletePosition to the service', async () => {
    serviceMock.deletePosition.mockResolvedValue({ id: 'p1' });
    await controller.deletePosition('p1');

    expect(serviceMock.deletePosition).toHaveBeenCalledWith('p1');
  });
});
