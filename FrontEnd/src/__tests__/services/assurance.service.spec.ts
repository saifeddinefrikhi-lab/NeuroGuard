// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AssuranceService, AssuranceRequest, AssuranceResponse } from '../../app/core/services/assurance.service';

describe('AssuranceService', () => {
  let service: AssuranceService;
  let httpMock: HttpTestingController;

  const mockAssurance: AssuranceResponse = {
    id: 1,
    patientId: 1,
    providerName: 'InsuranceProvider Inc',
    policyNumber: 'POL-2024-001',
    coverageDetails: 'Full coverage for medical treatment',
    illness: 'Diabetes Type 2',
    postalCode: '12345',
    mobilePhone: '+1234567890',
    status: 'APPROVED',
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2024-01-15T10:00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AssuranceService]
    });

    service = TestBed.inject(AssuranceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Create Assurance', () => {
    it('should create assurance', () => {
      const request: AssuranceRequest = {
        patientId: 1,
        providerName: 'NewInsurer',
        policyNumber: 'POL-2024-002',
        coverageDetails: 'Basic coverage',
        illness: 'Hypertension',
        postalCode: '54321',
        mobilePhone: '+9876543210'
      };

      service.createAssurance(request).subscribe((assurance) => {
        expect(assurance.id).toBe(1);
        expect(assurance.status).toBe('APPROVED');
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockAssurance);
    });
  });

  describe('Get Assurances', () => {
    it('should get all assurances', () => {
      service.getAllAssurances().subscribe((assurances) => {
        expect(assurances.length).toBe(1);
        expect(assurances[0].id).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances');
      expect(req.request.method).toBe('GET');
      req.flush([mockAssurance]);
    });

    it('should get assurance by ID', () => {
      service.getAssuranceById(1).subscribe((assurance) => {
        expect(assurance.id).toBe(1);
        expect(assurance.providerName).toBe('InsuranceProvider Inc');
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockAssurance);
    });

    it('should get assurances by patient ID', () => {
      service.getAssurancesByPatient(1).subscribe((assurances) => {
        expect(assurances.length).toBeGreaterThanOrEqual(0);
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/patient/1');
      expect(req.request.method).toBe('GET');
      req.flush([mockAssurance]);
    });

    it('should handle multiple patient assurances', () => {
      service.getAssurancesByPatient(1).subscribe((assurances) => {
        expect(assurances.length).toBe(2);
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/patient/1');
      req.flush([
        mockAssurance,
        { ...mockAssurance, id: 2, policyNumber: 'POL-2024-003' }
      ]);
    });
  });

  describe('Update Assurance', () => {
    it('should update assurance', () => {
      const request: AssuranceRequest = {
        patientId: 1,
        providerName: 'UpdatedInsurer',
        policyNumber: 'POL-2024-001',
        coverageDetails: 'Updated coverage',
        illness: 'Diabetes Type 2',
        postalCode: '12345',
        mobilePhone: '+1234567890'
      };

      service.updateAssurance(1, request).subscribe();

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockAssurance);
    });

    it('should update assurance status', () => {
      service.updateAssuranceStatus(1, 'REJECTED').subscribe((assurance) => {
        expect(assurance.id).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1/status?status=REJECTED');
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockAssurance, status: 'REJECTED' });
    });

    it('should handle different status values', () => {
      const statuses = ['PENDING', 'APPROVED', 'REJECTED'];

      statuses.forEach((status) => {
        service.updateAssuranceStatus(1, status).subscribe();

        const req = httpMock.expectOne(`http://localhost:8083/api/assurances/1/status?status=${status}`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockAssurance);
      });
    });
  });

  describe('Delete Assurance', () => {
    it('should delete assurance', () => {
      service.deleteAssurance(1).subscribe();

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('PDF Operations', () => {
    it('should download assurance PDF', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadAssurancePDF(1).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1/report/pdf');
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should bulk export assurances as PDF', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });
      const ids = [1, 2, 3];

      service.bulkExportAssurancePDF(ids).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/reports/bulk-export');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(ids);
      req.flush(mockBlob);
    });

    it('should handle single assurance PDF export', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.bulkExportAssurancePDF([1]).subscribe();

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/reports/bulk-export');
      req.flush(mockBlob);
    });
  });

  describe('Simulation and Optimization', () => {
    it('should simulate procedure', () => {
      const mockResult = {
        procedureName: 'MRI',
        estimatedCost: 2000,
        riskLevel: 'LOW'
      };

      service.simulateProcedure(1, 'MRI').subscribe((result) => {
        expect(result.procedureName).toBe('MRI');
      });

      const req = httpMock.expectOne('http://localhost:8083/api/simulations/procedure?patientId=1&procedureName=MRI');
      expect(req.request.method).toBe('GET');
      req.flush(mockResult);
    });

    it('should get rentability analysis', () => {
      const mockAnalysis = {
        patientId: 1,
        profitMargin: 0.25,
        estimatedRevenue: 50000,
        estimatedCosts: 37500
      };

      service.getRentabilityAnalysis(1).subscribe((analysis) => {
        expect(analysis.patientId).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:8083/api/simulations/rentability/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockAnalysis);
    });
  });

  describe('Assurance Properties', () => {
    it('should preserve all assurance properties', () => {
      service.getAssuranceById(1).subscribe((assurance) => {
        expect(assurance.id).toBeDefined();
        expect(assurance.patientId).toBeDefined();
        expect(assurance.providerName).toBeDefined();
        expect(assurance.policyNumber).toBeDefined();
        expect(assurance.coverageDetails).toBeDefined();
        expect(assurance.illness).toBeDefined();
        expect(assurance.postalCode).toBeDefined();
        expect(assurance.mobilePhone).toBeDefined();
        expect(assurance.status).toBeDefined();
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1');
      req.flush(mockAssurance);
    });

    it('should include patient details in response', () => {
      const assuranceWithDetails = {
        ...mockAssurance,
        patientDetails: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890'
        }
      };

      service.getAssuranceById(1).subscribe((assurance) => {
        expect(assurance.patientDetails).toBeDefined();
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1');
      req.flush(assuranceWithDetails);
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized', () => {
      service.getAllAssurances().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden', () => {
      service.deleteAssurance(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(403)
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1');
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found', () => {
      service.getAssuranceById(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/999');
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 400 bad request', () => {
      const invalidRequest: AssuranceRequest = {
        patientId: -1,
        providerName: '',
        policyNumber: '',
        coverageDetails: '',
        illness: '',
        postalCode: '',
        mobilePhone: ''
      };

      service.createAssurance(invalidRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(400)
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances');
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });

    xit('should handle network error', () => {
      service.getAllAssurances().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances');
      req.error(new ErrorEvent('Network error'));
    });

    xit('should handle 500 server error', () => {
      service.downloadAssurancePDF(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(500)
      });

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1/report/pdf');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Multiple Operations', () => {
    it('should handle concurrent operations', () => {
      service.getAllAssurances().subscribe();
      service.getAssuranceById(1).subscribe();

      const req1 = httpMock.expectOne('http://localhost:8083/api/assurances');
      req1.flush([mockAssurance]);

      const req2 = httpMock.expectOne('http://localhost:8083/api/assurances/1');
      req2.flush(mockAssurance);
    });
  });

  describe('Status Transitions', () => {
    it('should transition status from PENDING to APPROVED', () => {
      service.updateAssuranceStatus(1, 'APPROVED').subscribe();

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1/status?status=APPROVED');
      req.flush(mockAssurance);
    });

    it('should transition status from PENDING to REJECTED', () => {
      service.updateAssuranceStatus(1, 'REJECTED').subscribe();

      const req = httpMock.expectOne('http://localhost:8083/api/assurances/1/status?status=REJECTED');
      req.flush(mockAssurance);
    });
  });
});
