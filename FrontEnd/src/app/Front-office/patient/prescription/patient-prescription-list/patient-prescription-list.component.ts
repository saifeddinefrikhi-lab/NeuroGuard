import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Subscription } from 'rxjs';
import { PrescriptionResponse } from '../../../../core/models/prescription.model';

@Component({
    selector: 'app-patient-prescription-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './patient-prescription-list.component.html',
    styleUrls: ['./patient-prescription-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientPrescriptionListComponent implements OnInit, OnDestroy {
    prescriptions: PrescriptionResponse[] = [];
    filteredPrescriptions: PrescriptionResponse[] = [];
    loading = true;
    errorMessage = '';
    private wsSubscription!: Subscription;

    // Notification properties
    showNotification = false;
    notificationMessage = '';
    notificationType: 'added' | 'updated' | 'deleted' | 'error' = 'added';

    // Search, Sort, Filter properties
    searchQuery = '';
    sortBy: 'date-desc' | 'date-asc' | 'name' = 'date-desc';
    filterStatus: 'all' | 'recent' | 'old' = 'all';
    
    constructor(
        private prescriptionService: PrescriptionService,
        private authService: AuthService,
        private webSocketService: WebSocketService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadPrescriptions();

        // Connect to Websocket
        const user = this.authService.currentUser;
        console.log('👤 Current user:', user);
        
        if (user && user.userId) {
            console.log('🔗 Connecting to WebSocket with userId:', user.userId);
            this.webSocketService.connect(user.userId).catch((error) => {
                console.error('❌ WebSocket connection failed:', error);
                this.displayNotification('Notifications en temps reel indisponibles.', 'error');
            });

                    this.wsSubscription = this.webSocketService.getPrescriptionNotifications().subscribe(
                (notification) => {
                    console.log('🔔 Received prescription notification: ', notification);
                    if (typeof notification === 'string' && notification.startsWith('DELETED:')) {
                        const deletedId = Number(notification.split(':')[1]);
                        const deletedPrescription = this.prescriptions.find(p => p.id === deletedId);
                        this.prescriptions = this.prescriptions.filter(p => p.id !== deletedId);
                        this.applyFiltersAndSort();
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
                        this.applyFiltersAndSort();
                        this.cdr.markForCheck();
                    } else if (typeof notification === 'string') {
                        // Fallback: if backend sends plain text for create/update, refresh list and show generic toast.
                        this.loadPrescriptions();
                        this.displayNotification('Ordonnance mise a jour.', 'updated');
                    } else if (notification && typeof notification === 'object' && 'type' in notification && notification.type === 'GLOBAL_NOTIFICATION') {
                        const message = notification.data?.message ?? 'Nouvelle notification';
                        this.displayNotification(message, 'updated');
                    } else {
                        // Unknown payload format: keep UI in sync.
                        this.loadPrescriptions();
                        this.displayNotification('Mise a jour des ordonnances detectee.', 'updated');
                    }
                },
                (error) => {
                    console.error('❌ WebSocket error: ', error);
                    this.displayNotification(
                        'Erreur de connexion aux notifications',
                        'error'
                    );
                }
            );
        } else {
            console.warn('⚠️ No user or userId found');
        }
    }

    loadPrescriptions(): void {
        this.loading = true;
        this.prescriptionService.getList().subscribe({
            next: (data) => {
                this.prescriptions = data;
                this.applyFiltersAndSort();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.errorMessage = err.message || 'Erreur lors du chargement des ordonnances.';
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    displayNotification(message: string, type: 'added' | 'updated' | 'deleted' | 'error' = 'added'): void {
        console.log(`✅ 📢 Showing notification (${type}):`, message);
        this.notificationMessage = message;
        this.notificationType = type;
        this.showNotification = true;
        this.cdr.detectChanges();
        setTimeout(() => {
            this.showNotification = false;
            this.cdr.detectChanges();
        }, 5000);
    }

    onSearch(): void {
        if (this.searchQuery.trim() === '') {
            this.applyFiltersAndSort();
            return;
        }
        
        this.loading = true;
        this.prescriptionService.search(this.searchQuery).subscribe({
            next: (data) => {
                this.prescriptions = data;
                this.applyFiltersAndSort();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.errorMessage = err.message || 'Erreur lors de la recherche.';
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    applyFiltersAndSort(): void {
        let filtered = [...this.prescriptions];

        // Apply filter
        filtered = this.applyFilter(filtered);

        // Apply sort
        filtered = this.applySort(filtered);

        this.filteredPrescriptions = filtered;
        this.cdr.markForCheck();
    }

    applyFilter(items: PrescriptionResponse[]): PrescriptionResponse[] {
        if (this.filterStatus === 'all') return items;

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (this.filterStatus === 'recent') {
            return items.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);
        } else if (this.filterStatus === 'old') {
            return items.filter(p => new Date(p.createdAt) < thirtyDaysAgo);
        }
        return items;
    }

    applySort(items: PrescriptionResponse[]): PrescriptionResponse[] {
        const sorted = [...items];

        switch (this.sortBy) {
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'name':
                return sorted.sort((a, b) => a.contenu.localeCompare(b.contenu));
            default:
                return sorted;
        }
    }

    isPrescriptionCompleted(p: PrescriptionResponse): boolean {
        if (!p.updatedAt) {
            return false;
        }
        const updatedTime = new Date(p.updatedAt).getTime();
        return updatedTime <= Date.now() - 7 * 24 * 60 * 60 * 1000;
    }

    getPrescriptionStatusIcon(p: PrescriptionResponse): string {
        return this.isPrescriptionCompleted(p) ? 'ti-circle-check' : 'ti-clock';
    }

    getPrescriptionStatusLabel(p: PrescriptionResponse): string {
        return this.isPrescriptionCompleted(p) ? 'Traitement terminé' : 'En cours';
    }

    onSortChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.sortBy = value as any;
        this.applyFiltersAndSort();
    }

    onFilterChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.filterStatus = value as any;
        this.applyFiltersAndSort();
    }

    downloadPrescriptionPdf(prescriptionId: number): void {
        this.prescriptionService.downloadPdf(prescriptionId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `ordonnance-${prescriptionId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                this.errorMessage = err?.message || 'Impossible de telecharger le PDF de l ordonnance.';
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
