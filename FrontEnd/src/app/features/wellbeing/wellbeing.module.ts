import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WellbeingRoutingModule } from './wellbeing-routing.module';
import { SharedModule } from '../../theme/shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';

// Dashboard
import { WellbeingDashboardComponent } from './components/wellbeing-dashboard/wellbeing-dashboard.component';

// Existing Components
import { MoodSelectorComponent } from './components/mood-selector/mood-selector.component';
import { CognitivePulseComponent } from './components/cognitive-pulse/cognitive-pulse.component';
import { SleepMonitorComponent } from './components/sleep-monitor/sleep-monitor.component';
import { HydrationTrackerComponent } from './components/hydration-tracker/hydration-tracker.component';
import { DailyGoalsComponent } from './components/daily-goals/daily-goals.component';
import { SocialPulseComponent } from './components/social-pulse/social-pulse.component';

// New Components — Phase 1
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { MoodTrendComponent } from './components/mood-trend/mood-trend.component';
import { PatientPulseComponent } from './components/patient-pulse/patient-pulse.component';
import { TodayTasksComponent } from './components/today-tasks/today-tasks.component';
import { RiskIndicatorComponent } from './components/risk-indicator/risk-indicator.component';
import { CognitiveGamesComponent } from './components/cognitive-games/cognitive-games.component';
import { MemoryVaultComponent } from './components/memory-vault/memory-vault.component';

@NgModule({
    declarations: [
        WellbeingDashboardComponent,
        // Existing
        MoodSelectorComponent,
        CognitivePulseComponent,
        SleepMonitorComponent,
        HydrationTrackerComponent,
        DailyGoalsComponent,
        SocialPulseComponent,
        // New
        SummaryCardsComponent,
        MoodTrendComponent,
        PatientPulseComponent,
        TodayTasksComponent,
        RiskIndicatorComponent,
        CognitiveGamesComponent,
        MemoryVaultComponent
    ],
    imports: [
        CommonModule,
        WellbeingRoutingModule,
        SharedModule,
        NgApexchartsModule
    ]
})
export class WellbeingModule { }
