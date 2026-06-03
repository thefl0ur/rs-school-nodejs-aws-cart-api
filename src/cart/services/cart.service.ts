import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  Cart,
  CartEntity,
  CartItem,
  CartItemEntity,
  CartStatus,
  CartStatuses,
} from '../models';
import { OrderEntity } from '../../order/models/order.entity';
import { Order } from '../../order/models';
import { OrderService } from '../../order/services/order.service';
import { CreateOrderDto, PutCartPayload } from '../../order/type';
import { calculateCartTotal } from '../models-rules';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly orderService: OrderService,
  ) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const entity = await this.getOpenCartEntity(userId);
    return entity ? this.toCart(entity) : null;
  }

  async createByUserId(userId: string): Promise<Cart> {
    const created = this.cartRepository.create({
      user_id: userId,
      status: CartStatus.OPEN,
    });
    const saved = await this.cartRepository.save(created);
    return this.toCart({ ...saved, items: [] });
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const existing = await this.findByUserId(userId);
    return existing ?? (await this.createByUserId(userId));
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    let cart = await this.getOpenCartEntity(userId);
    if (!cart) {
      const created = this.cartRepository.create({
        user_id: userId,
        status: CartStatus.OPEN,
      });
      cart = await this.cartRepository.save(created);
    }

    const existingItem = (cart.items ?? []).find(
      (it) => it.product_id === payload.product.id,
    );

    if (!existingItem) {
      if (payload.count > 0) {
        await this.cartItemRepository.save({
          cart_id: cart.id,
          product_id: payload.product.id,
          count: payload.count,
        });
      }
    } else if (payload.count === 0) {
      await this.cartItemRepository.delete({
        cart_id: cart.id,
        product_id: payload.product.id,
      });
    } else {
      existingItem.count = payload.count;
      await this.cartItemRepository.save(existingItem);
    }

    cart.updated_at = new Date();
    await this.cartRepository.update(cart.id, { updated_at: cart.updated_at });

    const refreshed = await this.getOpenCartEntity(userId);
    return this.toCart(refreshed);
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.getOpenCartEntity(userId);
    if (cart) {
      await this.cartRepository.delete({ id: cart.id });
    }
  }

  async checkout(userId: string, payload: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager
        .getRepository(CartEntity)
        .createQueryBuilder('c')
        .setLock('pessimistic_write')
        .where('c.user_id = :userId AND c.status = :status', {
          userId,
          status: CartStatus.OPEN,
        })
        .getOne();

      if (!cart) {
        throw new BadRequestException('Cart is empty');
      }

      const items = await manager
        .getRepository(CartItemEntity)
        .find({ where: { cart_id: cart.id } });

      if (!items.length) {
        throw new BadRequestException('Cart is empty');
      }

      const cartForTotal: CartItem[] = items.map((item) => ({
        product: { id: item.product_id, title: '', description: '', price: 0 },
        count: item.count,
      }));
      const total = calculateCartTotal(cartForTotal);

      const orderEntity = manager.getRepository(OrderEntity).create({
        user_id: userId,
        cart_id: cart.id,
        delivery: payload.address,
        payment: {},
        comments: '',
        status: 'ORDERED',
        total: String(total),
      });
      const savedOrder = await manager
        .getRepository(OrderEntity)
        .save(orderEntity);

      await manager
        .getRepository(CartEntity)
        .update(cart.id, {
          status: CartStatus.ORDERED,
          updated_at: new Date(),
        });

      return this.orderService.toOrder(savedOrder);
    });
  }

  private async getOpenCartEntity(userId: string): Promise<CartEntity | null> {
    return this.cartRepository.findOne({
      where: { user_id: userId, status: CartStatus.OPEN },
      relations: ['items'],
    });
  }

  private toCart(cart: CartEntity): Cart {
    return {
      id: cart.id,
      user_id: cart.user_id,
      created_at: this.toMillis(cart.created_at),
      updated_at: this.toMillis(cart.updated_at),
      status: cart.status as unknown as CartStatuses,
      items: (cart.items ?? []).map((item) => this.toCartItem(item)),
    };
  }

  private toCartItem(item: CartItemEntity): CartItem {
    return {
      product: {
        id: item.product_id,
        title: '',
        description: '',
        price: 0,
      },
      count: item.count,
    };
  }

  private toMillis(value: Date | string | number): number {
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'number') {
      return value;
    }
    return new Date(value).getTime();
  }
}
