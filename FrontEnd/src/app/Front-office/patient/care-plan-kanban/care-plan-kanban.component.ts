import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarePlanService } from '../../../core/services/care-plan.service';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CarePlanResponse, CarePlanSection } from '../../../core/models/care-plan.model';
import { formatDeadlineDate, getDeadlineCountdown } from '../../../core/utils/deadline.util';
import { Subscription } from 'rxjs';

export interface KanbanColumn {
  id: string;
  title: string;
  icon: string;
  cards: KanbanCard[];
}

export interface KanbanCard {
  planId: number;
  sectionId: CarePlanSection;  // nutrition | sleep | activity | medication
  title: string;
  content: string;
  updatedAt?: string;
  status: 'TODO' | 'DONE';  // this section's status only
  priority?: string;
  /** Deadline ISO – patient sees timer */
  deadline?: string;
}

@Component({
  selector: 'app-care-plan-kanban',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './care-plan-kanban.component.html',
  styleUrls: ['./care-plan-kanban.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarePlanKanbanComponent implements OnInit {
  columns: KanbanColumn[] = [];
  loading = false;
  errorMessage = '';
  showNotification = false;
  notificationMessage = '';
  notificationType: 'added' | 'updated' | 'deleted' | 'error' = 'added';
  private wsSubscription!: Subscription;
  private hasPlanId(planId: number): boolean {
    return this.columns.some(col => col.cards.some(card => card.planId === planId));
  }

  constructor(
    private carePlanService: CarePlanService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlans();

    const user = this.authService.currentUser;
    if (user && user.userId) {
      this.webSocketService.connectCarePlan(user.userId).catch((error) => {
        console.error('❌ Care plan websocket connection failed:', error);
        this.displayNotification('Notifications care plan indisponibles.', 'error');
      });

      this.wsSubscription = this.webSocketService.getCarePlanNotifications().subscribe(
        (notification) => {
          if (typeof notification === 'string' && notification.startsWith('DELETED:')) {
            this.loadPlans(true);
            this.displayNotification('Plan de soins supprime.', 'deleted');
            return;
          }

          if (notification && typeof notification === 'object' && 'id' in notification) {
            const payloadId = Number((notification as any).id);
            const alreadyExists = this.hasPlanId(payloadId);
            this.loadPlans(true);
            this.displayNotification(
              alreadyExists ? 'Plan de soins mis a jour.' : 'Nouveau plan de soins ajoute.',
              alreadyExists ? 'updated' : 'added'
            );
            return;
          }

          this.loadPlans(true);
          this.displayNotification('Mise a jour des plans de soins detectee.', 'updated');
        },
        (error) => {
          console.error('❌ Care plan websocket error:', error);
          this.displayNotification('Erreur de connexion aux notifications care plan.', 'error');
        }
      );
    }
  }

  private displayNotification(message: string, type: 'added' | 'updated' | 'deleted' | 'error' = 'added'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.showNotification = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  loadPlans(silent = false): void {
    if (!silent) this.loading = true;
    this.cdr.markForCheck();
    this.carePlanService.getList().subscribe({
      next: (plans: CarePlanResponse[]) => {
        this.buildKanbanColumns(plans);
        this.loading = false;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Impossible de charger les plans de soins.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildKanbanColumns(plans: CarePlanResponse[]): void {
    const colDefs: { id: string; title: string; icon: string }[] = [
      { id: 'nutrition', title: 'Nutrition', icon: 'ti-apple' },
      { id: 'sleep', title: 'Sommeil', icon: 'ti-moon' },
      { id: 'activity', title: 'Activité', icon: 'ti-run' },
      { id: 'medication', title: 'Médication', icon: 'ti-pill' }
    ];

    this.columns = colDefs.map(col => ({
      ...col,
      cards: plans.map(plan => ({
        planId: plan.id,
        sectionId: col.id as CarePlanSection,
        title: this.getCardTitle(plan, col.id),
        content: this.getContent(plan, col.id),
        updatedAt: plan.updatedAt,
        status: this.getSectionStatus(plan, col.id),
        priority: plan.priority || 'MEDIUM',
        deadline: this.getDeadline(plan, col.id)
      })).filter(card => card.content != null && card.content.trim() !== '')
    }));
  }

  private getSectionStatus(plan: CarePlanResponse, columnId: string): 'TODO' | 'DONE' {
    switch (columnId) {
      case 'nutrition': return (plan.nutritionStatus || 'TODO') as 'TODO' | 'DONE';
      case 'sleep': return (plan.sleepStatus || 'TODO') as 'TODO' | 'DONE';
      case 'activity': return (plan.activityStatus || 'TODO') as 'TODO' | 'DONE';
      case 'medication': return (plan.medicationStatus || 'TODO') as 'TODO' | 'DONE';
      default: return 'TODO';
    }
  }

  private getCardTitle(plan: CarePlanResponse, columnId: string): string {
    const date = plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return `Plan · ${date}`.trim();
  }

  private getContent(plan: CarePlanResponse, columnId: string): string {
    switch (columnId) {
      case 'nutrition': return plan.nutritionPlan ?? '';
      case 'sleep': return plan.sleepPlan ?? '';
      case 'activity': return plan.activityPlan ?? '';
      case 'medication': return plan.medicationPlan ?? '';
      default: return '';
    }
  }

  private getDeadline(plan: CarePlanResponse, columnId: string): string | undefined {
    switch (columnId) {
      case 'nutrition': return plan.nutritionDeadline;
      case 'sleep': return plan.sleepDeadline;
      case 'activity': return plan.activityDeadline;
      case 'medication': return plan.medicationDeadline;
      default: return undefined;
    }
  }

  getDeadlineCountdown(iso: string | undefined): { text: string; isOverdue: boolean } {
    return getDeadlineCountdown(iso);
  }

  formatDeadlineDate(iso: string | undefined): string {
    return formatDeadlineDate(iso);
  }

  toggleStatus(card: KanbanCard): void {
    const newStatus = card.status === 'DONE' ? 'TODO' : 'DONE';
    this.carePlanService.updateSectionStatus(card.planId, card.sectionId, newStatus).subscribe({
      next: () => this.loadPlans(true),
      error: (err) => {
        this.errorMessage = err?.message || 'Impossible de mettre à jour le statut.';
        this.cdr.markForCheck();
      }
    });
  }

  downloadCarePlanPdf(planId: number): void {
    this.carePlanService.downloadPdf(planId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan-de-soins-${planId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Impossible de telecharger le PDF du plan de soins.';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }
}
