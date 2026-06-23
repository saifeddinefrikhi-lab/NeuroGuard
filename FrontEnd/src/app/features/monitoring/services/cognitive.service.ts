import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CognitiveEntry } from '../models/monitoring.models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CognitiveService {
    // We hit the wellbeing service directly
    private wellbeingApi = `${environment.wellbeingApi}/cognitive-games`;

    constructor(private http: HttpClient) { }

    getCognitiveData(patientId: string): Observable<CognitiveEntry[]> {
        console.log('[CognitiveService] Bulk fetching for patient:', patientId);
        return this.http.get<any[]>(`${this.wellbeingApi}/patient/${patientId}`).pipe(
            map(results => this.processGameResults(results)),
            catchError(error => {
                console.error('Error fetching bulk cognitive data:', error);
                return of([]);
            })
        );
    }

    getCognitiveDataByGame(patientId: string, gameType: string): Observable<CognitiveEntry> {
        console.log(`[CognitiveService] Granular fetch for ${gameType} for patient ${patientId}`);
        return this.http.get<any[]>(`${this.wellbeingApi}/patient/${patientId}/game/${gameType}`).pipe(
            map(results => {
                if (!results || results.length === 0) {
                     return { testName: gameType, score: 0, maxScore: 100, date: new Date(), type: 'mini-game', trend: 'stable' };
                }
                const sorted = results.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                const latest = sorted[0];
                return {
                    testName: latest.gameType,
                    score: latest.score,
                    maxScore: 100,
                    date: new Date(latest.timestamp),
                    type: 'mini-game',
                    trend: sorted.length > 1 ? (latest.score >= sorted[1].score ? 'up' : 'down') : 'stable'
                };
            })
        );
    }

    private processGameResults(results: any[]): CognitiveEntry[] {
        if (!results || results.length === 0) return [];

        // Group by gameType
        const grouped = results.reduce((acc, curr) => {
            if (!acc[curr.gameType]) acc[curr.gameType] = [];
            acc[curr.gameType].push(curr);
            return acc;
        }, {} as Record<string, any[]>);

        const entries: CognitiveEntry[] = [];
        
        const formatName = (type: string) => {
            if (type === 'MEMORY') return 'Memory Match';
            if (type === 'ORIENTATION') return 'Orientation Check';
            if (type === 'WORD_RECALL') return 'Word Recall';
            return type;
        };

        for (const [gameType, gameResults] of Object.entries(grouped)) {
            const resultsArray = gameResults as any[];
            // Sort by most recent first
            const sorted = resultsArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const latest = sorted[0];
            
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (sorted.length > 1) {
                 const previous = sorted[1];
                 if (latest.score > previous.score) trend = 'up';
                 else if (latest.score < previous.score) trend = 'down';
            }

            entries.push({
                testName: formatName(gameType),
                score: latest.score,
                maxScore: 100,
                date: new Date(latest.timestamp),
                type: 'mini-game',
                trend: trend
            });
        }
        
        return entries;
    }
}
