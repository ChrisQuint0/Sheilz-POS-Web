export type Role = 'Administrator' | 'Manager' | 'Cashier';
export type Status = 'Active' | 'Inactive';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role: Role;
  status: Status;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}
