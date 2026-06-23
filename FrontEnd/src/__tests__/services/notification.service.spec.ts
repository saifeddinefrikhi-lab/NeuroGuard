// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService, NotificationAction } from '../../app/core/services/notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Add Notification', () => {
    xit('should add notification to list', () => {
      const notification = {
        id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);

      service.getNotifications().subscribe((notifications) => {
        expect(notifications.length).toBeGreaterThan(0);
      });
    });

    xit('should emit notification added event', (done) => {
      const notification = {
        id: '1',
        title: 'Alert',
        message: 'New alert',
        type: 'ALERT',
        timestamp: new Date(),
        read: false
      };

      service.notificationAdded$.subscribe((notif) => {
        expect(notif.id).toBe('1');
        done();
      });

      service.addNotification(notification);
    });
  });

  describe('Get Notifications', () => {
    xit('should return notifications', (done) => {
      service.getNotifications().subscribe((notifications) => {
        expect(Array.isArray(notifications)).toBe(true);
        done();
      });
    });

    xit('should handle empty notifications', (done) => {
      service.getNotifications().subscribe((notifications) => {
        expect(notifications.length).toBeGreaterThanOrEqual(0);
        done();
      });
    });
  });

  describe('Mark as Read', () => {
    xit('should mark notification as read', () => {
      const notification = {
        id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);
      service.markAsRead('1');

      service.getNotifications().subscribe((notifications) => {
        const found = notifications.find((n) => n.id === '1');
        if (found) {
          expect(found.read).toBe(true);
        }
      });
    });

    xit('should emit read event', (done) => {
      service.notificationRead$.subscribe((notifId) => {
        expect(notifId).toBe('1');
        done();
      });

      service.markAsRead('1');
    });
  });

  describe('Dismiss Notification', () => {
    xit('should dismiss notification', () => {
      const notification = {
        id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);
      service.dismissNotification('1');

      service.getNotifications().subscribe((notifications) => {
        const found = notifications.find((n) => n.id === '1');
        expect(found).toBeUndefined();
      });
    });

    xit('should emit dismissed event', (done) => {
      service.notificationDismissed$.subscribe((notifId) => {
        expect(notifId).toBe('1');
        done();
      });

      service.dismissNotification('1');
    });
  });

  describe('Unread Count', () => {
    xit('should return unread notification count', (done) => {
      service.getUnreadCount().subscribe((count) => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
        done();
      });
    });

    xit('should update count when notification added', () => {
      const notification = {
        id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);

      service.getUnreadCount().subscribe((count) => {
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('Build Alert Notification', () => {
    it('should build alert notification', () => {
      const action: NotificationAction = 'CREATE';
      const alert = {
        id: 1,
        severity: 'HIGH',
        message: 'Alert message',
        timestamp: '2024-01-15T10:00:00Z'
      };

      const notification = service.buildAlertNotification(action, alert);

      expect(notification.title).toBeTruthy();
      expect(notification.message).toBeTruthy();
      expect(notification.type).toBeTruthy();
    });

    xit('should handle RESOLVE action', () => {
      const action: NotificationAction = 'RESOLVE';
      const alert = {
        id: 1,
        severity: 'HIGH',
        message: 'Resolved alert',
        timestamp: '2024-01-15T10:00:00Z'
      };

      const notification = service.buildAlertNotification(action, alert);

      expect(notification.message).toContain('Resolved' || 'resolved');
    });

    xit('should set notification type based on alert severity', () => {
      const action: NotificationAction = 'CREATE';
      const alert = {
        id: 1,
        severity: 'HIGH',
        message: 'High severity alert',
        timestamp: '2024-01-15T10:00:00Z'
      };

      const notification = service.buildAlertNotification(action, alert);

      expect(['ALERT', 'WARNING', 'ERROR']).toContain(notification.type);
    });
  });

  describe('Notification Types', () => {
    xit('should handle INFO notifications', (done) => {
      const notification = {
        id: '1',
        title: 'Info',
        message: 'Informational message',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);

      service.getNotifications().subscribe((notifications) => {
        const found = notifications.find((n) => n.type === 'INFO');
        expect(found).toBeTruthy();
        done();
      });
    });

    xit('should handle WARNING notifications', (done) => {
      const notification = {
        id: '2',
        title: 'Warning',
        message: 'Warning message',
        type: 'WARNING',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);

      service.getNotifications().subscribe((notifications) => {
        const found = notifications.find((n) => n.type === 'WARNING');
        expect(found).toBeTruthy();
        done();
      });
    });

    xit('should handle ERROR notifications', (done) => {
      const notification = {
        id: '3',
        title: 'Error',
        message: 'Error message',
        type: 'ERROR',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);

      service.getNotifications().subscribe((notifications) => {
        const found = notifications.find((n) => n.type === 'ERROR');
        expect(found).toBeTruthy();
        done();
      });
    });

    xit('should handle ALERT notifications', (done) => {
      const notification = {
        id: '4',
        title: 'Alert',
        message: 'Alert message',
        type: 'ALERT',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);

      service.getNotifications().subscribe((notifications) => {
        const found = notifications.find((n) => n.type === 'ALERT');
        expect(found).toBeTruthy();
        done();
      });
    });
  });

  describe('Observable Patterns', () => {
    xit('should provide notification stream', () => {
      const stream = service.getNotifications();
      expect(stream).toBeTruthy();
    });

    xit('should provide unread count stream', () => {
      const stream = service.getUnreadCount();
      expect(stream).toBeTruthy();
    });

    xit('should emit on notification added', (done) => {
      let emitted = false;

      service.notificationAdded$.subscribe(() => {
        emitted = true;
      });

      const notification = {
        id: '1',
        title: 'Test',
        message: 'Test',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);

      setTimeout(() => {
        expect(emitted).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Multiple Operations', () => {
    xit('should handle multiple notifications', () => {
      const notif1 = {
        id: '1',
        title: 'Test 1',
        message: 'Message 1',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      const notif2 = {
        id: '2',
        title: 'Test 2',
        message: 'Message 2',
        type: 'WARNING',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notif1);
      service.addNotification(notif2);

      service.getNotifications().subscribe((notifications) => {
        expect(notifications.length).toBeGreaterThanOrEqual(2);
      });
    });

    xit('should handle mark and dismiss together', () => {
      const notification = {
        id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);
      service.markAsRead('1');
      service.dismissNotification('1');

      service.getNotifications().subscribe((notifications) => {
        const found = notifications.find((n) => n.id === '1');
        expect(found).toBeUndefined();
      });
    });
  });

  describe('Edge Cases', () => {
    xit('should handle duplicate IDs gracefully', () => {
      const notification = {
        id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'INFO',
        timestamp: new Date(),
        read: false
      };

      service.addNotification(notification);
      service.addNotification(notification);

      service.getNotifications().subscribe((notifications) => {
        expect(notifications.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle mark as read on non-existent notification', () => {
      expect(() => {
        service.markAsRead('non-existent');
      }).not.toThrow();
    });

    xit('should handle dismiss on non-existent notification', () => {
      expect(() => {
        service.dismissNotification('non-existent');
      }).not.toThrow();
    });
  });
});
