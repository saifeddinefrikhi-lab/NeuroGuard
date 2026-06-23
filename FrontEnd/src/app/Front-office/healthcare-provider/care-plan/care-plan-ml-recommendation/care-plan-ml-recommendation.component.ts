import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RecommendationService, CarePlanRecommendation } from '../../../../core/services/recommendation.service';
import { MedicalHistoryService } from '../../../../core/services/medical-history.service';
import { MedicalHistoryResponse } from '../../../../core/models/medical-history.model';
import { UserDto } from '../../../../core/models/user.dto';
import { CarePlanService } from '../../../../core/services/care-plan.service';
import { CarePlanRequest } from '../../../../core/models/care-plan.model';

@Component({
  selector: 'app-care-plan-ml-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './care-plan-ml-recommendation.component.html',
  styleUrls: ['./care-plan-ml-recommendation.component.scss']
})
export class CarePlanMlRecommendationComponent implements OnInit {
  recommendationForm!: FormGroup;
  loading = false;
  fetchingData = false;
  errorMessage = '';
  recommendationResult: CarePlanRecommendation | null = null;
  patients: UserDto[] = [];
  selectedPatientId: number | null = null;
  savingCarePlan = false;
  saveSuccess = false;

  constructor(
    private fb: FormBuilder,
    private recommendationService: RecommendationService,
    private medicalHistoryService: MedicalHistoryService,
    private carePlanService: CarePlanService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPatients();
  }

  initForm(): void {
    this.recommendationForm = this.fb.group({
      Age: [null, [Validators.required, Validators.min(0)]],
      Gender: [null, Validators.required],
      Ethnicity: [0, Validators.required],
      EducationLevel: [0, Validators.required],
      BMI: [null, [Validators.required, Validators.min(10)]],
      Smoking: [0, Validators.required],
      AlcoholConsumption: [0, Validators.required],
      PhysicalActivity: [0, Validators.required],
      DietQuality: [0, Validators.required],
      SleepQuality: [0, Validators.required],
      FamilyHistoryAlzheimers: [0, Validators.required],
      CardiovascularDisease: [0, Validators.required],
      Diabetes: [0, Validators.required],
      Depression: [0, Validators.required],
      HeadInjury: [0, Validators.required],
      Hypertension: [0, Validators.required],
      SystolicBP: [null, Validators.required],
      DiastolicBP: [null, Validators.required],
      CholesterolTotal: [null, Validators.required],
      CholesterolLDL: [null, Validators.required],
      CholesterolHDL: [null, Validators.required],
      CholesterolTriglycerides: [null, Validators.required],
      MMSE: [null, [Validators.required, Validators.min(0), Validators.max(30)]],
      FunctionalAssessment: [null, [Validators.required, Validators.min(0), Validators.max(10)]],
      MemoryComplaints: [0, Validators.required],
      BehavioralProblems: [0, Validators.required],
      ADL: [null, [Validators.required, Validators.min(0), Validators.max(10)]],
      Confusion: [0, Validators.required],
      Disorientation: [0, Validators.required],
      PersonalityChanges: [0, Validators.required],
      DifficultyCompletingTasks: [0, Validators.required],
      Forgetfulness: [0, Validators.required]
    });
  }

  loadPatients(): void {
    this.medicalHistoryService.getPatients().subscribe({
      next: (data) => {
        // Filter out the dummy "Patient NeuroGuard" user
        this.patients = data.filter(p => !(p.firstName === 'Patient' && p.lastName === 'NeuroGuard'));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load patients', err);
        // Do not crash, maybe allow manual entry
      }
    });
  }

  onPatientChange(): void {
    if (!this.selectedPatientId) return;
    this.fetchingData = true;
    this.errorMessage = '';
    
    // Fetch real medical history from Java backend
    this.medicalHistoryService.getByPatientId(this.selectedPatientId).subscribe({
      next: (history: MedicalHistoryResponse) => {
        this.fetchingData = false;
        
        // Find the patient to get Age/Gender if not in history
        const patient = this.patients.find(p => p.id == this.selectedPatientId);
        
        // Map MedicalHistory fields to the ML 32 features
        // Providing sensible defaults for fields that might not exist in the basic DB
        const formData = {
          Age: patient?.age || 65,
          Gender: patient?.gender === 'FEMALE' ? 0 : 1, // 0 for female, 1 for male typically, mapping appropriately
          Ethnicity: 0,
          EducationLevel: 1,
          BMI: history.bmi || 24.5,
          Smoking: history.smoking ? 1 : 0,
          AlcoholConsumption: history.alcoholConsumption || 0,
          PhysicalActivity: history.physicalActivity || 2.5,
          DietQuality: history.dietQuality || 5.0,
          SleepQuality: history.sleepQuality || 6.0,
          FamilyHistoryAlzheimers: history.familyHistory ? 1 : 0,
          CardiovascularDisease: history.cardiovascularDisease ? 1 : 0,
          Diabetes: history.diabetes ? 1 : 0,
          Depression: history.depression ? 1 : 0,
          HeadInjury: history.headInjury ? 1 : 0,
          Hypertension: history.hypertension ? 1 : 0,
          SystolicBP: 120, // Default since not in MedicalHistory
          DiastolicBP: 80, // Default since not in MedicalHistory
          CholesterolTotal: history.cholesterolTotal || 200,
          CholesterolLDL: 110,
          CholesterolHDL: 50,
          CholesterolTriglycerides: 150,
          MMSE: history.mmse || 25,
          FunctionalAssessment: history.functionalAssessment || 8,
          MemoryComplaints: history.memoryComplaints ? 1 : 0,
          BehavioralProblems: history.behavioralProblems ? 1 : 0,
          ADL: history.adl || 8,
          Confusion: 0,
          Disorientation: 0,
          PersonalityChanges: 0,
          DifficultyCompletingTasks: 0,
          Forgetfulness: history.memoryComplaints ? 1 : 0
        };

        this.recommendationForm.patchValue(formData);
      },
      error: (err) => {
        this.fetchingData = false;
        this.errorMessage = 'Could not load patient medical history. Please fill the data manually.';
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (this.recommendationForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.recommendationResult = null;

    const formValues = this.recommendationForm.value;

    this.recommendationService.predictCarePlan(formValues).subscribe({
      next: (result) => {
        this.loading = false;
        this.recommendationResult = result;
        this.saveSuccess = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Failed to generate recommendation. Make sure the ML service is running.';
        this.cdr.detectChanges();
      }
    });
  }

  saveCarePlan(): void {
    if (!this.recommendationResult || !this.selectedPatientId) return;

    this.savingCarePlan = true;
    this.errorMessage = '';
    this.saveSuccess = false;

    const req: CarePlanRequest = {
      patientId: this.selectedPatientId,
      priority: this.recommendationResult.cluster === 0 ? 'HIGH' : 'MEDIUM',
      nutritionPlan: this.recommendationResult.carePlan.nutrition,
      activityPlan: this.recommendationResult.carePlan.physicalActivity,
      medicationPlan: this.recommendationResult.carePlan.medication,
      sleepPlan: this.recommendationResult.carePlan.medicalFollowUp + (this.recommendationResult.carePlan.additionalNotes ? '\nNotes: ' + this.recommendationResult.carePlan.additionalNotes : '')
    };

    this.carePlanService.create(req).subscribe({
      next: (res) => {
        this.savingCarePlan = false;
        this.saveSuccess = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingCarePlan = false;
        this.errorMessage = 'Failed to save care plan: ' + err.message;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/provider/care-plans']);
  }
}
