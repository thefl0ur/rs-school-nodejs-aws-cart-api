export * from './user.entity';

export interface User {
  id?: string;
  name: string;
  email?: string;
  password: string;
}
