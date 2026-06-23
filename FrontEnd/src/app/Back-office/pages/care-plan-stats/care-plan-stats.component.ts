import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarePlanService } from 'src/app/core/services/care-plan.service';
import { CarePlanStatsResponse, CarePlanSectionStatDto } from 'src/app/core/models/care-plan.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import {
  BarChartOutline,
  PieChartOutline,
  RiseOutline,
  FallOutline,
  HeartOutline,
  CalendarOutline,
  CheckCircleOutline,
  ClockCircleOutline,
} from '@ant-design/icons-angular/icons';

const SECTION_LABELS: Record<string, string> = {
  nutrition: 'Nutrition',
  sleep: 'Sommeil',
  activity: 'Activité',
  medication: 'Médication',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
};

@Component({
  selector: 'app-care-plan-stats',
  standalone: true,
  imports: [CommonModule, CardComponent, IconDirective],
  templateUrl: './care-plan-stats.component.html',
  styleUrl: './care-plan-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarePlanStatsComponent implements OnInit {
  private carePlanService = inject(CarePlanService);
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);

  stats: CarePlanStatsResponse | null = null;
  loading = true;
  errorMessage = '';

  sectionLabels = SECTION_LABELS;
  priorityLabels = PRIORITY_LABELS;

  constructor() {
    this.iconService.addIcon?.(
      BarChartOutline,
      PieChartOutline,
      RiseOutline,
      FallOutline,
      HeartOutline,
      CalendarOutline,
      CheckCircleOutline,
      ClockCircleOutline
    );
  }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';
    this.carePlanService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Erreur lors du chargement des statistiques.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getSectionLabel(section: string): string {
    return SECTION_LABELS[section] || section;
  }

  getPriorityLabel(priority: string): string {
    return PRIORITY_LABELS[priority] || priority;
  }

  totalTodo(section: CarePlanSectionStatDto): number {
    return section.todo + section.done;
  }

  donePercent(section: CarePlanSectionStatDto): number {
    const total = section.todo + section.done;
    return total === 0 ? 0 : Math.round((section.done / total) * 100);
  }
}
