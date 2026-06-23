import { Component, OnInit } from '@angular/core';
import { CarePlanPdfService } from '../services/careplan-pdf.service';
import { PrescriptionPdfService } from '../services/prescription-pdf.service';

/**
 * Exemple d'utilisation des services PDF
 * Cet exemple montre comment télécharger des PDFs depuis les endpoints
 */
@Component({
  selector: 'app-pdf-example',
  templateUrl: './pdf-example.component.html',
  styleUrls: ['./pdf-example.component.scss']
})
export class PdfExampleComponent implements OnInit {
  isLoading = false;
  errorMessage = '';

  constructor(
    private carePlanPdfService: CarePlanPdfService,
    private prescriptionPdfService: PrescriptionPdfService
  ) {}

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  /**
   * Télécharger un plan de soins en PDF
   */
  downloadCarePlanPdf(carePlanId: number): void {
    if (!carePlanId || carePlanId <= 0) {
      this.errorMessage = 'ID du plan de soins invalide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.carePlanPdfService.downloadCarePlanPdf(carePlanId).subscribe({
      next: (blob: Blob) => {
        this.carePlanPdfService.downloadBlob(blob, `care-plan-${carePlanId}.pdf`);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du plan de soins:', error);
        this.errorMessage = 'Erreur lors du téléchargement du plan de soins';
        this.isLoading = false;
      }
    });
  }

  /**
   * Télécharger une prescription en PDF
   */
  downloadPrescriptionPdf(prescriptionId: number): void {
    if (!prescriptionId || prescriptionId <= 0) {
      this.errorMessage = 'ID de la prescription invalide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.prescriptionPdfService.downloadPrescriptionPdf(prescriptionId).subscribe({
      next: (blob: Blob) => {
        this.prescriptionPdfService.downloadBlob(blob, `prescription-${prescriptionId}.pdf`);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement de la prescription:', error);
        this.errorMessage = 'Erreur lors du téléchargement de la prescription';
        this.isLoading = false;
      }
    });
  }

  /**
   * Télécharger un document combiné (Plan de soins + Prescription)
   */
  downloadCombinedPdf(prescriptionId: number, carePlanId: number): void {
    if (!prescriptionId || prescriptionId <= 0 || !carePlanId || carePlanId <= 0) {
      this.errorMessage = 'IDs invalides';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.prescriptionPdfService.downloadCombinedPdf(prescriptionId, carePlanId).subscribe({
      next: (blob: Blob) => {
        this.prescriptionPdfService.downloadBlob(blob, `medical-document-${prescriptionId}.pdf`);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du document combiné:', error);
        this.errorMessage = 'Erreur lors du téléchargement du document combiné';
        this.isLoading = false;
      }
    });
  }
}
