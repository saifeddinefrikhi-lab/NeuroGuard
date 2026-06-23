export interface Mood {
    id?: number;
    userId: string;
    moodLabel: string;
    emoji: string;
    timestamp?: string;
}

export interface Sleep {
    id?: number;
    userId: string;
    hours: number;
    quality: string;
    date: string;
    disturbances?: number;
}

export interface Hydration {
    id?: number;
    userId: string;
    glassesCount: number;
    targetGlasses: number;
    date: string;
}

export interface PatientPulseDTO {
    moodValue: string;
    sleepValue: string;
    hydrationValue: string;
    status: 'stable' | 'monitor' | 'attention';
    sleepQuality?: string;
}
