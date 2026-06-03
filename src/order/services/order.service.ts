import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../models';
import { OrderEntity } from '../models/order.entity';
import { Address } from '../type';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async getAll(): Promise<Order[]> {
    const entities = await this.orderRepository.find();
    return entities.map((entity) => this.toOrder(entity));
  }

  async findById(orderId: string): Promise<Order | null> {
    const entity = await this.orderRepository.findOne({ where: { id: orderId } });
    return entity ? this.toOrder(entity) : null;
  }

  toOrder(entity: OrderEntity): Order {
    return {
      id: entity.id,
      userId: entity.user_id,
      cartId: entity.cart_id,
      items: [],
      address: entity.delivery as Address,
      payment: entity.payment ?? {},
      comments: entity.comments,
      status: entity.status,
      total: Number(entity.total),
    };
  }
}
