// ===== Vitals =====
export interface VitalsEntry {
    heartRate: number;
    bloodPressure: { systolic: number; diastolic: number };
    temperature: number;
    oxygenSaturation: number;
    timestamp: Date;
    status: 'normal' | 'warning' | 'critical';
}

// ===== Cognitive =====
export interface CognitiveEntry {
    testName: string;
    score: number;
    maxScore: number;
    date: Date;
    type: 'clinical' | 'mini-game';
    trend: 'up' | 'down' | 'stable';
}

// ===== Sleep =====
export interface SleepEntry {
    date: Date;
    hours: number;
    disturbances: number;
    quality: 'Good' | 'Moderate' | 'Poor';
    agitationEvents?: number;
}

// ===== Behavior =====
export interface BehaviorEntry {
    id: number;
    date: Date;
    time: string;
    type: 'Agitation' | 'Wandering' | 'Confusion' | 'Aggression' | 'Sundowning';
    severity: 'Mild' | 'Moderate' | 'Severe';
    notes: string;
    duration?: number; // minutes
}

// ===== Nutrition =====
export interface NutritionEntry {
    date: Date;
    calories: number;
    hydrationPercent: number;
    meals: { name: string; type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'; logged: boolean }[];
    protein: number;
    carbs: number;
    fats: number;
}

// ===== Patient Status =====
export interface PatientStatus {
    mood: string;
    sleep: string;
    hydration: string;
    cognitive: string;
    overall: 'stable' | 'monitor' | 'attention';
    recommendation: string;
}

// ===== Alert =====
export interface MonitoringAlert {
    id: number;
    label: string;
    level: 'low' | 'medium' | 'high';
    detail: string;
    icon: string;
    timestamp: Date;
}

// ===== Task =====
export interface MonitoringTask {
    id: number;
    text: string;
    icon: string;
    done: boolean;
    priority: 'low' | 'medium' | 'high';
    time: string;
    createdAt?: string | Date; // ISO string from backend
}
