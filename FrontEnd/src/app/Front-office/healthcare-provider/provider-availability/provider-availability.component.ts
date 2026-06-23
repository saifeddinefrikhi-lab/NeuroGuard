import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AvailabilityService } from '../../../core/services/availability.service';
import { Availability, AvailabilityRequest, DayOfWeek, DAY_NAMES } from '../../../core/models/availability.model';

@Component({
  selector: 'app-provider-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './provider-availability.component.html',
  styleUrls: ['./provider-availability.component.scss']
})
export class ProviderAvailabilityComponent implements OnInit {
  availabilities: Availability[] = [];
  loading = false;
  error = '';
  showForm = false;
  editingId: number | null = null;
  DAY_NAMES = DAY_NAMES;
  DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  form: FormGroup;

  constructor(
    private availabilityService: AvailabilityService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      dayOfWeek: ['MONDAY', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required]
    }, { validators: this.timeValidator });
  }

  timeValidator(g: FormGroup) {
    const start = g.get('startTime')?.value;
    const end = g.get('endTime')?.value;
    if (start && end && end <= start) {
      return { endBeforeStart: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.availabilityService.getMyAvailability().subscribe({
      next: (data) => {
        this.availabilities = data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to load availability.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' });
    this.showForm = true;
  }

  openEdit(av: Availability): void {
    this.editingId = av.id;
    this.form.patchValue({
      dayOfWeek: av.dayOfWeek,
      startTime: av.startTime?.substring(0, 5) || '09:00',
      endTime: av.endTime?.substring(0, 5) || '17:00'
    });
    this.showForm = true;
  }

  cancel(): void {
    this.showForm = false;
    this.editingId = null;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.errors?.['endBeforeStart']) return;

    const req: AvailabilityRequest = {
      dayOfWeek: this.form.value.dayOfWeek,
      startTime: this.form.value.startTime,
      endTime: this.form.value.endTime
    };

    if (this.editingId) {
      this.availabilityService.update(this.editingId, req).subscribe({
        next: () => { this.load(); this.cancel(); },
        error: (err) => this.error = err?.error?.message || err?.message || 'Error while updating.'
      });
    } else {
      this.availabilityService.create(req).subscribe({
        next: () => { this.load(); this.cancel(); },
        error: (err) => this.error = err?.error?.message || err?.message || 'Error while creating.'
      });
    }
  }

  delete(id: number): void {
    if (!confirm('Delete this time slot?')) return;
    const previous = [...this.availabilities];
    this.availabilities = this.availabilities.filter(av => av.id !== id);
    this.cdr.detectChanges();
    this.availabilityService.delete(id).subscribe({
      next: () => { /* déjà mis à jour */ },
      error: (err) => {
        this.availabilities = previous;
        this.error = err?.error?.message || err?.message || 'Error while deleting.';
        this.cdr.detectChanges();
      }
    });
  }

  getDayName(day: DayOfWeek): string {
    return DAY_NAMES[day] || day;
  }
}
