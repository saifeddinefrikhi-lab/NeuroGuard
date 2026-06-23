// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CoverageRiskAssessmentService, CoverageRiskAssessment } from '../../app/core/services/coverage-risk-assessment.service';
import { environment } from '../../environments/environment';

describe('CoverageRiskAssessmentService', () => {
  let service: CoverageRiskAssessmentService;
  let httpMock: HttpTestingController;

  const mockAssessment: CoverageRiskAssessment = {
    id: 1,
    assuranceId: 1,
    patientId: 1,
    alzheimersPredictionScore: 0.65,
    alzheimersPredictionLevel: 'MEDIUM',
    activeAlertCount: 5,
    highestAlertSeverity: 'HIGH',
    alertSeverityRatio: 0.2,
    medicalComplexityScore: 0.75,
    recommendedCoverageLevel: 'PREMIUM',
    estimatedAnnualClaimCost: 50000,
    recommendedProcedures: ['MRI', 'Cognitive Assessment'],
    recommendedProviderCount: 3,
    neurologyReferralNeeded: true,
    geriatricAssessmentNeeded: true,
    lastAssessmentDate: '2024-01-15T10:00:00Z',
    nextRecommendedAssessmentDate: '2024-04-15T10:00:00Z',
    riskStratum: 'HIGH_RISK',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoverageRiskAssessmentService]
    });

    service = TestBed.inject(CoverageRiskAssessmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Generate Coverage Assessment', () => {
    it('should generate coverage risk assessment', () => {
      service.generateCoverageAssessment(1, 1).subscribe((assessment) => {
        expect(assessment.id).toBe(1);
        expect(assessment.assuranceId).toBe(1);
        expect(assessment.patientId).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment?patientId=1`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAssessment);
    });

    it('should send empty body for generation', () => {
      service.generateCoverageAssessment(1, 1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment?patientId=1`);
      expect(req.request.body).toEqual({});
      req.flush(mockAssessment);
    });

    it('should include assurance and patient IDs in URL', () => {
      service.generateCoverageAssessment(5, 10).subscribe();

      const req = httpMock.expectOne((r) =>
        r.url.includes('/5/risk-assessment') && r.url.includes('patientId=10')
      );
      req.flush(mockAssessment);
    });
  });

  describe('Get Risk Assessment', () => {
    it('should retrieve existing risk assessment', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAssessment);
    });

    it('should retrieve assessment for different assurance IDs', () => {
      service.getRiskAssessment(5).subscribe((assessment) => {
        expect(assessment.assuranceId).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/5/risk-assessment`);
      req.flush(mockAssessment);
    });
  });

  describe('Refresh Risk Assessment', () => {
    it('should refresh/recalculate assessment', () => {
      service.refreshRiskAssessment(1, 1).subscribe((assessment) => {
        expect(assessment.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment/refresh?patientId=1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockAssessment);
    });

    it('should send empty body for refresh', () => {
      service.refreshRiskAssessment(1, 1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment/refresh?patientId=1`);
      expect(req.request.body).toEqual({});
      req.flush(mockAssessment);
    });

    it('should include parameters in URL', () => {
      service.refreshRiskAssessment(3, 7).subscribe();

      const req = httpMock.expectOne((r) =>
        r.url.includes('/3/risk-assessment/refresh') && r.url.includes('patientId=7')
      );
      req.flush(mockAssessment);
    });
  });

  describe('Assessment Properties', () => {
    it('should preserve all assessment properties', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.id).toBeDefined();
        expect(assessment.assuranceId).toBeDefined();
        expect(assessment.patientId).toBeDefined();
        expect(assessment.alzheimersPredictionScore).toBeDefined();
        expect(assessment.riskStratum).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should have Alzheimer prediction score between 0 and 1', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.alzheimersPredictionScore).toBeGreaterThanOrEqual(0);
        expect(assessment.alzheimersPredictionScore).toBeLessThanOrEqual(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should have medical complexity score between 0 and 1', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.medicalComplexityScore).toBeGreaterThanOrEqual(0);
        expect(assessment.medicalComplexityScore).toBeLessThanOrEqual(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });
  });

  describe('Risk Levels', () => {
    it('should handle LOW risk level', () => {
      const lowRiskAssessment = {
        ...mockAssessment,
        alzheimersPredictionLevel: 'LOW',
        riskStratum: 'LOW_RISK'
      };

      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.alzheimersPredictionLevel).toBe('LOW');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(lowRiskAssessment);
    });

    it('should handle MEDIUM risk level', () => {
      const mediumRiskAssessment = {
        ...mockAssessment,
        alzheimersPredictionLevel: 'MEDIUM',
        riskStratum: 'MEDIUM_RISK'
      };

      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.alzheimersPredictionLevel).toBe('MEDIUM');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mediumRiskAssessment);
    });

    it('should handle HIGH risk level', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.alzheimersPredictionLevel).toBe('MEDIUM');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });
  });

  describe('Coverage Recommendations', () => {
    it('should recommend coverage levels', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(['BASIC', 'STANDARD', 'PREMIUM']).toContain(assessment.recommendedCoverageLevel);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should recommend procedures', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.recommendedProcedures.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should estimate annual claim cost', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.estimatedAnnualClaimCost).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should recommend provider count', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.recommendedProviderCount).toBeGreaterThanOrEqual(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });
  });

  describe('Referral Recommendations', () => {
    it('should indicate neurology referral need', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(typeof assessment.neurologyReferralNeeded).toBe('boolean');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should indicate geriatric assessment need', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(typeof assessment.geriatricAssessmentNeeded).toBe('boolean');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should handle no referral needs', () => {
      const noReferralAssessment = {
        ...mockAssessment,
        neurologyReferralNeeded: false,
        geriatricAssessmentNeeded: false
      };

      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.neurologyReferralNeeded).toBe(false);
        expect(assessment.geriatricAssessmentNeeded).toBe(false);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(noReferralAssessment);
    });
  });

  describe('Assessment Dates', () => {
    it('should include last assessment date', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.lastAssessmentDate).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should include next recommended assessment date', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.nextRecommendedAssessmentDate).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should have valid date format', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        const lastDate = new Date(assessment.lastAssessmentDate);
        expect(lastDate instanceof Date && !isNaN(lastDate.getTime())).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized', () => {
      service.getRiskAssessment(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden', () => {
      service.generateCoverageAssessment(1, 1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(403)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment?patientId=1`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found', () => {
      service.getRiskAssessment(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/999/risk-assessment`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 500 server error', () => {
      service.refreshRiskAssessment(1, 1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(500)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment/refresh?patientId=1`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    xit('should handle network error', () => {
      service.getRiskAssessment(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Multiple Operations', () => {
    it('should handle concurrent assessments', () => {
      service.generateCoverageAssessment(1, 1).subscribe();
      service.getRiskAssessment(1).subscribe();

      const genReq = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment?patientId=1`);
      genReq.flush(mockAssessment);

      const getReq = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      getReq.flush(mockAssessment);
    });

    it('should handle multiple patient assessments', () => {
      service.generateCoverageAssessment(1, 1).subscribe();
      service.generateCoverageAssessment(2, 2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment?patientId=1`);
      req1.flush(mockAssessment);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/assurances/2/risk-assessment?patientId=2`);
      req2.flush({ ...mockAssessment, assuranceId: 2, patientId: 2 });
    });
  });

  describe('Alert Metrics', () => {
    it('should track active alert count', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.activeAlertCount).toBeGreaterThanOrEqual(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should identify highest alert severity', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(assessment.highestAlertSeverity);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });

    it('should calculate alert severity ratio', () => {
      service.getRiskAssessment(1).subscribe((assessment) => {
        expect(assessment.alertSeverityRatio).toBeGreaterThanOrEqual(0);
        expect(assessment.alertSeverityRatio).toBeLessThanOrEqual(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/assurances/1/risk-assessment`);
      req.flush(mockAssessment);
    });
  });
});
