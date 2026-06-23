import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CarePlanService } from '../../../../core/services/care-plan.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CarePlanRequest, CARE_PLAN_PRIORITIES } from '../../../../core/models/care-plan.model';
import { UserDto } from '../../../../core/models/user.dto';

const PLAN_MAX_LENGTH = 5000;
const PLAN_MIN_LENGTH_IF_FILLED = 10;
const PLAN_FIELDS = ['nutritionPlan', 'sleepPlan', 'activityPlan', 'medicationPlan'] as const;

@Component({
  selector: 'app-care-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './care-plan-form.component.html',
  styleUrls: ['./care-plan-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarePlanFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  planId: number | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  patients: UserDto[] = [];
  providers: UserDto[] = [];
  isAdmin = false;
  backUrl = '/provider/care-plans';
  priorityOptions = CARE_PLAN_PRIORITIES;
  readonly planMaxLength = PLAN_MAX_LENGTH;
  readonly planMinLengthIfFilled = PLAN_MIN_LENGTH_IF_FILLED;
  readonly planSections: { name: typeof PLAN_FIELDS[number]; label: string; placeholder: string; deadlineName: string }[] = [
    { name: 'nutritionPlan', label: 'Plan nutrition', placeholder: 'Recommandations nutrition...', deadlineName: 'nutritionDeadline' },
    { name: 'sleepPlan', label: 'Plan sommeil', placeholder: 'Horaires et conseils sommeil...', deadlineName: 'sleepDeadline' },
    { name: 'activityPlan', label: 'Plan activité', placeholder: 'Activité physique recommandée...', deadlineName: 'activityDeadline' },
    { name: 'medicationPlan', label: 'Plan médication', placeholder: 'Médicaments et horaires si besoin...', deadlineName: 'medicationDeadline' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private carePlanService: CarePlanService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    const planValidators = [Validators.maxLength(PLAN_MAX_LENGTH), this.minLengthIfFilled(PLAN_MIN_LENGTH_IF_FILLED)];
    this.form = this.fb.group({
      patientId: [null as number | null, [Validators.required]],
      providerId: [null as number | null],
      priority: ['MEDIUM' as const, [Validators.required]],
      nutritionPlan: this.fb.control('', { validators: planValidators, updateOn: 'change' }),
      sleepPlan: this.fb.control('', { validators: planValidators, updateOn: 'change' }),
      activityPlan: this.fb.control('', { validators: planValidators, updateOn: 'change' }),
      medicationPlan: this.fb.control('', { validators: planValidators, updateOn: 'change' }),
      nutritionDeadline: [null as string | null],
      sleepDeadline: [null as string | null],
      activityDeadline: [null as string | null],
      medicationDeadline: [null as string | null]
    }, { validators: this.atLeastOnePlanRequired() });
  }

  /** Si le champ est renseigné, il doit contenir au moins min caractères. */
  private minLengthIfFilled(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = (control.value ?? '').toString().trim();
      if (v.length === 0) return null;
      return v.length < min ? { minLengthIfFilled: { required: min, actual: v.length } } : null;
    };
  }

  /** ISO or datetime-local → value for input datetime-local (yyyy-MM-ddThh:mm). */
  private toDatetimeLocal(iso: string | undefined): string | null {
    if (!iso) return null;
    return iso.slice(0, 16);
  }

  /** Form value (datetime-local) → ISO for API. */
  private toIso(v: string | null): string | undefined {
    if (!v || !v.trim()) return undefined;
    const s = v.trim();
    return s.length === 16 ? s + ':00' : s;
  }

  /** Au moins un des quatre plans doit être renseigné (min caractères). */
  private atLeastOnePlanRequired(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const g = group as FormGroup;
      const hasOne = PLAN_FIELDS.some(name => (g.get(name)?.value ?? '').toString().trim().length >= PLAN_MIN_LENGTH_IF_FILLED);
      return hasOne ? null : { atLeastOnePlan: true };
    };
  }

  /** Indique si au moins un plan a le minimum de caractères (pour message d'aide). */
  get hasAtLeastOnePlan(): boolean {
    return PLAN_FIELDS.some(name => (this.form.get(name)?.value ?? '').toString().trim().length >= PLAN_MIN_LENGTH_IF_FILLED);
  }

  /** Nombre de caractères pour un champ plan (affichage compteur). */
  charCount(controlName: string): number {
    const v = this.form.get(controlName)?.value;
    return (v ?? '').toString().length;
  }

  /** Trim au blur et marque touché pour afficher les erreurs. */
  trimPlanOnBlur(controlName: string): void {
    const c = this.form.get(controlName);
    if (!c) return;
    const trimmed = (c.value ?? '').toString().trim();
    if (trimmed !== (c.value ?? '').toString()) {
      c.setValue(trimmed);
      this.form.updateValueAndValidity();
    }
    c.markAsTouched();
    this.cdr.markForCheck();
  }

  /** Message d'erreur unique pour un champ plan (priorité: min puis max). */
  getPlanErrorMessage(controlName: string): string | null {
    const c = this.form.get(controlName);
    if (!c?.touched || !c.errors) return null;
    if (c.errors['minLengthIfFilled']) return `Au moins ${PLAN_MIN_LENGTH_IF_FILLED} caractères.`;
    if (c.errors['maxlength']) return `Maximum ${PLAN_MAX_LENGTH} caractères.`;
    return null;
  }

  /** Scroll vers le premier champ invalide et focus (après markAllAsTouched). */
  private focusFirstInvalid(): void {
    const order = ['patientId', 'priority', ...PLAN_FIELDS];
    for (const name of order) {
      const c = this.form.get(name);
      if (c?.invalid && c.touched) {
        const el = document.querySelector(`[formControlName="${name}"]`);
        if (el) {
          (el as HTMLElement).focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
    if (this.form.errors?.['atLeastOnePlan']) {
      const firstPlan = document.querySelector('[data-plan]');
      if (firstPlan) {
        const textarea = firstPlan.querySelector('textarea');
        if (textarea) (textarea as HTMLElement).focus();
        firstPlan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.currentUser?.role === 'ADMIN';
    if (this.isAdmin) this.backUrl = '/admin/care-plans';

    this.carePlanService.getPatients().subscribe({
      next: (list) => {
        this.patients = list;
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck()
    });
    if (this.isAdmin) {
      this.carePlanService.getProviders().subscribe({
        next: (list) => {
          this.providers = list;
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck()
      });
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.planId = +idParam;
      this.loadPlan(this.planId);
    } else {
      if (!this.isAdmin) this.form.removeControl('providerId');
      this.cdr.markForCheck();
    }
  }

  loadPlan(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.carePlanService.getById(id).subscribe({
      next: (plan) => {
        this.form.patchValue({
          patientId: plan.patientId,
          providerId: this.isAdmin ? plan.providerId : null,
          priority: plan.priority ?? 'MEDIUM',
          nutritionPlan: plan.nutritionPlan ?? '',
          sleepPlan: plan.sleepPlan ?? '',
          activityPlan: plan.activityPlan ?? '',
          medicationPlan: plan.medicationPlan ?? '',
          nutritionDeadline: this.toDatetimeLocal(plan.nutritionDeadline),
          sleepDeadline: this.toDatetimeLocal(plan.sleepDeadline),
          activityDeadline: this.toDatetimeLocal(plan.activityDeadline),
          medicationDeadline: this.toDatetimeLocal(plan.medicationDeadline)
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load plan.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.cdr.markForCheck();
    if (this.form.invalid || this.submitting) {
      if (this.form.invalid) this.focusFirstInvalid();
      return;
    }
    const v = this.form.value;
    const request: CarePlanRequest = {
      patientId: Number(v.patientId),
      priority: v.priority || 'MEDIUM',
      nutritionPlan: v.nutritionPlan?.trim() || undefined,
      sleepPlan: v.sleepPlan?.trim() || undefined,
      activityPlan: v.activityPlan?.trim() || undefined,
      medicationPlan: v.medicationPlan?.trim() || undefined,
      nutritionDeadline: this.toIso(v.nutritionDeadline),
      sleepDeadline: this.toIso(v.sleepDeadline),
      activityDeadline: this.toIso(v.activityDeadline),
      medicationDeadline: this.toIso(v.medicationDeadline)
    };
    if (this.isAdmin && v.providerId) request.providerId = Number(v.providerId);

    this.submitting = true;
    this.cdr.markForCheck();

    const done = () => {
      this.submitting = false;
      this.cdr.markForCheck();
    };

    if (this.isEditMode && this.planId) {
      this.carePlanService.update(this.planId, request).subscribe({
        next: () => {
          this.router.navigate([this.backUrl]);
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Update failed.';
          done();
        }
      });
    } else {
      this.carePlanService.create(request).subscribe({
        next: () => {
          this.router.navigate([this.backUrl]);
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Create failed.';
          done();
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate([this.backUrl]);
  }
}
