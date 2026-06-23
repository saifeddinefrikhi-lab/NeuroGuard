import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Service pour le suivi GPS en temps réel des médecins via WebSocket.
 * Gère les connexions WebSocket et les mises à jour de position.
 */
@Injectable({
  providedIn: 'root'
})
export class LocationTrackingService {

  private baseUrl = environment.apiUrl || 'http://localhost:8084';
  private wsBaseUrl = environment.wsUrl || 'ws://localhost:8084';

  // Sujets pour les mises à jour de location
  private providerLocationSubject = new BehaviorSubject<any>(null);
  public providerLocation$ = this.providerLocationSubject.asObservable();

  private activeProvidersSubject = new BehaviorSubject<number>(0);
  public activeProviders$ = this.activeProvidersSubject.asObservable();

  private locationErrorSubject = new Subject<string>();
  public locationError$ = this.locationErrorSubject.asObservable();

  // Gestion des WebSocket connections
  private webSocketConnections = new Map<number, WebSocketSubject<any>>();
  private webSocketSubscriptions = new Map<number, any>();

  constructor(private http: HttpClient) {}

  /**
   * Démarre le suivi GPS en temps réel d'un médecin via WebSocket.
   * Connexion à /ws-location/provider/{providerId}
   *
   * @param providerId ID du médecin à suivre
   * @returns Observable des mises à jour de location
   */
  public startTrackingProvider(providerId: number): Observable<any> {
    if (this.webSocketConnections.has(providerId)) {
      return this.webSocketConnections.get(providerId)!.asObservable();
    }

    const wsUrl = `${this.wsBaseUrl}/ws-location/provider/${providerId}`;
    
    try {
      const socket$ = new WebSocketSubject<any>({
        url: wsUrl,
        openObserver: {
          next: () => {
            console.log(`WebSocket opened for provider ${providerId}`);
          }
        },
        closeObserver: {
          next: () => {
            console.log(`WebSocket closed for provider ${providerId}`);
            this.webSocketConnections.delete(providerId);
            this.webSocketSubscriptions.delete(providerId);
          }
        }
      });

      const subscription = socket$.subscribe(
        (message: any) => {
          if (message.type === 'ERROR') {
            this.locationErrorSubject.next(message.message);
          } else {
            this.providerLocationSubject.next(message);
          }
        },
        (error) => {
          console.error(`WebSocket error for provider ${providerId}:`, error);
          this.locationErrorSubject.next(`Connection error: ${error.message}`);
          this.webSocketConnections.delete(providerId);
        }
      );

      this.webSocketConnections.set(providerId, socket$);
      this.webSocketSubscriptions.set(providerId, subscription);

      return socket$.asObservable();
    } catch (error: any) {
      this.locationErrorSubject.next(`Failed to connect: ${error.message}`);
      throw error;
    }
  }

  /**
   * Arrête le suivi d'un médecin.
   */
  public stopTrackingProvider(providerId: number): void {
    const socket = this.webSocketConnections.get(providerId);
    if (socket) {
      socket.complete();
      this.webSocketConnections.delete(providerId);
    }

    const subscription = this.webSocketSubscriptions.get(providerId);
    if (subscription) {
      subscription.unsubscribe();
      this.webSocketSubscriptions.delete(providerId);
    }
  }

  /**
   * Envoie une mise à jour de position du médecin (côté médecin).
   * Appel manuel via HTTP si WebSocket n'est pas disponible.
   *
   * @param providerId ID du médecin
   * @param latitude Latitude actuelle
   * @param longitude Longitude actuelle
   */
  public updateProviderLocation(providerId: number, latitude: number, longitude: number): Observable<any> {
    const url = `${this.baseUrl}/api/location/provider/${providerId}/update`;

    const locationData = {
      latitude,
      longitude,
      accuracy: null,
      speed: null,
      status: 'ACTIVE'
    };

    return this.http.post(url, locationData);
  }

  /**
   * Récupère la position GPS actuelle d'un médecin (HTTP polling).
   *
   * @param providerId ID du médecin
   */
  public getProviderLocation(providerId: number): Observable<any> {
    const url = `${this.baseUrl}/api/location/provider/${providerId}`;
    return this.http.get(url);
  }

  /**
   * Récupère le statut du tracking for un médecin.
   */
  public getProviderLocationStatus(providerId: number): Observable<any> {
    const url = `${this.baseUrl}/api/location/provider/${providerId}/status`;
    return this.http.get(url);
  }

  /**
   * Arrête le tracking du médecin (côté serveur).
   */
  public stopProviderTracking(providerId: number): Observable<any> {
    const url = `${this.baseUrl}/api/location/provider/${providerId}`;
    return this.http.delete(url);
  }

  /**
   * Récupère le nombre de médecins actuellement en tournée.
   */
  public getActiveProvidersCount(): Observable<any> {
    const url = `${this.baseUrl}/api/location/stats/active-providers`;
    return this.http.get(url);
  }

  /**
   * Arrête tous les suivis actifs.
   */
  public stopAllTracking(): void {
    this.webSocketConnections.forEach((socket, providerId) => {
      this.stopTrackingProvider(providerId);
    });
  }

  /**
   * Envoie une mise à jour de position via la connexion WebSocket.
   * Utilisé par le médecin en tournée.
   */
  public sendLocationUpdate(providerId: number, locationData: any): void {
    const socket = this.webSocketConnections.get(providerId);
    if (socket) {
      socket.next(locationData);
    } else {
      console.warn(`No WebSocket connection for provider ${providerId}`);
      // Fallback à HTTP
      this.updateProviderLocation(providerId, locationData.latitude, locationData.longitude).subscribe();
    }
  }
}
