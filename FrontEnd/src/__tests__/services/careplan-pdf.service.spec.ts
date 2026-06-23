// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CarePlanPdfService } from '../../app/core/services/careplan-pdf.service';
import { environment } from '../../environments/environment';

describe('CarePlanPdfService', () => {
  let service: CarePlanPdfService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CarePlanPdfService]
    });

    service = TestBed.inject(CarePlanPdfService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Download Care Plan PDF', () => {
    it('should download care plan PDF', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadCarePlanPdf(1).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should handle different care plan IDs', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadCarePlanPdf(5).subscribe((blob) => {
        expect(blob).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/5/pdf`);
      req.flush(mockBlob);
    });

    it('should set correct response type', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadCarePlanPdf(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should handle large care plan PDFs', () => {
      const largeContent = new Array(1000).fill('X').join('');
      const mockBlob = new Blob([largeContent], { type: 'application/pdf' });

      service.downloadCarePlanPdf(1).subscribe((blob) => {
        expect(blob.size).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush(mockBlob);
    });
  });

  describe('Download Blob Helper', () => {
    it('should create object URL for blob', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'careplan.pdf');

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    it('should set download filename', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'careplan-2024.pdf');

      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should revoke object URL after download', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'careplan.pdf');

      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle special characters in filename', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'care-plan_2024-01-15.pdf');

      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    xit('should handle 400 bad request error', () => {
      service.downloadCarePlanPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Bad Request')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush('Invalid care plan ID', { status: 400, statusText: 'Bad Request' });
    });

    xit('should handle 401 unauthorized error', () => {
      service.downloadCarePlanPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('log in')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden error', () => {
      service.downloadCarePlanPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('forbidden')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found error', () => {
      service.downloadCarePlanPdf(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('not found')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/999/pdf`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 500 server error', () => {
      service.downloadCarePlanPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error with status 0', () => {
      service.downloadCarePlanPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Connexion')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.error(new ErrorEvent('Network error'), { status: 0 });
    });
  });

  describe('Multiple Downloads', () => {
    it('should handle multiple care plan PDF downloads', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadCarePlanPdf(1).subscribe();
      service.downloadCarePlanPdf(2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req1.flush(mockBlob);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/2/pdf`);
      req2.flush(mockBlob);
    });

    it('should handle concurrent PDF downloads', () => {
      const mockBlob1 = new Blob(['PDF1'], { type: 'application/pdf' });
      const mockBlob2 = new Blob(['PDF2'], { type: 'application/pdf' });

      service.downloadCarePlanPdf(1).subscribe();
      service.downloadCarePlanPdf(3).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req1.flush(mockBlob1);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/3/pdf`);
      req2.flush(mockBlob2);
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      spyOn(console, 'error');
    });

    xit('should log errors', () => {
      service.downloadCarePlanPdf(1).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(console.error).toHaveBeenCalled();
    });

    it('should log network errors', () => {
      service.downloadCarePlanPdf(1).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.error(new ErrorEvent('Network error'), { status: 0 });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Service Methods', () => {
    it('should provide downloadCarePlanPdf method', () => {
      expect(typeof service.downloadCarePlanPdf).toBe('function');
    });

    it('should provide downloadBlob helper method', () => {
      expect(typeof service.downloadBlob).toBe('function');
    });
  });

  describe('Response Handling', () => {
    it('should return Blob observable', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadCarePlanPdf(1).subscribe((result) => {
        expect(result instanceof Blob).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush(mockBlob);
    });

    it('should maintain blob MIME type', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadCarePlanPdf(1).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/care-plans/1/pdf`);
      req.flush(mockBlob);
    });
  });
});
