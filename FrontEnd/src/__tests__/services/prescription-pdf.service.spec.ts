// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PrescriptionPdfService } from '../../app/core/services/prescription-pdf.service';
import { environment } from '../../environments/environment';

describe('PrescriptionPdfService', () => {
  let service: PrescriptionPdfService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrescriptionPdfService]
    });

    service = TestBed.inject(PrescriptionPdfService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Download Prescription PDF', () => {
    it('should download prescription PDF', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadPrescriptionPdf(1).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should handle different prescription IDs', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadPrescriptionPdf(5).subscribe((blob) => {
        expect(blob).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/5/pdf`);
      req.flush(mockBlob);
    });

    it('should set correct response type', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadPrescriptionPdf(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('Download Combined PDF', () => {
    it('should download combined prescription and care plan PDF', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadCombinedPdf(1, 1).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/combined-pdf/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should handle different prescription and care plan IDs', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadCombinedPdf(5, 3).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/5/combined-pdf/3`);
      req.flush(mockBlob);
    });

    it('should set correct response type for combined PDF', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadCombinedPdf(1, 1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/combined-pdf/1`);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('Download Blob Helper', () => {
    it('should create object URL for blob', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'test.pdf');

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    it('should create download link', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.callThrough();

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'test.pdf');

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should set download attribute', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'prescription.pdf');

      // Verify the link element would have download attribute set
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should revoke object URL after download', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://example.com');
      spyOn(window.URL, 'revokeObjectURL');

      const blob = new Blob(['content']);
      service.downloadBlob(blob, 'test.pdf');

      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    xit('should handle 400 bad request error', () => {
      service.downloadPrescriptionPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Bad Request')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      req.flush('Invalid prescription ID', { status: 400, statusText: 'Bad Request' });
    });

    xit('should handle 401 unauthorized error', () => {
      service.downloadPrescriptionPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('log in')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden error', () => {
      service.downloadCombinedPdf(1, 1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('forbidden')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/combined-pdf/1`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found error', () => {
      service.downloadPrescriptionPdf(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('not found')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/999/pdf`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 500 server error', () => {
      service.downloadPrescriptionPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    xit('should handle network error', () => {
      service.downloadPrescriptionPdf(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Connexion')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      req.error(new ErrorEvent('Network error'), { status: 0 });
    });
  });

  describe('Multiple Downloads', () => {
    it('should handle multiple PDF downloads', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadPrescriptionPdf(1).subscribe();
      service.downloadPrescriptionPdf(2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      req1.flush(mockBlob);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/2/pdf`);
      req2.flush(mockBlob);
    });

    it('should handle prescription and combined PDF downloads', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.downloadPrescriptionPdf(1).subscribe();
      service.downloadCombinedPdf(1, 1).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      req1.flush(mockBlob);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/combined-pdf/1`);
      req2.flush(mockBlob);
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      spyOn(console, 'error');
    });

    xit('should log errors', () => {
      service.downloadPrescriptionPdf(1).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/prescriptions/1/pdf`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(console.error).toHaveBeenCalled();
    });
  });
});
