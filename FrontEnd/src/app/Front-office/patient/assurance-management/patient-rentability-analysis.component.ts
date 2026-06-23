import { Component, OnInit, inject, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssuranceService } from 'src/app/core/services/assurance.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { 
  SyncOutline, 
  AppstoreOutline, 
  DashboardOutline,
  FileTextOutline,
  RiseOutline,
  InfoCircleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-patient-rentability-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, IconDirective],
  templateUrl: './patient-rentability-analysis.component.html',
  styleUrls: ['./patient-rentability-analysis.component.scss']
})
export class PatientRentabilityAnalysisComponent implements OnInit {
  private assuranceService = inject(AssuranceService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);

  @Input() patientId: number | null = null;

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
    this.iconService.addIcon(...[
      SyncOutline, AppstoreOutline, DashboardOutline, FileTextOutline, RiseOutline, InfoCircleOutline
    ]);
  }

  ngOnInit(): void {
    const id = this.patientId || this.authService.getCurrentUserId();
    if (id) {
      this.patientId = id;
      this.refreshRentability();
    }
  }

  refreshRentability() {
    if (!this.patientId) return;
    
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

  trackByFn(index: number): number {
    return index;
  }
}
