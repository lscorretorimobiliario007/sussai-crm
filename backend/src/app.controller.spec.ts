import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return backend health payload', () => {
      expect(appController.teste()).toEqual({
        ok: true,
        mensagem: 'Backend funcionando',
      });
    });

    it('should return healthy status', async () => {
      const result = await appController.health();
      expect(result.ok).toBe(true);
      expect(result.status).toBe('healthy');
    });
  });
});
