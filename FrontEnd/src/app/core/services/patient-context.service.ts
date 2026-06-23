import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Holds the currently selected patient ID so all monitoring
 * child components can react to which patient is being viewed.
 */
@Injectable({ providedIn: 'root' })
export class PatientContextService {
    private patientIdSubject = new BehaviorSubject<string>('');
    patientId$ = this.patientIdSubject.asObservable();

    setPatientId(id: string) {
        this.patientIdSubject.next(id);
    }

    get currentPatientId(): string {
        return this.patientIdSubject.value;
    }

    clear() {
        this.patientIdSubject.next('');
    }
}
