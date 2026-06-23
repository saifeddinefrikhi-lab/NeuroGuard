import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Service Angular pour tous les calculs de distance et proximité.
 * Appelle les endpoints du backend consultation-service.
 */
@Injectable({
  providedIn: 'root'
})
export class DistanceService {

  private readonly apiUrl = environment.apiUrl || 'http://localhost:8083';
  private readonly distanceEndpoint = `${this.apiUrl}/api/distance`;

  constructor(private http: HttpClient) {}

  /**
   * Calcule la distance à vol d'oiseau (Haversine) entre deux coordonnées.
   */
  public calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): Observable<any> {
    const request = {
      point1: { latitude: lat1, longitude: lon1 },
      point2: { latitude: lat2, longitude: lon2 }
    };
    return this.http.post(`${this.distanceEndpoint}/haversine`, request);
  }

  /**
   * Géocode une adresse en coordonnées GPS.
   */
  public geocodeAddress(address: string): Observable<any> {
    return this.http.get(`${this.distanceEndpoint}/geocode?address=${encodeURIComponent(address)}`);
  }

  /**
   * Calcule la distance entre deux adresses.
   */
  public calculateDistanceFromAddresses(address1: string, address2: string): Observable<any> {
    const request = {
      address1,
      address2
    };
    return this.http.post(`${this.distanceEndpoint}/from-addresses`, request);
  }

  /**
   * Trie les médecins par distance depuis un point de référence.
   */
  public sortProvidersByDistance(referencePoint: any, providers: any[]): Observable<any> {
    const request = {
      referencePoint,
      providers
    };
    return this.http.post(`${this.distanceEndpoint}/sort-by-distance`, request);
  }

  /**
   * ========== NOUVELLE FONCTIONNALITÉ AVANCÉE ==========
   * Trouve les médecins les plus proches du patient.
   * Utilise Google Distance Matrix pour distance réelle (pas vol d'oiseau).
   * Supporte multiples modes de transport: DRIVING, WALKING, TRANSIT, BICYCLING.
   *
   * @param patientLocation Localisation du patient { latitude, longitude }
   * @param providers Liste des médecins avec coordonnées
   * @param transportMode Mode de transport (DRIVING, WALKING, TRANSIT, BICYCLING)
   * @param radiusKm Rayon de recherche en km
   * @param limit Nombre max de résultats
   */
  public findClosestProviders(
    patientLocation: any,
    providers: any[],
    transportMode: string = 'DRIVING',
    radiusKm: number = 50,
    limit: number = 10
  ): Observable<any> {

    const request = {
      patientLocation,
      providers,
      transportMode,
      radiusKm,
      limit
    };

    return this.http.post(`${this.distanceEndpoint}/find-closest-providers`, request);
  }

  /**
   * Optimise l'ordre de visite de plusieurs patients (TSP - Traveling Salesman Problem).
   * Retourne l'ordre optimal, distance totale, et ETA.
   *
   * @param startLocation Localisation de départ du médecin
   * @param patientLocations Liste des positions des patients
   * @param patientLabels Noms/identifiants des patients
   */
  public optimizeTour(
    startLocation: any,
    patientLocations: any[],
    patientLabels?: string[]
  ): Observable<any> {

    const request = {
      startLocation,
      patientLocations,
      patientLabels: patientLabels || patientLocations.map((_, i) => `Patient ${i + 1}`)
    };

    return this.http.post(`${this.distanceEndpoint}/optimize-tour`, request);
  }

  /**
   * Version avancée d'optimisation avec amélioration 2-Opt.
   * Meilleure qualité mais légèrement plus lent.
   */
  public optimizeTourAdvanced(
    startLocation: any,
    patientLocations: any[],
    patientLabels?: string[]
  ): Observable<any> {

    const request = {
      startLocation,
      patientLocations,
      patientLabels: patientLabels || patientLocations.map((_, i) => `Patient ${i + 1}`)
    };

    return this.http.post(`${this.distanceEndpoint}/optimize-tour-advanced`, request);
  }

  /**
   * Trouve les médecins les plus proches d'un patient.
   * Utilise l'endpoint /api/providers/nearest qui va interroger le user-service.
   */
  public getNearestProviders(
    lat: number,
    lon: number,
    transportMode: string = 'DRIVING',
    radiusKm: number = 50,
    limit: number = 10
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/providers/nearest?lat=${lat}&lon=${lon}&mode=${transportMode}&radius=${radiusKm}&limit=${limit}`);
  }
}
