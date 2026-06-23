import { Component, Input } from '@angular/core';
import { PatientPulseDTO } from '../../../../core/models/wellbeing.model';

@Component({
    selector: 'app-summary-cards',
    standalone: false,
    templateUrl: './summary-cards.component.html',
    styleUrls: ['./summary-cards.component.scss']
})
export class SummaryCardsComponent {
    @Input() set data(value: PatientPulseDTO | null) {
        if (value) {
            this.updateCards(value);
        }
    }

    cards = [
        {
            title: 'Mood Today',
            value: '😊 Happy',
            trend: 'up',
            trendText: '+12% this week',
            icon: 'sentiment_satisfied',
            color: '#2ed8b6',
            bgColor: 'rgba(46, 216, 182, 0.12)'
        },
        {
            title: 'Sleep Last Night',
            value: '7.5h',
            trend: 'up',
            trendText: 'Good quality',
            icon: 'bedtime',
            color: '#6c5ce7',
            bgColor: 'rgba(108, 92, 231, 0.12)',
            badge: 'Good'
        },
        {
            title: 'Hydration',
            value: '75%',
            trend: 'neutral',
            trendText: '6 of 8 glasses',
            icon: 'water_drop',
            color: '#4099ff',
            bgColor: 'rgba(64, 153, 255, 0.12)',
            glowing: false
        },
        {
            title: 'Clarity Score',
            value: '4.2',
            trend: 'down',
            trendText: '-0.3 vs yesterday',
            icon: 'bolt',
            color: '#ffb64d',
            bgColor: 'rgba(255, 182, 77, 0.12)',
            maxScore: 5
        }
    ];

    private updateCards(data: PatientPulseDTO) {
        this.cards[0].value = data.moodValue;

        this.cards[1].value = data.sleepValue;
        if (data.sleepQuality) {
            this.cards[1].badge = data.sleepQuality;
            this.cards[1].trendText = `${data.sleepQuality} quality`;
            this.cards[1].trend = data.sleepQuality.toLowerCase() === 'good' ? 'up' : (data.sleepQuality.toLowerCase() === 'poor' ? 'down' : 'neutral');
        } else {
            // Fallback parsing from sleepValue if quality isn't explicitly set yet
            if (data.sleepValue.includes('Good')) {
                this.cards[1].badge = 'Good';
                this.cards[1].trendText = 'Good quality';
                this.cards[1].trend = 'up';
            } else if (data.sleepValue.includes('Poor')) {
                this.cards[1].badge = 'Poor';
                this.cards[1].trendText = 'Poor quality';
                this.cards[1].trend = 'down';
            } else if (data.sleepValue.includes('Moderate')) {
                this.cards[1].badge = 'Moderate';
                this.cards[1].trendText = 'Moderate quality';
                this.cards[1].trend = 'neutral';
            }
        }

        this.cards[2].value = data.hydrationValue;
        // The backed pulse doesn't provide cognitive right now, keep placeholder or empty string
        this.cards[3].value = '4.2';
    }

    getTrendIcon(trend: string): string {
        switch (trend) {
            case 'up': return 'trending_up';
            case 'down': return 'trending_down';
            default: return 'remove';
        }
    }

    getTrendColor(trend: string): string {
        switch (trend) {
            case 'up': return '#2ed8b6';
            case 'down': return '#ff5370';
            default: return '#888';
        }
    }
}
