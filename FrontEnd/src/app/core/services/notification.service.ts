import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'alert' | 'medical-history';
export type NotificationAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESOLVE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  action: NotificationAction;
  /// Icon name from @ant-design/icons-angular
  icon: string;
  /// CSS class for the avatar background
  avatarBg: string;
  title: string;
  message: string;
  severity?: string;
  patientName?: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly MAX_NOTIFICATIONS = 50;

  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this._notifications.asObservable();

  get notifications(): AppNotification[] {
    return this._notifications.getValue();
  }

  get unreadCount(): number {
    return this._notifications.getValue().filter(n => !n.read).length;
  }

  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: AppNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      read: false
    };
    const current = this._notifications.getValue();
    const updated = [newNotification, ...current].slice(0, this.MAX_NOTIFICATIONS);
    this._notifications.next(updated);
  }

  markAllAsRead(): void {
    const current = this._notifications.getValue();
    const hasUnread = current.some(n => !n.read);
    if (!hasUnread) return;
    const updated = current.map(n => ({ ...n, read: true }));
    this._notifications.next(updated);
  }

  markAsRead(id: string): void {
    const updated = this._notifications.getValue().map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this._notifications.next(updated);
  }

  dismissOne(id: string): void {
    const updated = this._notifications.getValue().filter(n => n.id !== id);
    this._notifications.next(updated);
  }

  clearAll(): void {
    this._notifications.next([]);
  }

  // Resolve icon and bg from action + severity
  private resolveIconAndBg(action: NotificationAction, severity?: string): { icon: string; avatarBg: string } {
    switch (action) {
      case 'RESOLVE':
        return { icon: 'check-circle', avatarBg: 'bg-light-success' };
      case 'DELETE':
        return { icon: 'delete', avatarBg: 'bg-light-danger' };
      case 'UPDATE':
        return { icon: 'edit', avatarBg: 'bg-light-primary' };
      case 'CREATE':
      default:
        if (severity === 'CRITICAL') return { icon: 'warning', avatarBg: 'bg-light-danger' };
        if (severity === 'WARNING')  return { icon: 'exclamation-circle', avatarBg: 'bg-light-warning' };
        return { icon: 'bell', avatarBg: 'bg-light-info' };
    }
  }

  buildAlertNotification(action: NotificationAction, data: any): Omit<AppNotification, 'id' | 'timestamp' | 'read'> {
    const actionLabels: Record<NotificationAction, string> = {
      CREATE: 'New Alert',
      UPDATE: 'Alert Updated',
      DELETE: 'Alert Removed',
      RESOLVE: 'Alert Resolved'
    };
    const { icon, avatarBg } = this.resolveIconAndBg(action, data?.severity);
    return {
      type: 'alert',
      action,
      icon,
      avatarBg,
      title: actionLabels[action] + (data?.severity ? ` — ${data.severity}` : ''),
      message: data?.message || 'An alert has changed status.',
      severity: data?.severity,
      patientName: data?.patientName
    };
  }
}
