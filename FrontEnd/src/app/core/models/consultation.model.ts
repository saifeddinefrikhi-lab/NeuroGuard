// src/app/models/consultation.model.ts

export enum ConsultationType {
  PRESENTIAL = 'PRESENTIAL',
  ONLINE = 'ONLINE'
}

export enum ConsultationStatus {
  SCHEDULED = 'SCHEDULED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Consultation {
  id: number;
  title: string;
  description?: string;
  startTime: string; // ISO format
  endTime?: string;
  type: ConsultationType;
  status: ConsultationStatus;
  meetingLink?: string;
  providerId: number;
  patientId: number;
  patientName?: string;
  providerName?: string;
  caregiverId?: number;
  createdAt: string;
}

export interface ConsultationRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  type: ConsultationType;
  patientId: number;
  caregiverId?: number;
  /** Obligatoire quand un caregiver crée la consultation. Ignoré quand un provider crée. */
  providerId?: number;
}