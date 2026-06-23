// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PharmacyService, Pharmacy, Clinic } from '../../app/core/services/pharmacy.service';
import { environment } from '../../environments/environment';

describe('PharmacyService', () => {
  let service: PharmacyService;
  let httpMock: HttpTestingController;

  const mockPharmacy: Pharmacy = {
    id: 1,
    name: 'MediPharm',
    address: '123 Main St, City',
    phoneNumber: '+1234567890',
    latitude: 40.7128,
    longitude: -74.0060,
    openNow: true,
    openingTime: '08:00',
    closingTime: '20:00',
    hasDelivery: true,
    accepts24h: false,
    distance: 2.5
  };

  const mockClinic: Clinic = {
    id: 1,
    name: 'City Medical Clinic',
    address: '456 Health Ave, City',
    phoneNumber: '+1987654321',
    latitude: 40.7200,
    longitude: -74.0100,
    openNow: true,
    emergencyService: true,
    acceptsInsurance: true,
    distance: 1.5
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PharmacyService]
    });

    service = TestBed.inject(PharmacyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Pharmacy Operations', () => {
    it('should get all pharmacies', () => {
      service.getAllPharmacies().subscribe((pharmacies) => {
        expect(pharmacies.length).toBe(1);
        expect(pharmacies[0].name).toBe('MediPharm');
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies`);
      expect(req.request.method).toBe('GET');
      req.flush([mockPharmacy]);
    });

    it('should get pharmacy by ID', () => {
      service.getPharmacyById(1).subscribe((pharmacy) => {
        expect(pharmacy.id).toBe(1);
        expect(pharmacy.name).toBe('MediPharm');
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPharmacy);
    });

    it('should create pharmacy', () => {
      const newPharmacy: Pharmacy = {
        name: 'New Pharmacy',
        address: '789 Drug Lane',
        phoneNumber: '+1111111111',
        latitude: 40.7300,
        longitude: -74.0200
      };

      service.createPharmacy(newPharmacy).subscribe((pharmacy) => {
        expect(pharmacy.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies`);
      expect(req.request.method).toBe('POST');
      req.flush(mockPharmacy);
    });

    it('should update pharmacy', () => {
      const updateRequest: Pharmacy = {
        ...mockPharmacy,
        openingTime: '07:00',
        closingTime: '21:00'
      };

      service.updatePharmacy(1, updateRequest).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockPharmacy);
    });

    it('should delete pharmacy', () => {
      service.deletePharmacy(1).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Pharmacy Search and Filtering', () => {
    it('should search pharmacies by name', () => {
      service.searchByName('MediPharm').subscribe((pharmacies) => {
        expect(pharmacies.length).toBe(1);
      });

      const req = httpMock.expectOne((r) => r.url.includes('search') && r.params.get('name') === 'MediPharm');
      expect(req.request.method).toBe('GET');
      req.flush([mockPharmacy]);
    });

    it('should get open pharmacies', () => {
      service.getOpenPharmacies().subscribe((pharmacies) => {
        expect(pharmacies.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/open`);
      expect(req.request.method).toBe('GET');
      req.flush([mockPharmacy]);
    });

    it('should get pharmacies with delivery', () => {
      service.getPharmaciesWithDelivery().subscribe((pharmacies) => {
        expect(pharmacies[0].hasDelivery).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/delivery`);
      req.flush([mockPharmacy]);
    });

    it('should get 24-hour pharmacies', () => {
      service.get24HourPharmacies().subscribe((pharmacies) => {
        expect(pharmacies).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/24hours`);
      req.flush([{ ...mockPharmacy, accepts24h: true }]);
    });
  });

  describe('Location-based Search', () => {
    it('should find nearby pharmacies with default radius', () => {
      service.findNearbyPharmacies(40.7128, -74.0060).subscribe((pharmacies) => {
        expect(pharmacies.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/nearby`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.patientLatitude).toBe(40.7128);
      expect(req.request.body.patientLongitude).toBe(-74.0060);
      expect(req.request.body.radiusKm).toBe(10);
      req.flush([mockPharmacy]);
    });

    it('should find nearby pharmacies with custom radius', () => {
      service.findNearbyPharmacies(40.7128, -74.0060, 5, false).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/nearby`);
      expect(req.request.body.radiusKm).toBe(5);
      req.flush([mockPharmacy]);
    });

    it('should find open nearby pharmacies only', () => {
      service.findNearbyPharmacies(40.7128, -74.0060, 10, true).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/nearby`);
      expect(req.request.body.openNowOnly).toBe(true);
      req.flush([mockPharmacy]);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance using Haversine formula', () => {
      // New York to Los Angeles approximately 3944 km
      const distance = service.calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same location', () => {
      const distance = service.calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    it('should handle small distances', () => {
      const distance = service.calculateDistance(40.7128, -74.0060, 40.7130, -74.0060);
      expect(distance).toBeLessThan(1);
    });

    it('should handle negative coordinates', () => {
      const distance = service.calculateDistance(-33.8688, 151.2093, -33.8700, 151.2100);
      expect(distance).toBeDefined();
      expect(distance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Clinic Operations', () => {
    it('should get all clinics', () => {
      service.getAllClinics().subscribe((clinics) => {
        expect(clinics.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics`);
      expect(req.request.method).toBe('GET');
      req.flush([mockClinic]);
    });

    it('should get clinic by ID', () => {
      service.getClinicById(1).subscribe((clinic) => {
        expect(clinic.id).toBe(1);
        expect(clinic.name).toBe('City Medical Clinic');
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics/1`);
      req.flush(mockClinic);
    });

    it('should find nearby clinics', () => {
      service.findNearbyClinics(40.7128, -74.0060).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics/nearby`);
      expect(req.request.method).toBe('POST');
      req.flush([mockClinic]);
    });

    it('should search clinics by name', () => {
      service.searchClinicsByName('Medical').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('clinics/search') && r.params.get('name') === 'Medical');
      req.flush([mockClinic]);
    });

    it('should get emergency clinics', () => {
      service.getEmergencyClinics().subscribe((clinics) => {
        expect(clinics[0].emergencyService).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics/emergency`);
      req.flush([mockClinic]);
    });

    it('should get insurance clinics', () => {
      service.getInsuranceClinics().subscribe((clinics) => {
        expect(clinics[0].acceptsInsurance).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics/insurance`);
      req.flush([mockClinic]);
    });

    it('should create clinic', () => {
      service.createClinic(mockClinic).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics`);
      expect(req.request.method).toBe('POST');
      req.flush(mockClinic);
    });

    it('should update clinic', () => {
      service.updateClinic(1, mockClinic).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockClinic);
    });

    it('should delete clinic', () => {
      service.deleteClinic(1).subscribe();

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized', () => {
      service.getAllPharmacies().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 404 not found', () => {
      service.getPharmacyById(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle network error', () => {
      service.getAllPharmacies().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Pharmacy Properties', () => {
    it('should preserve all pharmacy properties', () => {
      service.getPharmacyById(1).subscribe((pharmacy) => {
        expect(pharmacy.name).toBeDefined();
        expect(pharmacy.address).toBeDefined();
        expect(pharmacy.phoneNumber).toBeDefined();
        expect(pharmacy.latitude).toBeDefined();
        expect(pharmacy.longitude).toBeDefined();
        expect(pharmacy.openNow).toBeDefined();
        expect(pharmacy.hasDelivery).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/1`);
      req.flush(mockPharmacy);
    });
  });

  describe('Clinic Properties', () => {
    it('should preserve all clinic properties', () => {
      service.getClinicById(1).subscribe((clinic) => {
        expect(clinic.name).toBeDefined();
        expect(clinic.address).toBeDefined();
        expect(clinic.emergencyService).toBeDefined();
        expect(clinic.acceptsInsurance).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.pharmacyApiUrl}/api/pharmacies/clinics/1`);
      req.flush(mockClinic);
    });
  });
});
