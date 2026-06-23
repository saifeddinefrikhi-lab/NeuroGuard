// user-request.dto.ts
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  age?: number;
  role: string;          // e.g., "ADMIN", "PATIENT", etc.
  password: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  age?: number;
  role?: string;
  password?: string;
}