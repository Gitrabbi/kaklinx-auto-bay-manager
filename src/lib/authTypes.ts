export type UserRole = 'admin' | 'cashier' | 'worker';

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
}
