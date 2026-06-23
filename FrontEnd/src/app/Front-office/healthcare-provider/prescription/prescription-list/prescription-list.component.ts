import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { PrescriptionResponse } from '../../../../core/models/prescription.model';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrescriptionListComponent implements OnInit, OnDestroy {
  prescriptions: PrescriptionResponse[] = [];
  loading = false;
  errorMessage = '';
  canCreate = false;
  canEdit = false;
  canDelete = false;
  searchPatient = '';
  searchProvider = '';
  private wsSubscription!: Subscription;

  // Notification properties
  showNotification = false;
  notificationMessage = '';
  notificationType: 'added' | 'updated' | 'deleted' | 'error' = 'added';

  constructor(
    private prescriptionService: PrescriptionService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const role = this.authService.currentUser?.role ?? '';
    this.canCreate = role === 'PROVIDER' || role === 'ADMIN';
    this.canEdit = role === 'PROVIDER' || role === 'ADMIN';
    this.canDelete = role === 'PROVIDER' || role === 'ADMIN';
    this.loadPrescriptions();

    // Setup WebSocket subscription for real-time notifications
    const user = this.authService.currentUser;
    if (user && user.userId) {
      this.webSocketService.connect(user.userId);

      this.wsSubscription = this.webSocketService.getPrescriptionNotifications().subscribe(
        (notification) => {
          console.log('Received prescription notification: ', notification);
          if (typeof notification === 'string' && notification.startsWith('DELETED:')) {
            const deletedId = Number(notification.split(':')[1]);
            const deletedPrescription = this.prescriptions.find(p => p.id === deletedId);
            this.prescriptions = this.prescriptions.filter(p => p.id !== deletedId);
            this.displayNotification(
              `Ordonnance supprimée ${deletedPrescription ? '(' + deletedPrescription.contenu + ')' : ''}`,
              'deleted'
            );
            this.cdr.markForCheck();
          } else if (notification && typeof notification === 'object' && 'id' in notification) {
            const payload = notification as PrescriptionResponse;
            const index = this.prescriptions.findIndex(p => p.id === payload.id);
            if (index > -1) {
              this.prescriptions[index] = payload;
              this.displayNotification(
                `Ordonnance mise à jour: ${payload.contenu}`,
                'updated'
              );
            } else {
              this.prescriptions.unshift(payload);
              this.displayNotification(
                `Nouvelle ordonnance ajoutée: ${payload.contenu}`,
                'added'
              );
            }
            this.cdr.markForCheck();
          } else if (notification && typeof notification === 'object' && 'type' in notification && notification.type === 'GLOBAL_NOTIFICATION') {
            const message = notification.data?.message ?? 'Nouvelle notification';
            this.displayNotification(message, 'updated');
          }
        },
        (error) => {
          console.error('WebSocket error: ', error);
          this.displayNotification(
            'Erreur de connexion aux notifications',
            'error'
          );
        }
      );
    }
  }

  loadPrescriptions(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.prescriptionService.getList().subscribe({
      next: (data) => {
        this.prescriptions = data;
        this.loading = false;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load prescriptions.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onAdd(): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/prescriptions/new']);
    else this.router.navigate(['/provider/prescriptions/new']);
  }

  onView(id: number): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/prescriptions/view', id]);
    else if (role === 'PROVIDER') this.router.navigate(['/provider/prescriptions/view', id]);
    else if (role === 'PATIENT') this.router.navigate(['/patient/prescriptions/view', id]);
    else if (role === 'CAREGIVER') this.router.navigate(['/caregiver/prescriptions/view', id]);
  }

  onEdit(id: number): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/prescriptions/edit', id]);
    else this.router.navigate(['/provider/prescriptions/edit', id]);
  }

  onDelete(prescription: PrescriptionResponse): void {
    if (!this.canDelete) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ?')) return;
    this.prescriptionService.delete(prescription.id).subscribe({
      next: () => {
        this.prescriptions = this.prescriptions.filter(p => p.id !== prescription.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert('Échec de la suppression. ' + (err?.message || ''));
      }
    });
  }

  onFilterChange(): void {
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.searchPatient = '';
    this.searchProvider = '';
    this.cdr.markForCheck();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchPatient.trim() || this.searchProvider.trim());
  }

  private matchText(value: string, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (value ?? '').toLowerCase().includes(q);
  }

  get filteredPrescriptions(): PrescriptionResponse[] {
    let list = this.prescriptions;
    if (this.searchPatient.trim()) {
      const q = this.searchPatient.trim().toLowerCase();
      list = list.filter(p => this.matchText(p.patientName ?? '', q) || String(p.patientId).includes(q));
    }
    if (this.searchProvider.trim()) {
      const q = this.searchProvider.trim().toLowerCase();
      list = list.filter(p => this.matchText(p.providerName ?? '', q) || String(p.providerId).includes(q));
    }
    return list;
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

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }
}
