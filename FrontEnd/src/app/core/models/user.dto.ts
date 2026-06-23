export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  connected?: boolean;
  status?: 'ACTIVE' | 'BANNED' | 'DISABLED';
  bannedUntil?: string; // ISO datetime string
  longitude?: number;
  latitude?: number;
  altitude?: number;
  gender?: string;
  age?: number;
}