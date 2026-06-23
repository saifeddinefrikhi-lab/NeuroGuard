// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserManagementService } from '../../app/core/services/user-management.service';
import { environment } from '../../environments/environment';
import { UserDto } from '../../app/core/models/user.dto';
import { CreateUserRequest, UpdateUserRequest } from '../../app/core/models/user-request.dto';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let httpMock: HttpTestingController;

  const mockUser: UserDto = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    role: 'PATIENT',
    status: 'ACTIVE'
  };

  const mockStats = {
    totalUsers: 100,
    activeUsers: 85,
    patients: 50,
    providers: 30,
    caregivers: 20
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserManagementService]
    });

    service = TestBed.inject(UserManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Statistics', () => {
    xit('should get user stats', () => {
      service.getStats().subscribe((stats) => {
        expect(stats.totalUsers).toBe(100);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/dashboard/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('Get Users', () => {
    it('should get all users', () => {
      service.getAllUsers().subscribe((users) => {
        expect(users.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });

    it('should get user by ID', () => {
      service.getUserById(1).subscribe((user) => {
        expect(user.id).toBe(1);
        expect(user.firstName).toBe('John');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should handle empty user list', () => {
      service.getAllUsers().subscribe((users) => {
        expect(users.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      req.flush([]);
    });
  });

  describe('Create User', () => {
    xit('should create new user', () => {
      const request: CreateUserRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phoneNumber: '+9876543210',
        role: 'PROVIDER'
      };

      service.createUser(request).subscribe((user) => {
        expect(user.id).toBe(1);
        expect(user.firstName).toBe('John');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockUser);
    });

    xit('should send correct POST data', () => {
      const request: CreateUserRequest = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phoneNumber: '+1111111111',
        role: 'CAREGIVER'
      };

      service.createUser(request).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.body.firstName).toBe('Test');
      expect(req.request.body.role).toBe('CAREGIVER');
      req.flush(mockUser);
    });
  });

  describe('Update User', () => {
    it('should update user', () => {
      const request: UpdateUserRequest = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phoneNumber: '+1112223333'
      };

      service.updateUser(1, request).subscribe((user) => {
        expect(user.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockUser);
    });
  });

  describe('Delete User', () => {
    it('should delete user', () => {
      service.deleteUser(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should delete multiple users sequentially', () => {
      service.deleteUser(1).subscribe();
      service.deleteUser(2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req1.request.method).toBe('DELETE');
      req1.flush({});

      const req2 = httpMock.expectOne(`${environment.apiUrl}/users/2`);
      expect(req2.request.method).toBe('DELETE');
      req2.flush({});
    });
  });

  describe('User Status Management', () => {
    it('should update user status to ACTIVE', () => {
      service.updateUserStatus(1, 'ACTIVE').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1/status?status=ACTIVE`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockUser);
    });

    it('should update user status to BANNED', () => {
      service.updateUserStatus(1, 'BANNED').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1/status?status=BANNED`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockUser);
    });

    it('should update user status to DISABLED', () => {
      service.updateUserStatus(1, 'DISABLED').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1/status?status=DISABLED`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockUser);
    });

    it('should update user status with duration for temporary ban', () => {
      service.updateUserStatus(1, 'BANNED', 24).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1/status?status=BANNED&durationHours=24`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockUser);
    });

    it('should not include duration when undefined', () => {
      service.updateUserStatus(1, 'ACTIVE', undefined).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/status?status=ACTIVE') && !r.url.includes('duration'));
      expect(req.request.method).toBe('PATCH');
      req.flush(mockUser);
    });

    it('should ignore duration of 0 or negative', () => {
      service.updateUserStatus(1, 'BANNED', 0).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/users/1/status?status=BANNED`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockUser);
    });
  });

  describe('PDF Export', () => {
    it('should export users as PDF without role filter', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.getUsersPdf().subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/dashboard/export/pdf`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should export users with PATIENT role filter', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.getUsersPdf('PATIENT').subscribe((blob) => {
        expect(blob).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/dashboard/export/pdf?role=PATIENT`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should export users with PROVIDER role filter', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.getUsersPdf('PROVIDER').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/dashboard/export/pdf?role=PROVIDER`);
      req.flush(mockBlob);
    });

    it('should encode role parameter', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.getUsersPdf('ROLE WITH SPACE').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('role=ROLE%20WITH%20SPACE'));
      req.flush(mockBlob);
    });

    it('should trim whitespace from role', () => {
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });

      service.getUsersPdf('  PATIENT  ').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/dashboard/export/pdf?role=PATIENT`);
      req.flush(mockBlob);
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized error', () => {
      service.getAllUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 403 forbidden error', () => {
      service.deleteUser(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(403)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    xit('should handle 404 not found error', () => {
      service.getUserById(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 500 server error', () => {
      service.getAllUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(500)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    xit('should handle network error', () => {
      service.getAllUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      req.error(new ErrorEvent('Network error'));
    });
  });
});
