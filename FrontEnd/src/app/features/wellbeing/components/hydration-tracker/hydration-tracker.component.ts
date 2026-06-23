import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { WellbeingService } from '../../../../core/services/wellbeing.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-hydration-tracker',
    standalone: false,
    templateUrl: './hydration-tracker.component.html',
    styleUrls: ['./hydration-tracker.component.scss']
})
export class HydrationTrackerComponent implements OnInit {
    @Input() targetGlasses = 8;
    @Input() currentGlasses = 0;
    isProcessing = false;

    constructor(
        private wellbeingService: WellbeingService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadInitialHydration();
    }

    loadInitialHydration() {
        const user = this.authService.currentUser;
        if (user) {
            this.wellbeingService.getTodayHydration(user.userId.toString()).subscribe({
                next: (res) => {
                    this.currentGlasses = res.glassesCount;
                    this.targetGlasses = res.targetGlasses;
                    this.cdr.detectChanges();
                },
                error: (err) => console.error('Error fetching hydration', err)
            });
        }
    }

    get glasses() {
        return Array(this.targetGlasses).fill(0).map((_, i) => i < this.currentGlasses);
    }

    addGlass(event?: Event) {
        if (event) {
            event.stopPropagation();
        }

        if (this.isProcessing || this.currentGlasses >= this.targetGlasses) {
            return;
        }

        const user = this.authService.currentUser;
        if (user) {
            this.isProcessing = true;
            this.wellbeingService.addHydration(user.userId.toString()).subscribe({
                next: (res) => {
                    this.currentGlasses = res.glassesCount;
                    this.targetGlasses = res.targetGlasses;
                    this.isProcessing = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error adding hydration', err);
                    this.isProcessing = false;
                }
            });
        } else {
            this.currentGlasses++;
        }
    }

    reset() {
        const user = this.authService.currentUser;
        if (user && !this.isProcessing) {
            this.isProcessing = true;
            this.wellbeingService.resetHydration(user.userId.toString()).subscribe({
                next: (res) => {
                    this.currentGlasses = res.glassesCount;
                    this.isProcessing = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error resetting hydration', err);
                    this.isProcessing = false;
                }
            });
        }
    }
}
