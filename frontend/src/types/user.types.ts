export interface User {
  id: number;
  email: string;
  name: string;
  password?: string; // Optional as we typically don't return passwords
  jwtToken?: string | null;
  accessToken?: string | null;
  createdAt: string;
  updatedAt: string;
  domId?: number | null;
  roleId?: number | null;
  dom?: {
    id: number;
    name: string;
    address: string;
  } | null;
  role?: {
    id: number;
    name: string;
  } | null;
}

export interface UsersApiResponse {
  data: User[];
  total: number;
}
