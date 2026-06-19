import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserEntity } from '../models';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findOne(name: string): Promise<User | undefined> {
    const entity = await this.usersRepository.findOne({ where: { name } });
    return entity ? this.toUser(entity) : undefined;
  }

  async createOne({ name, password, email }: User): Promise<User> {
    const entity = this.usersRepository.create({ name, password, email });
    const saved = await this.usersRepository.save(entity);
    return this.toUser(saved);
  }

  private toUser(entity: UserEntity): User {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email ?? undefined,
      password: entity.password,
    };
  }
}
