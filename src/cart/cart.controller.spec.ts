import { Test, TestingModule } from '@nestjs/testing';

import { CartController } from './cart.controller';
import { OrderModule } from '../order/order.module';
import { CartService } from './services';

describe('CartController', () => {
  let controller: CartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      imports: [OrderModule],
      providers: [
        {
          provide: CartService,
          useValue: {
            findByUserId: jest.fn(),
            findOrCreateByUserId: jest.fn(),
            updateByUserId: jest.fn(),
            removeByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
