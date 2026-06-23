import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PharmacyService, Pharmacy, Clinic } from '../../../core/services/pharmacy.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pharmacy-clinic-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pharmacy-clinic-management.component.html',
  styleUrls: ['./pharmacy-clinic-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PharmacyClinicManagementComponent implements OnInit, OnDestroy {

  pharmacies: Pharmacy[] = [];
  clinics: Clinic[] = [];
  
  entityType: 'pharmacy' | 'clinic' = 'pharmacy';
  form!: FormGroup;
  
  loading = false;
  error: string | null = null;
  success: string | null = null;
  
  isEditMode = false;
  editingId: number | null = null;
  
  showForm = false;
  selectedItem: Pharmacy | Clinic | null = null;
  
  displayNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' = 'info';
  
  private destroy$ = new Subject<void>();

  constructor(
    private pharmacyService: PharmacyService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadPharmacies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form with validation
   */
  private initForm(): void {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)]],
      latitude: ['', [Validators.required, Validators.pattern(/^-?([0-8]?[0-9]|90)\.?[0-9]*$/)]],
      longitude: ['', [Validators.required, Validators.pattern(/^-?(([0-9]|[1-9][0-9]|1[0-7][0-9]|180)\.?[0-9]*|180)$/)]],
      address: ['', [Validators.required]],
      description: [''],
      openingTime: [''],
      closingTime: [''],
      specialities: ['']
    });
  }

  /**
   * Switch between pharmacy and clinic mode
   */
  switchEntityType(type: 'pharmacy' | 'clinic'): void {
    this.entityType = type;
    this.resetForm();
    
    if (type === 'pharmacy') {
      this.loadPharmacies();
    } else {
      this.loadClinics();
    }
  }

  /**
   * Load all pharmacies
   */
  private loadPharmacies(): void {
    this.loading = true;
    this.error = null;

    this.pharmacyService.getAllPharmacies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pharmacies = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error while loading pharmacies:', err);
          this.error = 'Error while loading pharmacies';
          this.displayNotificationMessage(this.error, 'error');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Load all clinics
   */
  private loadClinics(): void {
    this.loading = true;
    this.error = null;

    this.pharmacyService.getAllClinics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clinics = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error while loading clinics:', err);
          this.error = 'Error while loading clinics';
          this.displayNotificationMessage(this.error, 'error');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Toggle form visibility
   */
  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.form.reset();
    this.isEditMode = false;
    this.editingId = null;
    this.selectedItem = null;
    this.showForm = false;
  }

  /**
   * Open edit form with existing data
   */
  editItem(item: Pharmacy | Clinic): void {
    this.selectedItem = item;
    this.editingId = item.id || null;
    this.isEditMode = true;
    this.showForm = true;

    this.form.patchValue({
      name: item.name,
      email: item.email || '',
      phoneNumber: item.phoneNumber,
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address || '',
      description: item.description || '',
      openingTime: item.openingTime || '',
      closingTime: item.closingTime || '',
      specialities: item.specialities || ''
    });

    this.cdr.markForCheck();
  }

  /**
   * Submit form to create or update
   */
  submitForm(): void {
    if (!this.form.valid) {
      this.displayNotificationMessage('Please fill in all required fields', 'error');
      return;
    }

    const formData = this.form.value;

    if (this.isEditMode && this.editingId) {
      this.updateItem(formData);
    } else {
      this.createItem(formData);
    }
  }

  /**
   * Create new pharmacy or clinic
   */
  private createItem(data: any): void {
    this.loading = true;

    if (this.entityType === 'pharmacy') {
      this.pharmacyService.createPharmacy(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.pharmacies.push(result);
            this.loading = false;
            this.displayNotificationMessage('Pharmacy created successfully', 'success');
            this.resetForm();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error while creating pharmacy:', err);
            this.loading = false;
            this.displayNotificationMessage('Error while creating the pharmacy', 'error');
            this.cdr.markForCheck();
          }
        });
      return;
    }

    this.pharmacyService.createClinic(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.clinics.push(result);
          this.loading = false;
          this.displayNotificationMessage('Clinic created successfully', 'success');
          this.resetForm();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error while creating clinic:', err);
          this.loading = false;
          this.displayNotificationMessage('Error while creating the clinic', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Update existing pharmacy or clinic
   */
  private updateItem(data: any): void {
    if (!this.editingId) return;

    this.loading = true;

    if (this.entityType === 'pharmacy') {
      this.pharmacyService.updatePharmacy(this.editingId, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            const index = this.pharmacies.findIndex(p => p.id === this.editingId);
            if (index >= 0) {
              this.pharmacies[index] = result;
            }
            this.loading = false;
            this.displayNotificationMessage('Pharmacy updated successfully', 'success');
            this.resetForm();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error while updating pharmacy:', err);
            this.loading = false;
            this.displayNotificationMessage('Error while updating the pharmacy', 'error');
            this.cdr.markForCheck();
          }
        });
      return;
    }

    this.pharmacyService.updateClinic(this.editingId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const index = this.clinics.findIndex(c => c.id === this.editingId);
          if (index >= 0) {
            this.clinics[index] = result;
          }
          this.loading = false;
          this.displayNotificationMessage('Clinic updated successfully', 'success');
          this.resetForm();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error while updating clinic:', err);
          this.loading = false;
          this.displayNotificationMessage('Error while updating the clinic', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Delete pharmacy or clinic
   */
  deleteItem(id: number | undefined): void {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    this.loading = true;

    const observable = this.entityType === 'pharmacy'
      ? this.pharmacyService.deletePharmacy(id)
      : this.pharmacyService.deleteClinic(id);

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.entityType === 'pharmacy') {
            this.pharmacies = this.pharmacies.filter(p => p.id !== id);
          } else {
            this.clinics = this.clinics.filter(c => c.id !== id);
          }
          
          this.loading = false;
          this.displayNotificationMessage(
            `${this.entityType === 'pharmacy' ? 'Pharmacy' : 'Clinic'} deleted successfully`,
            'success'
          );
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error while deleting item:', err);
          this.loading = false;
          this.displayNotificationMessage(
            `Error while deleting the ${this.entityType === 'pharmacy' ? 'pharmacy' : 'clinic'}`,
            'error'
          );
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Display notification message
   */
  private displayNotificationMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.displayNotification = true;
    
    setTimeout(() => {
      this.displayNotification = false;
      this.cdr.markForCheck();
    }, 4000);
  }

  /**
   * Get list based on current entity type
   */
  getList(): (Pharmacy | Clinic)[] {
    return this.entityType === 'pharmacy' ? this.pharmacies : this.clinics;
  }

  /**
   * Get entity type label
   */
  getEntityLabel(): string {
    return this.entityType === 'pharmacy' ? 'Pharmacie' : 'Clinique';
  }
}
