import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CarePlanService } from '../../../../core/services/care-plan.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CarePlanResponse, CarePlanSection, CarePlanMessageResponse } from '../../../../core/models/care-plan.model';
import { formatDeadlineDate, getDeadlineCountdown } from '../../../../core/utils/deadline.util';

@Component({
  selector: 'app-care-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './care-plan-detail.component.html',
  styleUrls: ['./care-plan-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarePlanDetailComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessagesEl') chatMessagesEl!: ElementRef<HTMLDivElement>;

  plan: CarePlanResponse | null = null;
  loading = false;
  errorMessage = '';
  planId: number | null = null;
  canEdit = false;
  canDelete = false;
  canToggleStatus = false;  // patient only
  canSendChat = false;     // provider or patient of this plan
  backUrl = '/provider/care-plans';
  updatingStatus = false;
  messages: CarePlanMessageResponse[] = [];
  chatLoading = false;
  chatError = '';
  chatInput = '';
  sendingMessage = false;
  private scrollChatToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carePlanService: CarePlanService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.planId = +idParam;
      this.setBackUrl();
      const role = this.authService.currentUser?.role ?? '';
      this.canEdit = role === 'PROVIDER' || role === 'ADMIN';
      this.canDelete = role === 'PROVIDER' || role === 'ADMIN';
      this.canToggleStatus = role === 'PATIENT';
      this.loadPlan(this.planId);
    } else {
      this.errorMessage = 'No plan ID provided';
      this.cdr.markForCheck();
    }
  }

  ngAfterViewChecked(): void {
    if (this.scrollChatToBottom && this.chatMessagesEl?.nativeElement) {
      const el = this.chatMessagesEl.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollChatToBottom = false;
    }
  }

  setBackUrl(): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.backUrl = '/admin/care-plans';
    else if (role === 'PATIENT') this.backUrl = '/patient/care-plans';
    else if (role === 'CAREGIVER') this.backUrl = '/caregiver/care-plans';
    else this.backUrl = '/provider/care-plans';
  }

  loadPlan(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.carePlanService.getById(id).subscribe({
      next: (data) => {
        this.plan = data;
        const myId = this.authService.getCurrentUserId();
        this.canSendChat = !!(myId != null && (data.providerId === myId || data.patientId === myId));
        this.loading = false;
        this.loadMessages(id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load care plan.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadMessages(planId: number): void {
    this.chatLoading = true;
    this.chatError = '';
    this.cdr.markForCheck();
    this.carePlanService.getMessages(planId).subscribe({
      next: (list) => {
        this.messages = list;
        this.chatLoading = false;
        this.scrollChatToBottom = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.chatError = err?.message || 'Impossible de charger les messages.';
        this.chatLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  sendChatMessage(): void {
    const text = (this.chatInput || '').trim();
    if (!text || !this.planId || this.sendingMessage) return;
    this.sendingMessage = true;
    this.chatError = '';
    this.cdr.markForCheck();
    this.carePlanService.sendMessage(this.planId, { content: text }).subscribe({
      next: (msg) => {
        this.messages = [...this.messages, msg];
        this.chatInput = '';
        this.sendingMessage = false;
        this.scrollChatToBottom = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.chatError = err?.message || 'Envoi impossible.';
        this.sendingMessage = false;
        this.cdr.markForCheck();
      }
    });
  }

  isMyMessage(msg: CarePlanMessageResponse): boolean {
    const myId = this.authService.getCurrentUserId();
    return myId != null && msg.senderId === myId;
  }

  onEdit(): void {
    if (!this.planId) return;
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/care-plans/edit', this.planId]);
    else this.router.navigate(['/provider/care-plans/edit', this.planId]);
  }

  onDelete(): void {
    if (!this.plan || !this.canDelete) return;
    if (!confirm('Are you sure you want to delete this care plan?')) return;
    this.carePlanService.delete(this.plan.id).subscribe({
      next: () => this.router.navigate([this.backUrl]),
      error: (err) => alert('Failed to delete. ' + (err?.message || ''))
    });
  }

  goBack(): void {
    this.router.navigate([this.backUrl]);
  }

  getSectionStatus(section: CarePlanSection): 'TODO' | 'DONE' {
    if (!this.plan) return 'TODO';
    switch (section) {
      case 'nutrition': return (this.plan.nutritionStatus || 'TODO') as 'TODO' | 'DONE';
      case 'sleep': return (this.plan.sleepStatus || 'TODO') as 'TODO' | 'DONE';
      case 'activity': return (this.plan.activityStatus || 'TODO') as 'TODO' | 'DONE';
      case 'medication': return (this.plan.medicationStatus || 'TODO') as 'TODO' | 'DONE';
      default: return 'TODO';
    }
  }

  getSectionDeadline(section: CarePlanSection): string | undefined {
    if (!this.plan) return undefined;
    switch (section) {
      case 'nutrition': return this.plan.nutritionDeadline;
      case 'sleep': return this.plan.sleepDeadline;
      case 'activity': return this.plan.activityDeadline;
      case 'medication': return this.plan.medicationDeadline;
      default: return undefined;
    }
  }

  formatDeadlineDate(iso: string | undefined): string {
    return formatDeadlineDate(iso);
  }

  getDeadlineCountdown(iso: string | undefined): { text: string; isOverdue: boolean } {
    return getDeadlineCountdown(iso);
  }

  toggleSectionStatus(section: CarePlanSection): void {
    if (!this.plan || this.updatingStatus) return;
    const current = this.getSectionStatus(section);
    const newStatus = current === 'DONE' ? 'TODO' : 'DONE';
    this.updatingStatus = true;
    this.cdr.markForCheck();
    this.carePlanService.updateSectionStatus(this.plan.id, section, newStatus).subscribe({
      next: (updated) => {
        this.plan = {
          ...this.plan!,
          nutritionStatus: updated.nutritionStatus ?? this.plan!.nutritionStatus,
          sleepStatus: updated.sleepStatus ?? this.plan!.sleepStatus,
          activityStatus: updated.activityStatus ?? this.plan!.activityStatus,
          medicationStatus: updated.medicationStatus ?? this.plan!.medicationStatus
        };
        this.updatingStatus = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Impossible de mettre à jour le statut.';
        this.updatingStatus = false;
        this.cdr.markForCheck();
      }
    });
  }
}
