export * from './order.entity';

import { Address } from '../type';

export type Order = {
  id: string;
  userId: string;
  cartId: string;
  items: Array<{ productId: string; count: number }>;
  address: Address;
  payment: Record<string, unknown>;
  comments: string;
  status: string;
  total: number;
};
