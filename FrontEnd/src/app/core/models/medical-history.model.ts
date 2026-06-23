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
  providerIds?: number[];
  providerNames?: string[];        // additional providers (by full name)
  caregiverIds?: number[];
  caregiverNames?: string[];        // caregivers assigned by username

  // NEW COGNITIVE AND FUNCTIONAL SCORES
  mmse?: number;            // Mini-Mental State Examination (0-30)
  functionalAssessment?: number;  // 0-10
  adl?: number;             // Activities of Daily Living (0-10)

  // SYMPTOM FLAGS
  memoryComplaints?: boolean;
  behavioralProblems?: boolean;

  // HEALTH RISK FACTORS
  smoking?: boolean;
  cardiovascularDisease?: boolean;
  diabetes?: boolean;
  depression?: boolean;
  headInjury?: boolean;
  hypertension?: boolean;

  // LIFESTYLE & CLINICAL FEATURES
  alcoholConsumption?: number;   // 0-10 scale
  physicalActivity?: number;     // 0-10 scale
  dietQuality?: number;          // 0-10 scale
  sleepQuality?: number;         // 0-10 scale
  bmi?: number;
  cholesterolTotal?: number;     // mg/dL
}

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

  // NEW FIELDS
  mmse?: number;
  functionalAssessment?: number;
  adl?: number;
  memoryComplaints?: boolean;
  behavioralProblems?: boolean;
  smoking?: boolean;
  cardiovascularDisease?: boolean;
  diabetes?: boolean;
  depression?: boolean;
  headInjury?: boolean;
  hypertension?: boolean;
  alcoholConsumption?: number;
  physicalActivity?: number;
  dietQuality?: number;
  sleepQuality?: number;
  bmi?: number;
  cholesterolTotal?: number;
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