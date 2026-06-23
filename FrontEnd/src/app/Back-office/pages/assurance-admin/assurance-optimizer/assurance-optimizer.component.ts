import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssuranceService } from 'src/app/core/services/assurance.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { 
  SyncOutline, 
  AppstoreOutline, 
  HomeOutline, 
  UserAddOutline, 
  TeamOutline, 
  IdcardOutline, 
  CalendarOutline, 
  ScheduleOutline, 
  MedicineBoxOutline, 
  BookOutline, 
  FileTextOutline,
  ReloadOutline,
  RiseOutline,
  FallOutline,
  InfoCircleOutline,
  DashboardOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-assurance-optimizer',
  standalone: true,
  imports: [CommonModule, FormsModule, IconDirective],
  templateUrl: './assurance-optimizer.component.html',
  styleUrls: ['./assurance-optimizer.component.scss']
})
export class AssuranceOptimizerComponent implements OnInit {
  private assuranceService = inject(AssuranceService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);

  // Simulation State
  patientId: number = 1; 
  procedures = [
    { id: 'CONSULTATION_GENERAL', name: 'General Consultation' },
    { id: 'CONSULTATION_SPECIALIST', name: 'Specialist Consultation' },
    { id: 'MRI_SCAN', name: 'Scanner / IRM' },
    { id: 'BLOOD_TEST', name: 'Blood Tests' },
    { id: 'COGNITIVE_THERAPY', name: 'Cognitive Therapy' },
    { id: 'HOME_CARE_SESSION', name: 'Home Care' }
  ];
  selectedProcedure: string = 'CONSULTATION_GENERAL';
  simulationResult: any = null;
  loadingSim = false;

  // Rentability State - Initialize with default object to avoid null errors
  rentabilityData: any = {
    currentPlan: 'LOADING',
    benefitCostRatio: 0,
    rentabilityStatus: 'LOADING',
    totalPremiumsPaid: 0,
    totalBenefitsReceived: 0,
    consultationCount: 0,
    optimizationAdvice: [],
    potentialAnnualSavings: 0
  };
  loadingRent = false;

  constructor() {
    // Explicit manual registration for robust rendering
    this.iconService.addIcon(...[
      SyncOutline, AppstoreOutline, HomeOutline, UserAddOutline, TeamOutline,
      IdcardOutline, CalendarOutline, ScheduleOutline, MedicineBoxOutline,
      BookOutline, FileTextOutline, ReloadOutline, RiseOutline, FallOutline,
      InfoCircleOutline, DashboardOutline
    ]);
  }

  ngOnInit(): void {
    this.refreshRentability();
  }

  runSimulation() {
    this.loadingSim = true;
    this.cdr.detectChanges();
    this.assuranceService.simulateProcedure(this.patientId, this.selectedProcedure).subscribe({
      next: (res) => {
        this.simulationResult = res;
        this.loadingSim = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Simulation error:', err);
        this.loadingSim = false;
        this.cdr.detectChanges();
      }
    });
  }

  refreshRentability() {
    this.loadingRent = true;
    this.cdr.detectChanges();
    this.assuranceService.getRentabilityAnalysis(this.patientId).subscribe({
      next: (res) => {
        this.rentabilityData = res;
        this.loadingRent = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Rentability error:', err);
        this.loadingRent = false;
        this.cdr.detectChanges();
      }
    });
  }
}
