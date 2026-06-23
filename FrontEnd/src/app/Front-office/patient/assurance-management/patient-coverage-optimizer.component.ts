import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssuranceService } from 'src/app/core/services/assurance.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { 
  SyncOutline, 
  AppstoreOutline,
  FileTextOutline,
  InfoCircleOutline,
  DashboardOutline,
  RiseOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-patient-coverage-optimizer',
  standalone: true,
  imports: [CommonModule, FormsModule, IconDirective],
  templateUrl: './patient-coverage-optimizer.component.html',
  styleUrls: ['./patient-coverage-optimizer.component.scss']
})
export class PatientCoverageOptimizerComponent implements OnInit {
  private assuranceService = inject(AssuranceService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);

  // Get current patient ID
  patientId: number = 0;

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

  constructor() {
    this.iconService.addIcon(...[
      SyncOutline, AppstoreOutline, FileTextOutline, InfoCircleOutline, DashboardOutline, RiseOutline
    ]);
  }

  ngOnInit(): void {
    this.patientId = this.authService.getCurrentUserId() ?? 0;
  }

  runSimulation() {
    if (this.patientId <= 0) return;
    
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
}
