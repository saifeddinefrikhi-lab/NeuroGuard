export type CarePlanPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type CarePlanStatus = 'TODO' | 'DONE';

export type CarePlanSection = 'nutrition' | 'sleep' | 'activity' | 'medication';

export interface CarePlanResponse {
  id: number;
  patientId: number;
  patientName?: string;
  providerId: number;
  providerName?: string;
  priority?: CarePlanPriority;
  nutritionStatus?: CarePlanStatus;
  sleepStatus?: CarePlanStatus;
  activityStatus?: CarePlanStatus;
  medicationStatus?: CarePlanStatus;
  nutritionPlan?: string;
  sleepPlan?: string;
  activityPlan?: string;
  medicationPlan?: string;
  /** Deadlines per section (ISO date string) – patient sees timer. */
  nutritionDeadline?: string;
  sleepDeadline?: string;
  activityDeadline?: string;
  medicationDeadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarePlanRequest {
  patientId: number;
  providerId?: number;
  priority?: CarePlanPriority;
  nutritionPlan?: string;
  sleepPlan?: string;
  activityPlan?: string;
  medicationPlan?: string;
  /** Optional deadlines per section (ISO date string). */
  nutritionDeadline?: string;
  sleepDeadline?: string;
  activityDeadline?: string;
  medicationDeadline?: string;
}

/** Chat message between doctor and patient for a care plan */
export interface CarePlanMessageResponse {
  id: number;
  carePlanId: number;
  senderId: number;
  senderName?: string;
  content: string;
  createdAt?: string;
}

export interface CarePlanMessageRequest {
  content: string;
}

export const CARE_PLAN_PRIORITIES: { value: CarePlanPriority; label: string }[] = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' }
];

/** Statistics for admin dashboard (care plans). */
export interface CarePlanSectionStatDto {
  section: string;
  todo: number;
  done: number;
}

export interface CarePlanStatsResponse {
  totalCarePlans: number;
  byPriority: Record<string, number>;
  sectionStats: CarePlanSectionStatDto[];
}
