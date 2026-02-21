export interface MedicalHistoryRequest {
  patientId: number;
  diagnosis?: string;
  diagnosisDate?: string; // LocalDate as ISO string
  progressionStage?: 'MILD' | 'MODERATE' | 'SEVERE';
  geneticRisk?: string;
  familyHistory?: string;
  environmentalFactors?: string;
  comorbidities?: string;
  medicationAllergies?: string;
  environmentalAllergies?: string;
  foodAllergies?: string;
  surgeries?: Surgery[];
  providerNames?: string[];        // additional providers (by full name)
  caregiverNames?: string[];        // caregivers assigned by username
}

// MedicalHistoryResponse stays the same (already contains caregiverNames)
export interface MedicalHistoryResponse {
  id: number;
  patientId: number;
  patientName: string;
  diagnosis?: string;
  diagnosisDate?: string;
  progressionStage?: string;
  geneticRisk?: string;
  familyHistory?: string;
  environmentalFactors?: string;
  comorbidities?: string;
  medicationAllergies?: string;
  environmentalAllergies?: string;
  foodAllergies?: string;
  surgeries: Surgery[];
  providerIds: number[];
  providerNames: string[];
  caregiverIds: number[];
  caregiverNames: string[];
  files: FileDto[];
  createdAt: string;
  updatedAt: string;
}

export interface Surgery {
  description: string;
  date: string; // ISO date
}

export interface FileDto {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}