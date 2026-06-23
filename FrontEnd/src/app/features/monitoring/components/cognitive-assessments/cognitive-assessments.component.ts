import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CognitiveService } from '../../services/cognitive.service';
import { CognitiveEntry } from '../../models/monitoring.models';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-cognitive-assessments',
    standalone: false,
    templateUrl: './cognitive-assessments.component.html',
    styleUrls: ['./cognitive-assessments.component.scss']
})
export class CognitiveAssessmentsComponent implements OnInit, OnDestroy {
    clinicalTests: CognitiveEntry[] = [];
    miniGames: CognitiveEntry[] = [];
    loading = true;
    private sub: Subscription | null = null;

    constructor(
        private cognitiveService: CognitiveService,
        private patientContext: PatientContextService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.sub = this.patientContext.patientId$.subscribe(patientId => {
            if (patientId) {
                console.log('[CognitiveAssessments] Fetching data for patient:', patientId);
                this.loading = true;
                this.cognitiveService.getCognitiveData(patientId).subscribe(data => {
                    this.miniGames = data;
                    this.loading = false;
                    this.cdr.detectChanges();
                });
            }
        });
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }

    getTrendIcon(trend: string): string {
        return trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove';
    }

    getTrendColor(trend: string): string {
        return trend === 'up' ? '#2ed8b6' : trend === 'down' ? '#ff5370' : '#888';
    }

    getScorePercent(entry: CognitiveEntry): number {
        return Math.round((entry.score / entry.maxScore) * 100);
    }
}
