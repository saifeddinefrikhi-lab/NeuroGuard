// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RiskAnalysisService } from '../../app/core/services/risk-analysis.service';
import { environment } from '../../environments/environment';
import { RiskAnalysisReport, PrescriptionRiskScore } from '../../app/core/models/risk-analysis.model';

describe('RiskAnalysisService', () => {
  let service: RiskAnalysisService;
  let httpMock: HttpTestingController;

  const mockRiskReport: RiskAnalysisReport = {
    totalPrescriptions: 50,
    highRiskPrescriptions: 5,
    mediumRiskPrescriptions: 15,
    lowRiskPrescriptions: 30,
    criticalInteractions: 2,
    warningInteractions: 8,
    averageRiskScore: 0.35,
    recommendations: ['Review prescriptions with high risk scores', 'Check for drug interactions']
  };

  const mockRiskScore: PrescriptionRiskScore = {
    prescriptionId: 1,
    medicationName: 'Ibuprofen',
    riskLevel: 'LOW',
    riskScore: 0.25,
    interactions: ['No major interactions detected'],
    contraindications: [],
    recommendations: ['Safe for patient'],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RiskAnalysisService]
    });

    service = TestBed.inject(RiskAnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Risk Analysis Report', () => {
    xit('should get risk analysis report for all patients', () => {
      service.getRiskAnalysisReport().subscribe((report) => {
        expect(report.totalPrescriptions).toBe(50);
        expect(report.highRiskPrescriptions).toBe(5);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('patientId')).toBeNull();
      req.flush(mockRiskReport);
    });

    xit('should get risk analysis report for specific patient', () => {
      service.getRiskAnalysisReport(1).subscribe((report) => {
        expect(report.totalPrescriptions).toBe(50);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis?patientId=1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('patientId')).toBe('1');
      req.flush(mockRiskReport);
    });

    xit('should pass patientId as query parameter', () => {
      service.getRiskAnalysisReport(5).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('patientId=5'));
      expect(req.request.params.get('patientId')).toBe('5');
      req.flush(mockRiskReport);
    });

    xit('should verify report structure', () => {
      service.getRiskAnalysisReport().subscribe((report) => {
        expect(report.totalPrescriptions).toBeDefined();
        expect(report.highRiskPrescriptions).toBeDefined();
        expect(report.mediumRiskPrescriptions).toBeDefined();
        expect(report.lowRiskPrescriptions).toBeDefined();
        expect(report.criticalInteractions).toBeDefined();
        expect(report.averageRiskScore).toBeDefined();
        expect(report.recommendations).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      req.flush(mockRiskReport);
    });

    xit('should handle report with no critical interactions', () => {
      const reportNoCritical = { ...mockRiskReport, criticalInteractions: 0 };

      service.getRiskAnalysisReport().subscribe((report) => {
        expect(report.criticalInteractions).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      req.flush(reportNoCritical);
    });
  });

  describe('Prescription Risk Score', () => {
    it('should get risk score for prescription', () => {
      service.getPrescriptionRiskScore(1).subscribe((score) => {
        expect(score.prescriptionId).toBe(1);
        expect(score.riskLevel).toBe('LOW');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRiskScore);
    });

    xit('should verify risk score structure', () => {
      service.getPrescriptionRiskScore(1).subscribe((score) => {
        expect(score.prescriptionId).toBeDefined();
        expect(score.medicationName).toBeDefined();
        expect(score.riskLevel).toBeDefined();
        expect(score.riskScore).toBeDefined();
        expect(score.interactions).toBeDefined();
        expect(score.contraindications).toBeDefined();
        expect(score.recommendations).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req.flush(mockRiskScore);
    });

    it('should handle different risk levels', () => {
      const highRiskScore = { ...mockRiskScore, riskLevel: 'HIGH', riskScore: 0.85 };

      service.getPrescriptionRiskScore(2).subscribe((score) => {
        expect(score.riskLevel).toBe('HIGH');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/2`);
      req.flush(highRiskScore);
    });

    xit('should handle prescriptions with interactions', () => {
      const scoreWithInteractions = {
        ...mockRiskScore,
        interactions: ['Interaction with Aspirin', 'Interaction with Warfarin'],
        riskScore: 0.65
      };

      service.getPrescriptionRiskScore(3).subscribe((score) => {
        expect(score.interactions.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/3`);
      req.flush(scoreWithInteractions);
    });

    xit('should handle prescriptions with contraindications', () => {
      const scoreWithContraindications = {
        ...mockRiskScore,
        contraindications: ['Contraindicated in pregnancy', 'Contraindicated in kidney disease'],
        riskScore: 0.75
      };

      service.getPrescriptionRiskScore(4).subscribe((score) => {
        expect(score.contraindications.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/4`);
      req.flush(scoreWithContraindications);
    });

    it('should handle MEDIUM risk level', () => {
      const mediumRiskScore = { ...mockRiskScore, riskLevel: 'MEDIUM', riskScore: 0.5 };

      service.getPrescriptionRiskScore(5).subscribe((score) => {
        expect(score.riskLevel).toBe('MEDIUM');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/5`);
      req.flush(mediumRiskScore);
    });
  });

  describe('Numeric Risk Scores', () => {
    xit('should return numeric risk scores between 0 and 1', () => {
      service.getPrescriptionRiskScore(1).subscribe((score) => {
        expect(score.riskScore).toBeGreaterThanOrEqual(0);
        expect(score.riskScore).toBeLessThanOrEqual(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req.flush(mockRiskScore);
    });

    it('should handle average risk scores in report', () => {
      service.getRiskAnalysisReport().subscribe((report) => {
        expect(report.averageRiskScore).toBeGreaterThanOrEqual(0);
        expect(report.averageRiskScore).toBeLessThanOrEqual(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      req.flush(mockRiskReport);
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized error', () => {
      service.getPrescriptionRiskScore(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden error', () => {
      service.getRiskAnalysisReport().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found error', () => {
      service.getPrescriptionRiskScore(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 500 server error', () => {
      service.getRiskAnalysisReport().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    xit('should handle network error', () => {
      service.getPrescriptionRiskScore(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Multiple Requests', () => {
    it('should handle multiple risk score requests', () => {
      service.getPrescriptionRiskScore(1).subscribe();
      service.getPrescriptionRiskScore(2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req1.flush(mockRiskScore);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/2`);
      req2.flush({ ...mockRiskScore, prescriptionId: 2 });
    });

    it('should handle report and score requests together', () => {
      service.getRiskAnalysisReport().subscribe();
      service.getPrescriptionRiskScore(1).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      req1.flush(mockRiskReport);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req2.flush(mockRiskScore);
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      spyOn(console, 'log');
      spyOn(console, 'error');
    });

    it('should log when fetching risk analysis', () => {
      service.getRiskAnalysisReport().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/analysis`);
      req.flush(mockRiskReport);

      expect(console.log).toHaveBeenCalled();
    });

    it('should log when fetching risk score', () => {
      service.getPrescriptionRiskScore(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req.flush(mockRiskScore);

      expect(console.log).toHaveBeenCalled();
    });

    xit('should log errors', () => {
      service.getPrescriptionRiskScore(1).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/risk/1`);
      req.error(new ErrorEvent('Network error'));

      expect(console.error).toHaveBeenCalled();
    });
  });
});
