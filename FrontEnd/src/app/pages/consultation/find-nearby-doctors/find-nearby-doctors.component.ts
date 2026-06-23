import { Component, OnInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DistanceService } from '../../../services/distance.service';
import { User } from '../../../core/models/user.model';
import { Consultation } from '../../../core/models/consultation.model';
import { HttpClient } from '@angular/common/http';
import { ReservationService } from '../../../services/reservation.service';

// Déclaration Google Maps API
declare let google: any;

/**
 * Composant pour trouver et afficher les médecins les plus proches sur une carte.
 * Features:
 * - Utilise la position actuelle du patient (géolocalisation)
 * - Affiche les médecins sur carte Google Maps
 * - Montre distance réelle + ETA pour chaque médecin
 * - Filtre par mode de transport (voiture, pied, transports)
 * - Permet sélection et réservation de consultation
 */
@Component({
  selector: 'app-find-nearby-doctors',
  templateUrl: './find-nearby-doctors.component.html',
  styleUrls: ['./find-nearby-doctors.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FindNearbyDoctorsComponent implements OnInit {

  @ViewChild('googleMap', { static: false }) mapElement!: ElementRef;

  // Position du patient
  patientLocation: any = null;
  patientLocationError: string = '';

  // Paramètres de recherche
  selectedTransportMode: string = 'DRIVING';
  searchRadius: number = 50;
  maxResults: number = 10;

  // Résultats
  closestProviders: any[] = [];
  filteredProviders: any[] = [];
  selectedProvider: any = null;

  // États
  isSearching: boolean = false;
  isLoadingLocation: boolean = false;
  resultCount: number = 0;
  
  // Debounce timer pour éviter les recherches multiples
  private debounceTimer: any = null;
  private lastSearchTime: number = 0;

  // Modes de transport disponibles
  transportModes = [
    { value: 'DRIVING', label: 'Voiture' },
    { value: 'WALKING', label: 'Pied' },
    { value: 'TRANSIT', label: 'Transports en commun' },
    { value: 'BICYCLING', label: 'Vélo' }
  ];

  // Carte Google
  map: any;
  markers: any[] = [];
  userMarker: any;

  // Toast notifications
  successMessage: string = '';
  errorMessage: string = '';

  // Disponibilité des médecins (mock data pour demo)
  providerAvailability: Map<number, boolean> = new Map();

  // Injection des services
  private distanceService = inject(DistanceService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private reservationService = inject(ReservationService);
  private router = inject(Router);

  ngOnInit(): void {
    this.initializeMap();
    this.getCurrentLocation();
  }

  private initializeMap(): void {
    setTimeout(() => {
      if (this.mapElement && typeof google !== 'undefined') {
        const defaultLocation = { lat: 48.8566, lng: 2.3522 }; 
        this.map = new google.maps.Map(this.mapElement.nativeElement, {
          zoom: 12,
          center: defaultLocation,
          styles: [
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });
      }
    }, 500);
  }

  public getCurrentLocation(): void {
    this.isLoadingLocation = true;
    this.patientLocationError = '';
    this.successMessage = '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.patientLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          this.isLoadingLocation = false;
          this.successMessage = 'Location obtained successfully. Click "Search" to find nearby doctors.';

          if (this.map) {
            this.updateMapWithPatientLocation();
          }
        },
        (error) => {
          this.isLoadingLocation = false;
          this.patientLocationError = this.getGeolocationErrorMessage(error.code);
          
          const storedLat = localStorage.getItem('patientLat');
          const storedLon = localStorage.getItem('patientLon');
          
          if (storedLat && storedLon) {
             this.patientLocation = {
                latitude: parseFloat(storedLat),
                longitude: parseFloat(storedLon)
             };
             this.patientLocationError = 'Loaded location from settings.';
             this.successMessage = 'Location known. Click "Search".';
          } else {
             this.patientLocation = {
               latitude: 48.8566,
               longitude: 2.3522
             };
          }
          this.updateMapWithPatientLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.isLoadingLocation = false;
      this.patientLocationError = 'Geolocation is not supported by your browser';
    }
  }

  private updateMapWithPatientLocation(): void {
    if (!this.map || !this.patientLocation) return;

    if (this.userMarker) {
      this.userMarker.setPosition({
        lat: this.patientLocation.latitude,
        lng: this.patientLocation.longitude
      });
    } else {
      this.userMarker = new google.maps.Marker({
        position: {
          lat: this.patientLocation.latitude,
          lng: this.patientLocation.longitude
        },
        map: this.map,
        title: 'Your Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      });
    }

    this.map.setCenter({
      lat: this.patientLocation.latitude,
      lng: this.patientLocation.longitude
    });
  }

  public searchClosestProviders(): void {
    const now = Date.now();
    if (now - this.lastSearchTime < 1000) {
      return;
    }

    if (!this.patientLocation) {
      this.errorMessage = 'Patient location not available';
      return;
    }

    this.lastSearchTime = now;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.isSearching = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.distanceService.getNearestProviders(
      this.patientLocation.latitude,
      this.patientLocation.longitude,
      this.selectedTransportMode,
      this.searchRadius,
      this.maxResults
    ).subscribe(
      (response) => {
        this.isSearching = false;
        this.closestProviders = response.providers || [];
        this.filteredProviders = this.closestProviders;
        this.resultCount = response.resultCount || 0;

        if (this.closestProviders.length > 0) {
          this.successMessage = `Found ${this.resultCount} specialist(s) nearby.`;
          this.updateMapWithProviders();
        } else {
          this.errorMessage = `No specialists found within ${this.searchRadius} km.`;
        }
        this.cdr.markForCheck();
      },
      (error) => {
        this.isSearching = false;
        this.errorMessage = 'Error during search: ' + (error.error?.message || error.message);
        this.cdr.markForCheck();
      }
    );
  }

  private updateMapWithProviders(): void {
    if (!this.map) return;

    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];

    this.closestProviders.forEach((provider, index) => {
      const marker = new google.maps.Marker({
        position: {
          lat: provider.location.latitude,
          lng: provider.location.longitude
        },
        map: this.map,
        title: provider.providerName || `Doctor ${index + 1}`,
        label: (index + 1).toString()
      });

      const infoContent = this.getProviderInfoWindowContent(provider);
      const infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
        this.selectProvider(provider);
      });

      this.markers.push(marker);
    });

    if (this.markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      if (this.userMarker) {
        bounds.extend(this.userMarker.getPosition());
      }
      this.markers.forEach(marker => bounds.extend(marker.getPosition()));
      this.map.fitBounds(bounds);
    }
  }

  private getProviderInfoWindowContent(provider: any): string {
    const duration = provider.estimatedDurationHuman || 'N/A';
    const distance = provider.roadDistanceKm || provider.distanceKm;

    return `<div style="max-width: 300px;">
      <h4>${provider.providerName || 'Doctor'}</h4>
      <p><strong>Specialty:</strong> ${provider.specialty || 'General Practitioner'}</p>
      <p><strong>Distance:</strong> ${distance} km</p>
      <p><strong>Time:</strong> ${duration}</p>
    </div>`;
  }

  public selectProvider(provider: any): void {
    this.selectedProvider = provider;
  }

  public showDirections(provider: any): void {
    if (!this.patientLocation) return;

    const from = `${this.patientLocation.latitude},${this.patientLocation.longitude}`;
    const to = `${provider.location.latitude},${provider.location.longitude}`;
    const modeMap: {[key: string]: string} = {
      'DRIVING': 'd',
      'WALKING': 'w',
      'TRANSIT': 'r',
      'BICYCLING': 'b'
    };
    const mode = modeMap[this.selectedTransportMode] || 'd';

    const url = `https://www.google.com/maps/dir/?api=1&origin=${from}&destination=${to}&travelmode=${mode}`;
    window.open(url, '_blank');
  }

  public onTransportModeChange(): void {
    this.searchClosestProviders();
  }

  public onRadiusChange(): void {
    this.searchClosestProviders();
  }

  private getGeolocationErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Geolocation permission denied';
      case 2:
        return 'Location unavailable';
      case 3:
        return 'Timeout exceeded';
      default:
        return 'Geolocation error';
    }
  }

  // --- Booking functions ---
  public openBookingModal(provider: any): void {
    console.log('Redirecting to booking for provider:', provider.providerId);
    // Redirect to patient reservations page with the providerId in query params
    this.router.navigate(['/patient/reservations'], { 
      queryParams: { providerId: provider.providerId } 
    });
  }
}
