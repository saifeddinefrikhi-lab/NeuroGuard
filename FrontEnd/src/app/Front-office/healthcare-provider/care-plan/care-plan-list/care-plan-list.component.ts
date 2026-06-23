import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarePlanService } from '../../../../core/services/care-plan.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CarePlanResponse, CarePlanPriority, CARE_PLAN_PRIORITIES } from '../../../../core/models/care-plan.model';

@Component({
  selector: 'app-care-plan-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './care-plan-list.component.html',
  styleUrls: ['./care-plan-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarePlanListComponent implements OnInit {
  plans: CarePlanResponse[] = [];
  loading = false;
  errorMessage = '';
  canCreate = false;
  canEdit = false;
  canDelete = false;

  /** Filtres recherche avancée */
  searchPatient = '';
  searchProvider = '';
  priorityFilter: CarePlanPriority | '' = '';
  statusFilter: '' | 'has_todo' | 'all_done' = '';
  readonly priorityOptions = [{ value: '' as const, label: 'Toutes' }, ...CARE_PLAN_PRIORITIES];
  readonly statusOptions: { value: '' | 'has_todo' | 'all_done'; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'has_todo', label: 'Au moins une tâche à faire' },
    { value: 'all_done', label: 'Toutes terminées' }
  ];

  constructor(
    private carePlanService: CarePlanService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const role = this.authService.currentUser?.role ?? '';
    this.canCreate = role === 'PROVIDER' || role === 'ADMIN';
    this.canEdit = role === 'PROVIDER' || role === 'ADMIN';
    this.canDelete = role === 'PROVIDER' || role === 'ADMIN';
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.carePlanService.getList().subscribe({
      next: (data) => {
        this.plans = data;
        this.loading = false;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load care plans.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onAdd(): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/care-plans/new']);
    else this.router.navigate(['/provider/care-plans/new']);
  }

  onView(id: number): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/care-plans/view', id]);
    else if (role === 'PROVIDER') this.router.navigate(['/provider/care-plans/view', id]);
    else if (role === 'PATIENT') this.router.navigate(['/patient/care-plans/view', id]);
    else if (role === 'CAREGIVER') this.router.navigate(['/caregiver/care-plans/view', id]);
  }

  onEdit(id: number): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/care-plans/edit', id]);
    else this.router.navigate(['/provider/care-plans/edit', id]);
  }

  onDelete(plan: CarePlanResponse): void {
    if (!this.canDelete) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan de soins ?')) return;
    this.carePlanService.delete(plan.id).subscribe({
      next: () => {
        this.plans = this.plans.filter(p => p.id !== plan.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert('Échec de la suppression. ' + (err?.message || ''));
      }
    });
  }

  /** Appelé quand un filtre change (pour OnPush). */
  onFilterChange(): void {
    this.cdr.markForCheck();
  }

  /** Réinitialise tous les filtres de recherche. */
  resetFilters(): void {
    this.searchPatient = '';
    this.searchProvider = '';
    this.priorityFilter = '';
    this.statusFilter = '';
    this.cdr.markForCheck();
  }

  /** Indique si au moins un filtre est actif. */
  get hasActiveFilters(): boolean {
    return !!(
      this.searchPatient.trim() ||
      this.searchProvider.trim() ||
      this.priorityFilter ||
      this.statusFilter
    );
  }

  private matchText(value: string, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (value ?? '').toLowerCase().includes(q);
  }

  private isAllDone(p: CarePlanResponse): boolean {
    const statuses = [p.nutritionStatus, p.sleepStatus, p.activityStatus, p.medicationStatus];
    return statuses.every(s => s === 'DONE');
  }

  private hasTodo(p: CarePlanResponse): boolean {
    const statuses = [p.nutritionStatus, p.sleepStatus, p.activityStatus, p.medicationStatus];
    return statuses.some(s => s === 'TODO');
  }

  /** Liste des plans filtrée par recherche avancée. */
  get filteredPlans(): CarePlanResponse[] {
    let list = this.plans;
    if (this.searchPatient.trim()) {
      const q = this.searchPatient.trim().toLowerCase();
      list = list.filter(p => this.matchText(p.patientName ?? '', q) || String(p.patientId).includes(q));
    }
    if (this.searchProvider.trim()) {
      const q = this.searchProvider.trim().toLowerCase();
      list = list.filter(p => this.matchText(p.providerName ?? '', q) || String(p.providerId).includes(q));
    }
    if (this.priorityFilter) {
      list = list.filter(p => (p.priority ?? 'MEDIUM') === this.priorityFilter);
    }
    if (this.statusFilter === 'all_done') {
      list = list.filter(p => this.isAllDone(p));
    } else if (this.statusFilter === 'has_todo') {
      list = list.filter(p => this.hasTodo(p));
    }
    return list;
  }
}
