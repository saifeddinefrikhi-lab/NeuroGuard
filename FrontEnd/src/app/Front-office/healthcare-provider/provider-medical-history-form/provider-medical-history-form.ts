import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { AuthService } from '../../../core/services/auth.service';
import { MedicalHistoryResponse, MedicalHistoryRequest, Surgery } from '../../../core/models/medical-history.model';
import { UserDto } from '../../../core/models/user.dto';

@Component({
  selector: 'app-provider-medical-history-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './provider-medical-history-form.html',
  styleUrls: ['./provider-medical-history-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderMedicalHistoryFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  patientId: number | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  patientsLoading = false;
  caregiversLoading = false;
  submitted = false;

  patients: UserDto[] = [];
  caregivers: UserDto[] = [];
  providers: UserDto[] = [];
  selectedProviders: UserDto[] = [];
  selectedPatientId: number | null = null;
  selectedCaregivers: UserDto[] = []; // Track full caregiver objects
  private pendingHistoryData: MedicalHistoryResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private medicalHistoryService: MedicalHistoryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      diagnosis: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      diagnosisDate: ['', [Validators.required, this.validateDiagnosisDate.bind(this)]],
      progressionStage: ['', [Validators.required, Validators.maxLength(50)]],
      geneticRisk: ['', [Validators.minLength(2), Validators.maxLength(255)]],
      familyHistory: ['', [Validators.maxLength(1000)]],
      environmentalFactors: ['', [Validators.maxLength(1000)]],
      comorbidities: ['', [Validators.maxLength(1000)]],
      medicationAllergies: ['', [Validators.maxLength(1000)]],
      environmentalAllergies: ['', [Validators.maxLength(1000)]],
      foodAllergies: ['', [Validators.maxLength(1000)]],
      surgeries: this.fb.array([]),
      providerNames: this.fb.array([]),
      caregiverNames: this.fb.array([]),
      mmse: [null, [Validators.required, Validators.min(0), Validators.max(30)]],
      functionalAssessment: [null, [Validators.required, Validators.min(0), Validators.max(10)]],
      adl: [null, [Validators.required, Validators.min(0), Validators.max(10)]],
      memoryComplaints: [false],
      behavioralProblems: [false],
      smoking: [false],
      cardiovascularDisease: [false],
      diabetes: [false],
      depression: [false],
      headInjury: [false],
      hypertension: [false],
      alcoholConsumption: [null, [Validators.min(0), Validators.max(10)]],
      physicalActivity: [null, [Validators.min(0), Validators.max(10)]],
      dietQuality: [null, [Validators.min(0), Validators.max(10)]],
      sleepQuality: [null, [Validators.min(0), Validators.max(10)]],
      bmi: [null, [Validators.min(0), Validators.max(100)]],
      cholesterolTotal: [null, [Validators.min(0), Validators.max(1000)]]
    }, { validators: [this.requireMedicalDataValidator.bind(this)] });
  }

  // Custom validator for diagnosis date
  validateDiagnosisDate(control: any) {
    if (!control.value) {
      return null; // Will be caught by required validator
    }
    const diagnosisDate = new Date(control.value);
    const today = new Date();
    // Set time to 00:00 for date comparison
    today.setHours(0, 0, 0, 0);
    diagnosisDate.setHours(0, 0, 0, 0);
    if (diagnosisDate > today) {
      return { futureDateNotAllowed: true };
    }
    return null;
  }

  // Custom form validator to ensure meaningful medical data
  requireMedicalDataValidator(formGroup: FormGroup): { [key: string]: any } | null {
    const diagnosis = formGroup.get('diagnosis')?.value?.trim();
    const diagnosisDate = formGroup.get('diagnosisDate')?.value;
    const progressionStage = formGroup.get('progressionStage')?.value?.trim();

    // At least diagnosis AND diagnosisDate AND progressionStage must be filled
    if (!diagnosis || !diagnosisDate || !progressionStage) {
      return { insufficientMedicalData: true };
    }
    return null;
  }

  ngOnInit(): void {
    console.log('[ProviderMedicalHistoryForm] Component initialized');
    this.loadPatients();
    this.loadCaregivers();
    this.loadProviders();

    const idParam = this.route.snapshot.paramMap.get('patientId');
    console.log('[ProviderMedicalHistoryForm] Route param patientId:', idParam);
    if (idParam) {
      this.isEditMode = true;
      this.patientId = +idParam;
      this.loadHistory(this.patientId);
      // Disable patient selection in edit mode
      this.form.get('patientId')?.disable();
      console.log('[ProviderMedicalHistoryForm] Edit mode enabled for patient:', this.patientId);
    } else {
      console.log('[ProviderMedicalHistoryForm] Create mode - no patientId in route params');
    }
  }

  // Helper to get surgeries FormArray
  get surgeries(): FormArray {
    return this.form.get('surgeries') as FormArray;
  }

  addSurgery(): void {
    const surgeryGroup = this.fb.group({
      description: ['', Validators.required],
      date: ['', Validators.required]
    });
    this.surgeries.push(surgeryGroup);
  }

  removeSurgery(index: number): void {
    this.surgeries.removeAt(index);
  }

  // Helper for providerIds FormArray
  get providerIds(): FormArray {
    return this.form.get('providerIds') as FormArray;
  }

  addProviderId(): void {
    this.providerIds.push(this.fb.control(''));
  }

  removeProviderId(index: number): void {
    this.providerIds.removeAt(index);
  }

  // Helper for providerNames FormArray
  get providerNames(): FormArray {
    return this.form.get('providerNames') as FormArray;
  }

  // Helper for caregiverNames FormArray
  get caregiverNames(): FormArray {
    return this.form.get('caregiverNames') as FormArray;
  }

  // Validation error message helpers
  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !this.submitted) {
      return '';
    }
    const errors = control.errors;
    if (errors['required']) return `${this.formatFieldName(fieldName)} is required.`;
    if (errors['minlength']) return `${this.formatFieldName(fieldName)} must be at least ${errors['minlength'].requiredLength} characters.`;
    if (errors['maxlength']) return `${this.formatFieldName(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters.`;
    if (errors['futureDateNotAllowed']) return `${this.formatFieldName(fieldName)} cannot be in the future.`;
    return 'Invalid value';
  }

  formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(this.submitted && control && control.invalid && control.touched);
  }

  isSurgeryInvalid(index: number): boolean {
    const surgery = this.surgeries.at(index) as FormGroup;
    return this.submitted && surgery && surgery.invalid;
  }

  getSurgeryError(index: number, fieldName: string): string {
    const surgery = this.surgeries.at(index) as FormGroup;
    const control = surgery.get(fieldName);
    if (!control || !control.errors || !this.submitted) {
      return '';
    }
    if (control.errors['required']) return `Surgery ${this.formatFieldName(fieldName)} is required.`;
    return 'Invalid value';
  }

  // Check if form has insufficient medical data
  hasInsufficientMedicalData(): boolean {
    return !!(this.submitted && this.form.errors?.['insufficientMedicalData']);
  }

  getInsufficientDataMessage(): string {
    return 'At least Diagnosis, Diagnosis Date, and Progression Stage are required to create a medical history record.';
  }

  loadPatients(): void {
    this.patientsLoading = true;
    this.cdr.markForCheck();
    this.medicalHistoryService.getPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.patientsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load patients:', err);
        this.patients = [];
        this.patientsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadCaregivers(): void {
    this.caregiversLoading = true;
    this.cdr.markForCheck();
    this.medicalHistoryService.getCaregivers().subscribe({
      next: (data) => {
        console.log('[ProviderMedicalHistoryForm] Loaded caregivers:', data);
        this.caregivers = data;
        this.caregiversLoading = false;
        this.syncSelectedAssignments();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load caregivers:', err);
        this.caregivers = [];
        this.caregiversLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadProviders(): void {
    this.medicalHistoryService.getProviders().subscribe({
      next: (data) => {
        console.log('[ProviderMedicalHistoryForm] Loaded providers:', data);
        // Filter out the current logged-in provider
        const currentUserId = this.authService.currentUser?.userId;
        this.providers = data.filter(p => p.id !== currentUserId);
        console.log('[ProviderMedicalHistoryForm] Filtered providers (excluding current user ID:', currentUserId, '):', this.providers);
        this.syncSelectedAssignments();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load providers:', err);
        this.providers = [];
        this.cdr.markForCheck();
      }
    });
  }

  onPatientSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const patientId = Number(select.value);
    this.selectedPatientId = patientId;
    this.form.patchValue({ patientId });
  }

  // Toggle provider selection (checkbox) – store full name
  toggleProvider(provider: UserDto, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const fullName = `${provider.firstName} ${provider.lastName}`;
    const index = this.selectedProviders.findIndex(p => p.id === provider.id);
    console.log(`[ProviderMedicalHistoryForm] Toggle provider "${fullName}" (ID: ${provider.id}):`, checked ? 'ADD' : 'REMOVE');
    
    if (checked && index === -1) {
      this.selectedProviders.push(provider);
    } else if (!checked && index !== -1) {
      this.selectedProviders.splice(index, 1);
    }

    console.log('[ProviderMedicalHistoryForm] Selected providers:', this.selectedProviders.map(p => `${p.firstName} ${p.lastName} (${p.id})`));
  }

  isProviderSelected(provider: UserDto): boolean {
    return this.selectedProviders.some(p => p.id === provider.id);
  }

  // Toggle caregiver selection (checkbox) – track caregiver objects
  toggleCaregiver(caregiver: UserDto, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const index = this.selectedCaregivers.findIndex(c => c.id === caregiver.id);
    console.log(`[ProviderMedicalHistoryForm] Toggle caregiver "${caregiver.firstName} ${caregiver.lastName}" (ID: ${caregiver.id}):`, checked ? 'ADD' : 'REMOVE');
    
    if (checked && index === -1) {
      this.selectedCaregivers.push(caregiver);
    } else if (!checked && index !== -1) {
      this.selectedCaregivers.splice(index, 1);
    }
    
    console.log('[ProviderMedicalHistoryForm] Selected caregivers:', this.selectedCaregivers.map(c => `${c.firstName} ${c.lastName} (${c.username || 'no-username'})}`));
  }

  isCaregiverSelected(caregiver: UserDto): boolean {
    return this.selectedCaregivers.some(c => c.id === caregiver.id);
  }

  loadHistory(patientId: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.medicalHistoryService.getByPatientId(patientId).subscribe({
      next: (data) => {
        console.log('[ProviderMedicalHistoryForm] Received medical history data:', data);
        console.log('[ProviderMedicalHistoryForm] Provider names in response:', data.providerNames);
        console.log('[ProviderMedicalHistoryForm] Caregiver names in response:', data.caregiverNames);
        this.patchForm(data);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load medical history.';
        console.error('Error loading medical history:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  patchForm(data: MedicalHistoryResponse): void {
    console.log('[ProviderMedicalHistoryForm] Patching form with data:', data);
    this.pendingHistoryData = data;
    
    this.form.patchValue({
      patientId: data.patientId,
      diagnosis: data.diagnosis,
      diagnosisDate: data.diagnosisDate,
      progressionStage: data.progressionStage,
      geneticRisk: data.geneticRisk,
      familyHistory: data.familyHistory,
      environmentalFactors: data.environmentalFactors,
      comorbidities: data.comorbidities,
      medicationAllergies: data.medicationAllergies,
      environmentalAllergies: data.environmentalAllergies,
      foodAllergies: data.foodAllergies,
      mmse: data.mmse,
    functionalAssessment: data.functionalAssessment,
    adl: data.adl,
    memoryComplaints: data.memoryComplaints,
    behavioralProblems: data.behavioralProblems,
    smoking: data.smoking,
    cardiovascularDisease: data.cardiovascularDisease,
    diabetes: data.diabetes,
    depression: data.depression,
    headInjury: data.headInjury,
    hypertension: data.hypertension,
    alcoholConsumption: data.alcoholConsumption,
    physicalActivity: data.physicalActivity,
    dietQuality: data.dietQuality,
    sleepQuality: data.sleepQuality,
    bmi: data.bmi,
    cholesterolTotal: data.cholesterolTotal
    });

    this.selectedPatientId = data.patientId;

    // Surgeries
    this.surgeries.clear();
    data.surgeries?.forEach(s => {
      this.surgeries.push(this.fb.group({
        description: [s.description, Validators.required],
        date: [s.date, Validators.required]
      }));
    });

    // Provider Names
    this.providerNames.clear();
    data.providerNames?.forEach(name => {
      this.providerNames.push(this.fb.control(name));
    });
    console.log('[ProviderMedicalHistoryForm] Populated providerNames:', this.providerNames.value);

    // Caregiver Names – match with loaded caregivers by name
    this.caregiverNames.clear();
    this.selectedCaregivers = [];
    
    data.caregiverNames?.forEach(name => {
      this.caregiverNames.push(this.fb.control(name));
      // Find matching caregiver by full name (since username might be null)
      const matchingCaregiver = this.caregivers.find(c => 
        `${c.firstName} ${c.lastName}` === name || c.username === name
      );
      if (matchingCaregiver && !this.selectedCaregivers.some(sc => sc.id === matchingCaregiver.id)) {
        this.selectedCaregivers.push(matchingCaregiver);
      }
    });
    console.log('[ProviderMedicalHistoryForm] Populated caregiverNames:', this.caregiverNames.value);
    console.log('[ProviderMedicalHistoryForm] Selected caregivers:', this.selectedCaregivers.map(c => `${c.firstName} ${c.lastName} (ID: ${c.id})`));

    this.cdr.markForCheck();
    this.syncSelectedAssignments();
  }

  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();
    
    // Check for form-level errors
    if (this.form.errors?.['insufficientMedicalData']) {
      this.errorMessage = this.getInsufficientDataMessage();
      this.cdr.markForCheck();
      return;
    }
    
    // Check for field-level errors
    if (this.form.invalid || (!this.selectedPatientId && !this.isEditMode)) {
      this.errorMessage = 'Please fix the validation errors above.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    
    const raw = this.form.getRawValue(); // includes disabled fields
    console.log('[ProviderMedicalHistoryForm] Raw form value:', raw);
    console.log('[ProviderMedicalHistoryForm] providerNames from form:', raw.providerNames);
    console.log('[ProviderMedicalHistoryForm] caregiverNames from form:', raw.caregiverNames);
    console.log('[ProviderMedicalHistoryForm] selectedCaregivers:', this.selectedCaregivers.map(c => c.username || `${c.firstName} ${c.lastName}`));
    
    // Validate patientId
    if (!raw.patientId || raw.patientId <= 0) {
      this.errorMessage = 'Patient ID is required and must be valid.';
      this.submitting = false;
      this.cdr.markForCheck();
      return;
    }
    
    // Validate required fields
    if (!raw.diagnosis?.trim() || !raw.diagnosisDate || !raw.progressionStage) {
      this.errorMessage = 'Diagnosis, Diagnosis Date, and Progression Stage are required.';
      this.submitting = false;
      this.cdr.markForCheck();
      return;
    }
    
    // Clean up empty strings and build request
    const request: MedicalHistoryRequest = {
      patientId: Number(raw.patientId),
      diagnosis: raw.diagnosis.trim(),
      diagnosisDate: raw.diagnosisDate,
      progressionStage: raw.progressionStage,
      geneticRisk: raw.geneticRisk?.trim() || undefined,
      familyHistory: raw.familyHistory?.trim() || undefined,
      environmentalFactors: raw.environmentalFactors?.trim() || undefined,
      comorbidities: raw.comorbidities?.trim() || undefined,
      medicationAllergies: raw.medicationAllergies?.trim() || undefined,
      environmentalAllergies: raw.environmentalAllergies?.trim() || undefined,
      foodAllergies: raw.foodAllergies?.trim() || undefined,
      surgeries: (raw.surgeries || [])
        .filter((s: any) => s && s.description?.trim() && s.date)
        .map((s: any) => ({
          description: s.description.trim(),
          date: s.date
        })),
      providerIds: this.selectedProviders.map(provider => provider.id),
      providerNames: (raw.providerNames || []).filter((name: string) => name && name.trim()).map((name: string) => name.trim()),
      caregiverIds: this.selectedCaregivers.map(caregiver => caregiver.id),
      caregiverNames: this.selectedCaregivers
        .map(c => c.username || `${c.firstName} ${c.lastName}`)
        .filter(name => name && name.trim()),
        mmse: raw.mmse ? Number(raw.mmse) : undefined,
  functionalAssessment: raw.functionalAssessment ? Number(raw.functionalAssessment) : undefined,
  adl: raw.adl ? Number(raw.adl) : undefined,
  memoryComplaints: raw.memoryComplaints,
  behavioralProblems: raw.behavioralProblems,
  smoking: raw.smoking,
  cardiovascularDisease: raw.cardiovascularDisease,
  diabetes: raw.diabetes,
  depression: raw.depression,
  headInjury: raw.headInjury,
  hypertension: raw.hypertension,
  alcoholConsumption: raw.alcoholConsumption ? Number(raw.alcoholConsumption) : undefined,
  physicalActivity: raw.physicalActivity ? Number(raw.physicalActivity) : undefined,
  dietQuality: raw.dietQuality ? Number(raw.dietQuality) : undefined,
  sleepQuality: raw.sleepQuality ? Number(raw.sleepQuality) : undefined,
  bmi: raw.bmi ? Number(raw.bmi) : undefined,
  cholesterolTotal: raw.cholesterolTotal ? Number(raw.cholesterolTotal) : undefined
    };

    console.log('[ProviderMedicalHistoryForm] Validated request payload:', JSON.stringify(request, null, 2));
    console.log('[ProviderMedicalHistoryForm] Form status:', { isValid: this.form.valid, isInvalid: this.form.invalid, errors: this.form.errors });

    if (this.isEditMode && this.patientId) {
      this.medicalHistoryService.update(this.patientId, request).subscribe({
        next: () => {
          this.router.navigate(['/provider/medical-history']);
        },
        error: (err) => {
          this.errorMessage = `Update failed: ${err.message || 'Unknown error'}`;
          this.submitting = false;
          console.error('Error updating medical history:', err);
          this.cdr.markForCheck();
        }
      });
    } else {
      this.medicalHistoryService.create(request).subscribe({
        next: () => {
          this.router.navigate(['/provider/medical-history']);
        },
        error: (err) => {
          this.errorMessage = `Creation failed: ${err.message || 'Unknown error'}`;
          this.submitting = false;
          console.error('Error creating medical history:', err);
          this.cdr.markForCheck();
        }
      });
    }
  }

  private syncSelectedAssignments(): void {
    if (!this.pendingHistoryData) {
      return;
    }

    const history = this.pendingHistoryData;

    if (this.providers.length > 0) {
      const matchedProviders = history.providerIds?.length
        ? this.providers.filter(provider => history.providerIds?.includes(provider.id))
        : (history.providerNames || [])
            .map(name => this.providers.find(provider => `${provider.firstName} ${provider.lastName}` === name || provider.username === name))
            .filter((provider): provider is UserDto => !!provider);

      this.selectedProviders = Array.from(new Map(matchedProviders.map(provider => [provider.id, provider])).values());
    }

    if (this.caregivers.length > 0) {
      const matchedCaregivers = history.caregiverIds?.length
        ? this.caregivers.filter(caregiver => history.caregiverIds?.includes(caregiver.id))
        : (history.caregiverNames || [])
            .map(name => this.caregivers.find(caregiver => `${caregiver.firstName} ${caregiver.lastName}` === name || caregiver.username === name))
            .filter((caregiver): caregiver is UserDto => !!caregiver);

      this.selectedCaregivers = Array.from(new Map(matchedCaregivers.map(caregiver => [caregiver.id, caregiver])).values());
    }
  }

  onCancel(): void {
    this.router.navigate(['/provider/medical-history']);
  }
}