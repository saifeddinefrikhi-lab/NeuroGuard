import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { Client, Message, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient!: Client;
  private prescriptionNotifications = new Subject<any>();
  private carePlanNotifications = new Subject<any>();
  private connectionStatus = new BehaviorSubject<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED');
  private subscriptions: Map<string, StompSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private connectedUserId: string | null = null;
  private connectedChannel: 'prescriptions' | 'care-plans' | null = null;

  constructor(private authService: AuthService) { }

  /**
   * Get the connection status observable
   */
  public getConnectionStatus(): Observable<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Connect to WebSocket and subscribe to user-specific topics
   */
  public connect(userId: number | string, channel: 'prescriptions' | 'care-plans' = 'prescriptions'): Promise<void> {
    return new Promise((resolve, reject) => {
      const normalizedUserId = userId.toString();

      if (this.stompClient?.active) {
        if (this.connectedUserId === normalizedUserId && this.connectedChannel === channel) {
          console.log('✅ WebSocket already connected for same user');
          this.ensureSubscriptions(normalizedUserId, channel);
          resolve();
          return;
        }

        // User changed (e.g., logout/login): force reconnect to avoid wrong topic subscription.
        this.disconnect();
      }

      this.connectionStatus.next('CONNECTING');
      const wsBaseUrl = channel === 'care-plans'
        ? ((environment as any).carePlanWsUrl || environment.apiUrl)
        : ((environment as any).wsUrl || environment.apiUrl);
      const socketPath = channel === 'care-plans' ? '/api/care-plans/ws' : '/api/prescriptions/ws';
      const socketUrl = `${wsBaseUrl}${socketPath}`;
      const token = localStorage.getItem('authToken');

      if (!token) {
        console.error('❌ No authorization token found');
        this.connectionStatus.next('ERROR');
        reject(new Error('No authorization token'));
        return;
      }

      this.stompClient = new Client({
        connectHeaders: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId.toString()
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          console.log('[STOMP] ' + str);
        },
        onConnect: () => this.onConnectHandler(normalizedUserId, channel, resolve),
        onDisconnect: () => this.onDisconnectHandler(),
        onStompError: (frame) => this.onStompErrorHandler(frame, reject),
        onWebSocketError: (event) => this.onWebSocketErrorHandler(event, reject),
        onWebSocketClose: () => this.onWebSocketCloseHandler()
      });

      // Use webSocketFactory with SockJS for fallback support
      this.stompClient.webSocketFactory = () => {
        return new SockJS(socketUrl) as any;
      };

      try {
        this.stompClient.activate();
      } catch (error) {
        console.error('❌ Error activating STOMP client:', error);
        this.connectionStatus.next('ERROR');
        reject(error);
      }
    });
  }

  /**
   * Handle successful connection
   */
  private onConnectHandler(userId: string, channel: 'prescriptions' | 'care-plans', resolve: () => void): void {
    console.log('✅ Connected to WebSocket');
    this.connectionStatus.next('CONNECTED');
    this.reconnectAttempts = 0;
    this.connectedUserId = userId;
    this.connectedChannel = channel;

    // Subscribe to prescription notifications for this user
    this.ensureSubscriptions(userId, channel);

    resolve();
  }

  private ensureSubscriptions(userId: string, channel: 'prescriptions' | 'care-plans'): void {
    this.subscribeToUserNotifications(userId, channel);
    this.subscribeToGlobalNotifications();
  }

  /**
   * Subscribe to user-specific prescription notifications
   */
  private subscribeToUserNotifications(userId: number | string, channel: 'prescriptions' | 'care-plans'): void {
    const topicPath = channel === 'care-plans'
      ? `/topic/care-plans/${userId}`
      : `/topic/prescriptions/${userId}`;
    console.log(`📬 Subscribing to user notifications: ${topicPath}`);

    const existing = this.subscriptions.get(topicPath);
    if (existing) {
      return;
    }

    const subscription = this.stompClient.subscribe(topicPath, (message: Message) => {
      console.log('📨 Message received:', message.body);
      if (message.body) {
        try {
          const parsed = JSON.parse(message.body);
          console.log('✅ Parsed prescription notification:', parsed);
          if (channel === 'care-plans') {
            this.carePlanNotifications.next(parsed);
          } else {
            this.prescriptionNotifications.next(parsed);
          }
        } catch (e) {
          console.log('⚠️ Could not parse JSON, treating as text:', message.body);
          if (channel === 'care-plans') {
            this.carePlanNotifications.next(message.body);
          } else {
            this.prescriptionNotifications.next(message.body);
          }
        }
      }
    });

    this.subscriptions.set(topicPath, subscription);
  }

  /**
   * Subscribe to global notifications (for UI alerts, system messages)
   */
  private subscribeToGlobalNotifications(): void {
    const topicPath = '/topic/notifications';

    const existing = this.subscriptions.get(topicPath);
    if (existing) {
      return;
    }
    
    const subscription = this.stompClient.subscribe(topicPath, (message: Message) => {
      console.log('📢 Global notification:', message.body);
      if (message.body) {
        try {
          const parsed = JSON.parse(message.body);
          this.prescriptionNotifications.next({
            type: 'GLOBAL_NOTIFICATION',
            data: parsed,
            timestamp: new Date()
          });
        } catch (e) {
          console.log('⚠️ Global notification text:', message.body);
        }
      }
    });

    this.subscriptions.set(topicPath, subscription);
  }

  /**
   * Handle disconnect
   */
  private onDisconnectHandler(): void {
    console.log('⚠️ Disconnected from WebSocket');
    this.connectionStatus.next('DISCONNECTED');
    this.subscriptions.clear();
    this.connectedUserId = null;
    this.connectedChannel = null;
  }

  /**
   * Handle STOMP errors
   */
  private onStompErrorHandler(frame: any, reject?: (reason?: any) => void): void {
    console.error('❌ STOMP Error:', frame.headers['message']);
    console.error('Error details:', frame.body);
    this.connectionStatus.next('ERROR');
    
    if (reject) {
      reject(new Error(`STOMP Error: ${frame.headers['message']}`));
    }

    // Attempt to reconnect
    this.attemptReconnect();
  }

  /**
   * Handle WebSocket errors
   */
  private onWebSocketErrorHandler(event: Event, reject?: (reason?: any) => void): void {
    console.error('❌ WebSocket Error:', event);
    this.connectionStatus.next('ERROR');
    
    if (reject) {
      reject(new Error('WebSocket connection error'));
    }

    // Attempt to reconnect
    this.attemptReconnect();
  }

  /**
   * Handle WebSocket close
   */
  private onWebSocketCloseHandler(): void {
    console.warn('⚠️ WebSocket connection closed');
    this.connectionStatus.next('DISCONNECTED');
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`⏳ Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        const userId = this.authService.currentUser?.userId;
        if (userId) {
          this.connect(userId, this.connectedChannel || 'prescriptions').catch(err => {
            console.error('❌ Reconnection failed:', err);
          });
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Send a message to a specific destination
   */
  public sendMessage(destination: string, message: any): void {
    if (!this.stompClient?.active) {
      console.error('❌ WebSocket not connected');
      return;
    }

    try {
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
      console.log(`✅ Message sent to ${destination}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
      console.log('✅ WebSocket disconnected');
    }
    this.subscriptions.clear();
    this.connectionStatus.next('DISCONNECTED');
    this.connectedUserId = null;
    this.connectedChannel = null;
  }

  /**
   * Get prescription notifications observable
   */
  public getPrescriptionNotifications(): Observable<any> {
    return this.prescriptionNotifications.asObservable();
  }

  public getCarePlanNotifications(): Observable<any> {
    return this.carePlanNotifications.asObservable();
  }

  public connectCarePlan(userId: number | string): Promise<void> {
    return this.connect(userId, 'care-plans');
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.stompClient?.active ?? false;
  }
}

