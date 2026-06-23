// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DistanceService } from '../../app/services/distance.service';
import { LocationTrackingService } from '../../app/services/location-tracking.service';
import { ReservationService } from '../../app/services/reservation.service';
import { environment } from '../../environments/environment';

describe('DistanceService', () => {
  let service: DistanceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DistanceService]
    });

    service = TestBed.inject(DistanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Haversine Distance Calculation', () => {
    xit('should calculate distance between two coordinates', () => {
      const distance = service.calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10000);
    });

    xit('should return 0 for same location', () => {
      const distance = service.calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    xit('should handle negative coordinates', () => {
      const distance = service.calculateDistance(-33.8688, 151.2093, -33.8700, 151.2100);
      expect(distance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Geocoding', () => {
    it('should geocode address to coordinates', () => {
      service.geocodeAddress('123 Main St').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('geocode'));
      expect(req.request.method).toBe('GET');
      req.flush({ latitude: 40.7128, longitude: -74.0060 });
    });
  });

  describe('Provider Sorting', () => {
    xit('should sort providers by distance', () => {
      const providers = [
        { id: 1, latitude: 40.7128, longitude: -74.0060 },
        { id: 2, latitude: 40.7580, longitude: -73.9855 }
      ];

      service.sortByDistance(40.7128, -74.0060, providers).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('sort'));
      req.flush(providers);
    });
  });

  describe('Route Optimization', () => {
    xit('should optimize tour route', () => {
      const providers = [
        { id: 1, latitude: 40.7128, longitude: -74.0060 },
        { id: 2, latitude: 40.7580, longitude: -73.9855 }
      ];

      service.optimizeTour(40.7128, -74.0060, providers).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('optimize'));
      req.flush(providers);
    });
  });
});

describe('LocationTrackingService', () => {
  let service: LocationTrackingService;
  let httpMock: HttpTestingController;

  const mockLocation = {
    providerId: 1,
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LocationTrackingService]
    });

    service = TestBed.inject(LocationTrackingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Location Updates', () => {
    xit('should update provider location', () => {
      service.updateLocation(1, 40.7128, -74.0060).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/locations/provider/1`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLocation);
    });

    xit('should batch update locations', () => {
      const locations = [
        { providerId: 1, latitude: 40.7128, longitude: -74.0060 },
        { providerId: 2, latitude: 40.7580, longitude: -73.9855 }
      ];

      service.batchUpdateLocations(locations).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/locations/batch`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });

  describe('Location Retrieval', () => {
    xit('should get provider location', () => {
      service.getProviderLocation(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/locations/provider/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLocation);
    });

    xit('should get multiple provider locations', () => {
      service.getProvidersLocations([1, 2, 3]).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('locations'));
      expect(req.request.method).toBe('GET');
      req.flush([mockLocation, mockLocation]);
    });
  });

  describe('Tracking Control', () => {
    xit('should start tracking provider', () => {
      service.startTracking(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/locations/provider/1/track/start`);
      expect(req.request.method).toBe('POST');
      req.flush({ tracking: true });
    });

    xit('should stop tracking provider', () => {
      service.stopTracking(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/locations/provider/1/track/stop`);
      expect(req.request.method).toBe('POST');
      req.flush({ tracking: false });
    });
  });
});

describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  const mockReservation = {
    id: 1,
    patientId: 1,
    providerId: 1,
    reservationDate: '2024-01-20',
    type: 'CONSULTATION',
    status: 'CONFIRMED'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReservationService]
    });

    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Reservation Operations', () => {
    xit('should create reservation', () => {
      service.createReservation(mockReservation).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations`);
      expect(req.request.method).toBe('POST');
      req.flush(mockReservation);
    });

    xit('should get reservation by ID', () => {
      service.getReservationById(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReservation);
    });

    xit('should update reservation', () => {
      service.updateReservation(1, { status: 'CANCELLED' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockReservation);
    });

    it('should delete reservation', () => {
      service.deleteReservation(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Patient Reservations', () => {
    it('should get patient reservations', () => {
      service.getPatientReservations(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/patient/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockReservation]);
    });
  });

  describe('Provider Reservations', () => {
    it('should get provider reservations', () => {
      service.getProviderReservations(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/provider/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockReservation]);
    });
  });

  describe('Reservation Status', () => {
    xit('should handle CONFIRMED status', () => {
      service.getReservationById(1).subscribe((reservation) => {
        expect(reservation.status).toBe('CONFIRMED');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/1`);
      req.flush(mockReservation);
    });

    xit('should handle CANCELLED status', () => {
      const cancelled = { ...mockReservation, status: 'CANCELLED' };

      service.updateReservation(1, { status: 'CANCELLED' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/1`);
      req.flush(cancelled);
    });

    xit('should handle PENDING status', () => {
      const pending = { ...mockReservation, status: 'PENDING' };

      service.getReservationById(1).subscribe((reservation) => {
        expect(['PENDING', 'CONFIRMED', 'CANCELLED']).toContain(reservation.status);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/1`);
      req.flush(pending);
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized', () => {
      service.createReservation(mockReservation).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 404 not found', () => {
      service.getReservationById(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/reservations/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });
  });
});
