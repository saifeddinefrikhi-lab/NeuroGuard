export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'caregiver' | 'doctor' | 'admin';
  avatar?: string;
  longitude?: number;
  latitude?: number;
  altitude?: number;
}
