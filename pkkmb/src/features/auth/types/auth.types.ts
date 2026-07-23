export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PANITIA' | 'MABA';

export interface User {
  id: string;
  name: string;
  nim: string;
  email?: string;
  role: Role;
  pkkmbGroupId?: string;
  pkkmbGroup?: { _id: string; name: string };
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface MeResponse {
  success: boolean;
  data: User;
}
