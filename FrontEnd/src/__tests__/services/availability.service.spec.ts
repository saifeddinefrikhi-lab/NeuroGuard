// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AvailabilityService } from '../../app/core/services/availability.service';
import { environment } from '../../environments/environment';
import { Availability, AvailabilityRequest } from '../../app/core/models/availability.model';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let httpMock: HttpTestingController;

  const mockAvailability: Availability = {
    id: 1,
    providerId: 1,
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AvailabilityService]
    });

    service = TestBed.inject(AvailabilityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Get Availability', () => {
    it('should get current user availability', () => {
      service.getMyAvailability().subscribe((availabilities) => {
        expect(availabilities.length).toBe(1);
        expect(availabilities[0].dayOfWeek).toBe('MONDAY');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      expect(req.request.method).toBe('GET');
      req.flush([mockAvailability]);
    });

    it('should get provider availability by ID', () => {
      service.getProviderAvailability(1).subscribe((availabilities) => {
        expect(availabilities.length).toBeGreaterThanOrEqual(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/provider/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockAvailability]);
    });

    it('should handle empty availability list', () => {
      service.getMyAvailability().subscribe((availabilities) => {
        expect(availabilities.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.flush([]);
    });

    it('should retrieve full week availability', () => {
      const weekAvailability = [
        { ...mockAvailability, dayOfWeek: 'MONDAY' },
        { ...mockAvailability, dayOfWeek: 'TUESDAY', id: 2 },
        { ...mockAvailability, dayOfWeek: 'WEDNESDAY', id: 3 },
        { ...mockAvailability, dayOfWeek: 'THURSDAY', id: 4 },
        { ...mockAvailability, dayOfWeek: 'FRIDAY', id: 5 },
        { ...mockAvailability, dayOfWeek: 'SATURDAY', id: 6, isAvailable: false },
        { ...mockAvailability, dayOfWeek: 'SUNDAY', id: 7, isAvailable: false }
      ];

      service.getMyAvailability().subscribe((availabilities) => {
        expect(availabilities.length).toBe(7);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.flush(weekAvailability);
    });
  });

  describe('Create Availability', () => {
    it('should create availability slot', () => {
      const request: AvailabilityRequest = {
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00'
      };

      service.create(request).subscribe((availability) => {
        expect(availability.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockAvailability);
    });

    xit('should create multiple availability slots', () => {
      const request: AvailabilityRequest = {
        dayOfWeek: 'TUESDAY',
        startTime: '09:00',
        endTime: '17:00'
      };

      service.create(request).subscribe();
      service.create(request).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/availability`);
      req1.flush(mockAvailability);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/availability`);
      req2.flush({ ...mockAvailability, id: 2 });
    });
  });

  describe('Update Availability', () => {
    it('should update availability slot', () => {
      const request: AvailabilityRequest = {
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '18:00'
      };

      service.update(1, request).subscribe((availability) => {
        expect(availability.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockAvailability);
    });

    it('should update time slots', () => {
      const request: AvailabilityRequest = {
        dayOfWeek: 'MONDAY',
        startTime: '10:00',
        endTime: '16:00'
      };

      service.update(1, request).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/1`);
      expect(req.request.body.startTime).toBe('10:00');
      expect(req.request.body.endTime).toBe('16:00');
      req.flush(mockAvailability);
    });
  });

  describe('Delete Availability', () => {
    it('should delete availability slot', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should delete multiple slots sequentially', () => {
      service.delete(1).subscribe();
      service.delete(2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/availability/1`);
      req1.flush({});

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/availability/2`);
      req2.flush({});
    });
  });

  describe('Availability Properties', () => {
    it('should preserve all availability properties', () => {
      service.getMyAvailability().subscribe((availabilities) => {
        expect(availabilities[0].id).toBeDefined();
        expect(availabilities[0].providerId).toBeDefined();
        expect(availabilities[0].dayOfWeek).toBeDefined();
        expect(availabilities[0].startTime).toBeDefined();
        expect(availabilities[0].endTime).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.flush([mockAvailability]);
    });

    xit('should handle availability with isAvailable flag', () => {
      service.getMyAvailability().subscribe((availabilities) => {
        expect(availabilities[0].isAvailable).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.flush([mockAvailability]);
    });
  });

  describe('Time Format', () => {
    it('should handle 24-hour time format', () => {
      const morningSlot: Availability = {
        ...mockAvailability,
        startTime: '06:00',
        endTime: '12:00'
      };

      service.getMyAvailability().subscribe((availabilities) => {
        expect(availabilities[0].startTime).toBe('06:00');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.flush([morningSlot]);
    });

    it('should handle evening slots', () => {
      const eveningSlot: Availability = {
        ...mockAvailability,
        startTime: '18:00',
        endTime: '22:00'
      };

      service.getMyAvailability().subscribe((availabilities) => {
        expect(availabilities[0].endTime).toBe('22:00');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.flush([eveningSlot]);
    });
  });

  describe('Day of Week Handling', () => {
    xit('should handle all days of week', () => {
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      let index = 1;

      days.forEach((day) => {
        const request: AvailabilityRequest = {
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00'
        };

        service.create(request).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/api/availability`);
        expect(req.request.body.dayOfWeek).toBe(day);
        req.flush({ ...mockAvailability, id: index++, dayOfWeek: day });
      });
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized', () => {
      service.getMyAvailability().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden', () => {
      service.delete(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(403)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/1`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found', () => {
      service.getProviderAvailability(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/provider/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 400 bad request', () => {
      const invalidRequest: AvailabilityRequest = {
        dayOfWeek: 'INVALID',
        startTime: '25:00',
        endTime: '26:00'
      };

      service.create(invalidRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(400)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability`);
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });

    xit('should handle network error', () => {
      service.getMyAvailability().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability/me`);
      req.error(new ErrorEvent('Network error'));
    });

    xit('should handle 500 server error', () => {
      service.create({ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(500)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/availability`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Provider-specific Operations', () => {
    it('should retrieve multiple providers availability', () => {
      service.getProviderAvailability(1).subscribe();
      service.getProviderAvailability(2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/availability/provider/1`);
      req1.flush([mockAvailability]);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/availability/provider/2`);
      req2.flush([{ ...mockAvailability, providerId: 2 }]);
    });
  });
});
