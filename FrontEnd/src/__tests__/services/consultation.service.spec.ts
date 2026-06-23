// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsultationService } from '../../app/core/services/consultation.service';
import { PrescriptionService } from '../../app/core/services/prescription.service';
import { CarePlanService } from '../../app/core/services/care-plan.service';
import { environment } from '../../environments/environment';

describe('ConsultationService', () => {
  let service: ConsultationService;
  let httpMock: HttpTestingController;

  const mockConsultation = {
    id: 1,
    patientId: 1,
    providerId: 1,
    scheduledDate: '2024-01-20T10:00:00Z',
    type: 'VIRTUAL',
    status: 'SCHEDULED',
    joinLink: 'https://meet.example.com/consultation/1'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConsultationService]
    });

    service = TestBed.inject(ConsultationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('CRUD Operations', () => {
    xit('should get all consultations', () => {
      service.getAllConsultations().subscribe((consultations) => {
        expect(Array.isArray(consultations)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });

    xit('should get consultation by ID', () => {
      service.getConsultationById(1).subscribe((consultation) => {
        expect(consultation.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConsultation);
    });

    xit('should create consultation', () => {
      const request = { patientId: 1, providerId: 1, scheduledDate: '2024-01-20' };

      service.createConsultation(request).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin`);
      expect(req.request.method).toBe('POST');
      req.flush(mockConsultation);
    });

    xit('should update consultation', () => {
      service.updateConsultation(1, { status: 'COMPLETED' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockConsultation);
    });

    xit('should delete consultation', () => {
      service.deleteConsultation(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Role-based Queries', () => {
    xit('should get patient consultations', () => {
      service.getPatientConsultations(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/patient/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });

    xit('should get provider consultations', () => {
      service.getProviderConsultations(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/provider/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });

    xit('should get my consultations', () => {
      service.getMyConsultations().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/me`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });
  });

  describe('Join Links', () => {
    xit('should get join link for consultation', () => {
      service.getJoinLink(1).subscribe((response) => {
        expect(response.joinLink).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/1/join`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConsultation);
    });

    xit('should generate new join link', () => {
      service.generateJoinLink(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/1/generate-join-link`);
      expect(req.request.method).toBe('POST');
      req.flush({ joinLink: 'https://new-link.example.com' });
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized', () => {
      service.getMyConsultations().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/me`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 404 not found', () => {
      service.getConsultationById(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/consultations/admin/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });
  });
});

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let httpMock: HttpTestingController;

  const mockPrescription = {
    id: 1,
    patientId: 1,
    providerId: 1,
    medicationName: 'Aspirin',
    dosage: '500mg',
    frequency: 'Twice daily',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    notes: 'Take with food'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrescriptionService]
    });

    service = TestBed.inject(PrescriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('CRUD Operations', () => {
    xit('should get all prescriptions', () => {
      service.getAllPrescriptions().subscribe((prescriptions) => {
        expect(Array.isArray(prescriptions)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions`);
      expect(req.request.method).toBe('GET');
      req.flush([mockPrescription]);
    });

    xit('should create prescription', () => {
      service.createPrescription(mockPrescription).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions`);
      expect(req.request.method).toBe('POST');
      req.flush(mockPrescription);
    });

    xit('should download prescription PDF', () => {
      const blob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadPrescriptionPdf(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      expect(req.request.method).toBe('GET');
      req.flush(blob);
    });
  });

  describe('Search', () => {
    xit('should search prescriptions', () => {
      service.searchPrescriptions('Aspirin').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('search'));
      req.flush([mockPrescription]);
    });
  });
});

describe('CarePlanService', () => {
  let service: CarePlanService;
  let httpMock: HttpTestingController;

  const mockCarePlan = {
    id: 1,
    patientId: 1,
    title: 'Daily Care Plan',
    description: 'Care plan for patient',
    status: 'ACTIVE'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CarePlanService]
    });

    service = TestBed.inject(CarePlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Care Plan Operations', () => {
    xit('should get care plans', () => {
      service.getCarePlans(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/patient/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockCarePlan]);
    });

    xit('should get care plan by ID', () => {
      service.getCarePlanById(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCarePlan);
    });

    xit('should create care plan', () => {
      service.createCarePlan(mockCarePlan).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans`);
      expect(req.request.method).toBe('POST');
      req.flush(mockCarePlan);
    });

    xit('should update care plan', () => {
      service.updateCarePlan(1, mockCarePlan).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockCarePlan);
    });

    xit('should delete care plan', () => {
      service.deleteCarePlan(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Section Updates', () => {
    xit('should update care plan section', () => {
      service.updateSection(1, 'GOALS', { content: 'Updated goals' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/sections/GOALS`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true });
    });
  });
});
