import { Component, EventEmitter, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { WellbeingService } from '../../../../core/services/wellbeing.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-mood-selector',
    standalone: false,
    templateUrl: './mood-selector.component.html',
    styleUrls: ['./mood-selector.component.scss']
})
export class MoodSelectorComponent implements OnInit {
    @Output() moodSelected = new EventEmitter<string>();

    moods = [
        { label: 'Happy', emoji: '😊', color: '#2ed8b6' },
        { label: 'Neutral', emoji: '😐', color: '#ffb64d' },
        { label: 'Agitated', emoji: '😰', color: '#ff5370' },
        { label: 'Sad', emoji: '😢', color: '#4099ff' },
        { label: 'Tired', emoji: '😴', color: '#73b4ff' }
    ];

    selectedMood: string | null = null;
    isProcessing = false;

    constructor(
        private wellbeingService: WellbeingService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadLatestMood();
    }

    loadLatestMood() {
        const user = this.authService.currentUser;
        if (user) {
            this.wellbeingService.getLatestMood(user.userId.toString()).subscribe({
                next: (mood) => {
                    if (mood) {
                        this.selectedMood = mood.moodLabel;
                        this.cdr.detectChanges();
                    }
                },
                error: (err) => console.error('Error fetching latest mood', err)
            });
        }
    }

    selectMood(mood: any, event?: Event) {
        if (event) {
            event.stopPropagation();
        }

        if (this.isProcessing) return;

        this.selectedMood = mood.label;
        const user = this.authService.currentUser;

        if (user) {
            this.isProcessing = true;
            this.wellbeingService.saveMood({
                userId: user.userId.toString(),
                moodLabel: mood.label,
                emoji: mood.emoji
            }).subscribe({
                next: (res) => {
                    console.log('Mood saved successfully', res);
                    this.isProcessing = false;
                    this.moodSelected.emit(mood.label);
                },
                error: (err) => {
                    console.error('Error saving mood', err);
                    this.isProcessing = false;
                }
            });
        }
    }
}
