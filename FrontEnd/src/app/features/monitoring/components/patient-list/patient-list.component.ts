import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
    selector: 'app-patient-list',
    standalone: false,
    templateUrl: './patient-list.component.html',
    styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {
    patients: User[] = [];
    loading = true;
    error = '';
    caregiverName = '';

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const user = this.authService.currentUser;
        if (!user) {
            this.router.navigate(['/login']);
            return;
        }

        this.caregiverName = user.name;
        this.loadPatients(user.userId.toString());
    }

    loadPatients(caregiverId: string) {
        this.loading = true;
        this.error = '';
        this.userService.getCaregiverPatientsFromUserTable(caregiverId).subscribe({
            next: (patients) => {
                this.patients = patients;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching caregiver patients', err);
                this.error = 'Unable to load patients. Please try again later.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openPatientMonitoring(patient: User) {
        // Navigate relative to current route, appending the patient ID
        this.router.navigate([patient.id], { relativeTo: this.route });
    }

    getInitial(name: string): string {
        return name ? name.charAt(0).toUpperCase() : '?';
    }

    getAvatarColor(index: number): string {
        const colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
            '#f97316', '#eab308', '#22c55e', '#14b8a6',
            '#06b6d4', '#3b82f6'
        ];
        return colors[index % colors.length];
    }
}
