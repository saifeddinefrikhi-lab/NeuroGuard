// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MedicalHistoryService } from '../../app/core/services/medical-history.service';
import { AuthService } from '../../app/core/services/auth.service';
import { environment } from '../../environments/environment';
import { MedicalHistoryResponse, MedicalHistoryRequest, FileDto } from '../../app/core/models/medical-history.model';

describe('MedicalHistoryService', () => {
  let service: MedicalHistoryService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockMedicalHistory: MedicalHistoryResponse = {
    id: 1,
    patientId: 1,
    description: 'Patient medical history',
    comorbidities: 'Diabetes, Hypertension',
    surgeries: 'Appendectomy',
    allergies: 'Penicillin',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockFile: FileDto = {
    id: 1,
    name: 'test-file.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    url: '/files/1'
  };

  const mockUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MedicalHistoryService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(MedicalHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('User Lists', () => {
    it('should get patients', () => {
      service.getPatients().subscribe((patients) => {
        expect(patients.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/patients`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });

    it('should get caregivers', () => {
      service.getCaregivers().subscribe((caregivers) => {
        expect(Array.isArray(caregivers)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/caregivers`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });

    it('should get providers', () => {
      service.getProviders().subscribe((providers) => {
        expect(Array.isArray(providers)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/providers`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });

    it('should get assigned patients for caregiver', () => {
      service.getAssignedPatients().subscribe((patients) => {
        expect(patients.length).toBeGreaterThanOrEqual(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/caregiver/medical-history/patients`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });
  });

  describe('CRUD Operations', () => {
    it('should get all medical histories for provider', () => {
      service.getAllForProvider().subscribe((histories) => {
        expect(histories.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      expect(req.request.method).toBe('GET');
      req.flush([mockMedicalHistory]);
    });

    it('should handle paginated response format', () => {
      service.getAllForProvider().subscribe((histories) => {
        expect(histories.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      req.flush({ content: [mockMedicalHistory], totalPages: 1 });
    });

    it('should get medical history by patient ID', () => {
      service.getByPatientId(1).subscribe((history) => {
        expect(history.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMedicalHistory);
    });

    xit('should create medical history', () => {
      const request: MedicalHistoryRequest = {
        description: 'New history',
        comorbidities: 'Diabetes',
        surgeries: '',
        allergies: ''
      };

      service.create(request).subscribe((history) => {
        expect(history.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      expect(req.request.method).toBe('POST');
      req.flush(mockMedicalHistory);
    });

    xit('should update medical history', () => {
      const request: MedicalHistoryRequest = {
        description: 'Updated history',
        comorbidities: 'Hypertension',
        surgeries: 'Updated surgeries',
        allergies: 'Updated allergies'
      };

      service.update(1, request).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.description).toBe('Updated history');
      req.flush(mockMedicalHistory);
    });

    it('should delete medical history', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Patient Personal Medical History', () => {
    it('should get patient\'s own medical history', () => {
      service.getMyMedicalHistory().subscribe((history) => {
        expect(history.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/patient/medical-history/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMedicalHistory);
    });

    it('should get patient\'s own files', () => {
      service.getMyFiles().subscribe((files) => {
        expect(files.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/patient/medical-history/me/files`);
      expect(req.request.method).toBe('GET');
      req.flush([mockFile]);
    });

    it('should upload file with token', () => {
      authService.getToken.and.returnValue('test-token');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      service.uploadFile(file).subscribe((result) => {
        expect(result.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/patient/medical-history/me/files`);
      expect(req.request.method).toBe('POST');
      req.flush(mockFile);
    });

    it('should upload file without token', () => {
      authService.getToken.and.returnValue(null);
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      service.uploadFile(file).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/patient/medical-history/me/files`);
      expect(req.request.method).toBe('POST');
      req.flush(mockFile);
    });

    it('should download file', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadFile(1).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/files/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should delete patient\'s own file', () => {
      service.deleteMyFile(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/patient/medical-history/me/files/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should delete patient file for provider', () => {
      service.deletePatientFile(1, 1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/1/files/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Caregiver Operations', () => {
    it('should get patient history for caregiver', () => {
      service.getPatientHistoryForCaregiver(1).subscribe((history) => {
        expect(history.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/caregiver/medical-history/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMedicalHistory);
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 bad request with message', () => {
      service.getAllForProvider().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Bad Request')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      req.flush({ message: 'Invalid parameters' }, { status: 400, statusText: 'Bad Request' });
    });

    xit('should handle 401 unauthorized', () => {
      service.getByPatientId(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Unauthorized')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/1`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden', () => {
      service.getAllForProvider().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('forbidden')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found', () => {
      service.getByPatientId(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('not found')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 503 service unavailable', () => {
      service.getAllForProvider().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('unavailable')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      req.flush({}, { status: 503, statusText: 'Service Unavailable' });
    });

    it('should handle CORS/network error', () => {
      service.getAllForProvider().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('CORS')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      req.error(new ErrorEvent('Network error'), { status: 0 });
    });
  });

  describe('Empty Response Handling', () => {
    it('should handle empty array response', () => {
      service.getAllForProvider().subscribe((histories) => {
        expect(histories.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      req.flush([]);
    });

    it('should handle empty paginated response', () => {
      service.getAllForProvider().subscribe((histories) => {
        expect(histories.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/provider/medical-history`);
      req.flush({ content: [], totalPages: 0 });
    });
  });
});
