/**
 * User Interface
 */
export interface IUser {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
}

/**
 * User from JWT payload
 */
export interface IUserFromToken {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}
