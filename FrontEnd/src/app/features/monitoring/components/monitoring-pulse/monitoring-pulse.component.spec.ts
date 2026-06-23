import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoringPulseComponent } from './monitoring-pulse.component';
import { WellbeingService } from '../../../../features/wellbeing/services/wellbeing.service';
import { VitalsService } from '../../services/vitals.service';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { ChangeDetectorRef } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';

describe('MonitoringPulseComponent', () => {
    let component: MonitoringPulseComponent;
    let fixture: ComponentFixture<MonitoringPulseComponent>;
    let mockWellbeingService: jasmine.SpyObj<WellbeingService>;
    let mockVitalsService: jasmine.SpyObj<VitalsService>;
    let mockPatientContext: Partial<PatientContextService>;

    beforeEach(async () => {
        mockWellbeingService = jasmine.createSpyObj('WellbeingService', ['getPulse', 'getGameResults']);
        mockVitalsService = jasmine.createSpyObj('VitalsService', ['sendReport']);
        
        const patientIdSubject = new BehaviorSubject<string | null>('test-patient-1');
        mockPatientContext = {
            patientId$: patientIdSubject.asObservable()
        };

        mockWellbeingService.getPulse.and.returnValue(of({
            status: 'stable',
            moodValue: 'Positive',
            sleepValue: '8h',
            hydrationValue: '90%'
        }));

        mockWellbeingService.getGameResults.and.returnValue(of([
            { score: 80 },
            { score: 90 }
        ]));

        await TestBed.configureTestingModule({
            declarations: [MonitoringPulseComponent],
            providers: [
                { provide: WellbeingService, useValue: mockWellbeingService },
                { provide: VitalsService, useValue: mockVitalsService },
                { provide: PatientContextService, useValue: mockPatientContext },
                ChangeDetectorRef
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MonitoringPulseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load pulse data on init', () => {
        expect(mockWellbeingService.getPulse).toHaveBeenCalledWith('test-patient-1');
        expect(component.status).toBe('stable');
        
        const mood = component.summary.find(s => s.label === 'Mood');
        expect(mood?.value).toBe('Positive');
    });

    it('should calculate cognitive average correctly', () => {
        const cog = component.summary.find(s => s.label === 'Cognitive');
        // (80 + 90) / 2 = 85
        expect(cog?.value).toBe('85% (Avg)');
    });

    it('should change recommendation based on status', () => {
        // Test stable
        component['loadPulse']('test-patient-1'); // Manually trigger to test logic if needed, but it happened in init
        expect(component.recommendation).toContain('stable');

        // Test attention
        mockWellbeingService.getPulse.and.returnValue(of({
            status: 'attention',
            moodValue: 'Negative',
            sleepValue: '4h',
            hydrationValue: '50%'
        }));
        component['loadPulse']('test-patient-1');
        expect(component.recommendation).toContain('Immediate attention');
    });

    it('should set statusLabel correctly', () => {
        component.status = 'attention';
        expect(component.statusLabel).toBe('🔴 Attention');
        
        component.status = 'stable';
        expect(component.statusLabel).toBe('🟢 Stable');
    });
});
