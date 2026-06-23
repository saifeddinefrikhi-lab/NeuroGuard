export interface PrescriptionResponse {
  id: number;
  patientId: number;
  patientName?: string;
  providerId: number;
  providerName?: string;
  contenu: string;
  notes?: string;
  jour?: string;
  dosage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrescriptionRequest {
  patientId: number;
  providerId?: number;
  contenu: string;
  notes?: string;
  jour?: string;
  dosage?: string;
}
