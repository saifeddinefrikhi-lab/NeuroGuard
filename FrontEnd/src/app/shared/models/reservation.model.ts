export interface Reservation {
  id?: number;
  patientId: number;
  providerId: number;
  reservationDate: string;
  timeSlot: string;
  consultationType: 'ONLINE' | 'PRESENTIAL';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DELETED' | 'COMPLETED';
  notes?: string;
  consultationId?: number;
  createdAt?: string;
  patientName?: string;
  providerName?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reserved?: boolean;
}

export interface DayAvailability {
  date: string;
  slots: TimeSlot[];
}

export interface Provider {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization?: string;
}
