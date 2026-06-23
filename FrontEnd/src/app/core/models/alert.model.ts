export interface AlertResponse {
  id: number;
  patientId: number;
  patientName: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string; // allow string for flexibility
  resolved: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string;
}

export interface AlertRequest {
  patientId: number;
  message: string;
  severity?: string; // optional, backend may default
}