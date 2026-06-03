import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Address } from '../type';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cart_id!: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payment!: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  delivery!: Address;

  @Column({ type: 'text', default: '' })
  comments!: string;

  @Column({ type: 'text', default: 'ORDERED' })
  status!: string;

  @Column({ type: 'numeric', default: 0 })
  total!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  created_at!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updated_at!: Date;
}
