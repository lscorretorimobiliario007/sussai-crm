import { Test, TestingModule } from '@nestjs/testing';
import { ClientesService } from './clientes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientesService', () => {
  let service: ClientesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: PrismaService,
          useValue: {
            cliente: {},
            usuario: {},
            property: {},
            clienteHistorico: {},
            clienteAnotacao: {},
            clienteInteracao: {},
            clienteFavorito: {},
            clienteVisita: {},
            clienteProposta: {},
            clienteDocumento: {},
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
