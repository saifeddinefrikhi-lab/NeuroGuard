import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PharmacyService, Pharmacy, Clinic } from '../../../../core/services/pharmacy.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';

@Component({
  selector: 'app-patient-pharmacy-locator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './pharmacy-locator.component.html',
  styleUrls: ['./pharmacy-locator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PharmacyLocatorComponent implements OnInit, OnDestroy {

  pharmacies: Pharmacy[] = [];
  filteredPharmacies: Pharmacy[] = [];
  selectedPharmacy: Pharmacy | null = null;
  clinics: Clinic[] = [];
  filteredClinics: Clinic[] = [];
  selectedClinic: Clinic | null = null;
  
  loading = false;
  error: string | null = null;
  success: string | null = null;
  
  searchForm!: FormGroup;
  filterType: 'nearby' | 'open' | 'delivery' | '24h' | 'all' = 'nearby';
  clinicFilterType: 'nearby' | 'open' | 'emergency' | 'insurance' | 'all' = 'nearby';
  radiusKm = 10;
  mode: 'pharmacy' | 'clinic' = 'pharmacy';
  
  userLocation: { latitude: number; longitude: number } | null = null;
  locationError: string | null = null;
  
  // For notifications
  displayNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' = 'info';
  
  // For Leaflet map
  @ViewChild('mapDiv') mapDiv!: ElementRef<HTMLDivElement>;
  private leafletMap: L.Map | null = null;
  private userMarker: L.CircleMarker | null = null;
  private destinationMarker: L.CircleMarker | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private pharmacyService: PharmacyService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.getCurrentUserLocation();
  }

  ngOnDestroy(): void {
    // Clean up Leaflet map
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize search form
   */
  private initForm(): void {
    this.searchForm = this.formBuilder.group({
      searchName: ['', [Validators.required]],
      radius: [10, [Validators.required, Validators.min(1), Validators.max(50)]]
    });
  }

  /**
   * Get current user location using Geolocation API
   */
  getCurrentUserLocation(): void {
    this.loading = true;
    this.locationError = null;
    
    this.pharmacyService.getCurrentLocation()
      .then((location) => {
        this.userLocation = location;
        this.displayNotificationMessage('Location obtained successfully', 'success');
        // Initialize the map after location is obtained
        setTimeout(() => this.initializeMap(), 100);
        this.findNearbyPharmacies();
        this.cdr.markForCheck();
      })
      .catch((error) => {
        console.error('Erreur de géolocalisation:', error);
        this.locationError = 'Unable to access your location. Please check permissions.';
        this.displayNotificationMessage(this.locationError, 'error');
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  /**
   * Find nearby pharmacies based on user location
   */
  findNearbyPharmacies(): void {
    if (!this.userLocation) {
      this.displayNotificationMessage('Location not available', 'error');
      return;
    }

    this.loading = true;
    this.error = null;

    this.pharmacyService.findNearbyPharmacies(
      this.userLocation.latitude,
      this.userLocation.longitude,
      this.radiusKm,
      this.filterType === 'open'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pharmacies = data;
          this.applyFilter();
          this.loading = false;
          this.displayNotificationMessage(`${data.length} pharmacies found`, 'success');
          // Update map with nearest pharmacy
          setTimeout(() => this.updateDestinationMarker(), 100);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des pharmacies:', err);
          this.error = 'Error while loading pharmacies';
          this.displayNotificationMessage(this.error, 'error');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  findNearbyClinics(): void {
    if (!this.userLocation) {
      this.displayNotificationMessage('Location not available', 'error');
      return;
    }

    this.loading = true;
    this.error = null;

    this.pharmacyService.findNearbyClinics(
      this.userLocation.latitude,
      this.userLocation.longitude,
      this.radiusKm,
      this.clinicFilterType === 'open'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clinics = data;
          this.applyClinicFilter();
          this.loading = false;
          this.displayNotificationMessage(`${data.length} clinics found`, 'success');
          // Update map with nearest clinic
          setTimeout(() => this.updateDestinationMarker(), 100);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des cliniques:', err);
          this.error = 'Error while loading clinics';
          this.displayNotificationMessage(this.error, 'error');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Search pharmacies by name
   */
  searchPharmacies(): void {
    const searchName = this.searchForm.get('searchName')?.value;
    
    if (!searchName || searchName.trim() === '') {
      this.displayNotificationMessage('Please enter a pharmacy name', 'error');
      return;
    }

    this.loading = true;
    this.error = null;

    this.pharmacyService.searchByName(searchName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pharmacies = data;
          this.applyFilter();
          this.loading = false;
          this.displayNotificationMessage(`${data.length} pharmacies found`, 'success');
          // Update map with first result
          setTimeout(() => this.updateDestinationMarker(), 100);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erreur lors de la recherche:', err);
          this.error = 'Search error';
          this.displayNotificationMessage(this.error, 'error');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  searchClinics(): void {
    const searchName = this.searchForm.get('searchName')?.value;

    if (!searchName || searchName.trim() === '') {
      this.displayNotificationMessage('Veuillez entrer un nom de clinique', 'error');
      return;
    }

    this.loading = true;
    this.error = null;

    this.pharmacyService.searchClinicsByName(searchName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clinics = data;
          this.applyClinicFilter();
          this.loading = false;
          this.displayNotificationMessage(`${data.length} cliniques trouvées`, 'success');
          // Update map with first result
          setTimeout(() => this.updateDestinationMarker(), 100);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erreur lors de la recherche des cliniques:', err);
          this.error = 'Erreur lors de la recherche des cliniques';
          this.displayNotificationMessage(this.error, 'error');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Get all pharmacies (no filtering)
   */
  getAllPharmacies(): void {
    this.loading = true;
    this.error = null;

    this.pharmacyService.getAllPharmacies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pharmacies = data;
          this.applyFilter();
          this.loading = false;
          this.displayNotificationMessage(`${data.length} pharmacies trouvées`, 'success');
          // Update map with first result
          setTimeout(() => this.updateDestinationMarker(), 100);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération:', err);
          this.error = 'Erreur lors de la récupération des pharmacies';
          this.displayNotificationMessage(this.error, 'error');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Filter pharmacies based on selected filter type
   */
  applyFilter(): void {
    switch (this.filterType) {
      case 'open':
        this.filteredPharmacies = this.pharmacies.filter(p => p.openNow);
        break;
      case 'delivery':
        this.filteredPharmacies = this.pharmacies.filter(p => p.hasDelivery);
        break;
      case '24h':
        this.filteredPharmacies = this.pharmacies.filter(p => p.accepts24h);
        break;
      case 'nearby':
      case 'all':
      default:
        this.filteredPharmacies = this.pharmacies;
        break;
    }
    this.cdr.markForCheck();
  }

  applyClinicFilter(): void {
    switch (this.clinicFilterType) {
      case 'open':
        this.filteredClinics = this.clinics.filter(c => c.openNow);
        break;
      case 'emergency':
        this.filteredClinics = this.clinics.filter(c => c.emergencyService);
        break;
      case 'insurance':
        this.filteredClinics = this.clinics.filter(c => c.acceptsInsurance);
        break;
      case 'nearby':
      case 'all':
      default:
        this.filteredClinics = this.clinics;
        break;
    }
    this.cdr.markForCheck();
  }

  /**
   * Handle filter change
   */
  onFilterChange(filter: 'nearby' | 'open' | 'delivery' | '24h' | 'all'): void {
    this.filterType = filter;
    this.applyFilter();
    // Update map with filtered nearest pharmacy
    setTimeout(() => this.updateDestinationMarker(), 100);
  }

  onClinicFilterChange(filter: 'nearby' | 'open' | 'emergency' | 'insurance' | 'all'): void {
    this.clinicFilterType = filter;
    this.applyClinicFilter();
    // Update map with filtered nearest clinic
    setTimeout(() => this.updateDestinationMarker(), 100);
  }

  setMode(mode: 'pharmacy' | 'clinic'): void {
    this.mode = mode;
    this.selectedPharmacy = null;
    this.selectedClinic = null;

    if (mode === 'clinic') {
      this.findNearbyClinics();
    } else {
      this.findNearbyPharmacies();
    }

    // Update map destination marker
    setTimeout(() => this.updateDestinationMarker(), 100);
  }

  /**
   * Select pharmacy to show details
   */
  selectPharmacy(pharmacy: Pharmacy): void {
    this.selectedPharmacy = pharmacy;
    this.updateMapMarker(pharmacy.latitude, pharmacy.longitude, pharmacy.name);
    this.cdr.markForCheck();
  }

  selectClinic(clinic: Clinic): void {
    this.selectedClinic = clinic;
    this.updateMapMarker(clinic.latitude, clinic.longitude, clinic.name);
    this.cdr.markForCheck();
  }

  /**
   * Close pharmacy details
   */
  closePharmacyDetail(): void {
    this.selectedPharmacy = null;
    this.cdr.markForCheck();
  }

  closeClinicDetail(): void {
    this.selectedClinic = null;
    this.cdr.markForCheck();
  }

  /**
   * Call pharmacy
   */
  callPharmacy(phoneNumber: string): void {
    window.location.href = `tel:${phoneNumber}`;
  }

  /**
   * Open pharmacy location in maps
   */
  openInMaps(pharmacy: Pharmacy): void {
    const mapsUrl = `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`;
    window.open(mapsUrl, '_blank');
  }

  openClinicInMaps(clinic: Clinic): void {
    const mapsUrl = `https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`;
    window.open(mapsUrl, '_blank');
  }

  /**
   * Send email to pharmacy
   */
  emailPharmacy(email: string | undefined): void {
    if (!email) {
      this.displayNotificationMessage('Email non disponible', 'error');
      return;
    }
    window.location.href = `mailto:${email}`;
  }

  /**
   * Get status text
   */
  getStatusText(pharmacy: Pharmacy): string {
    if (pharmacy.accepts24h) {
      return '24h/24';
    }
    return pharmacy.openNow ? 'Ouverte' : 'Fermée';
  }

  /**
   * Get status class
   */
  getStatusClass(pharmacy: Pharmacy): string {
    if (pharmacy.accepts24h) {
      return 'status-24h';
    }
    return pharmacy.openNow ? 'status-open' : 'status-closed';
  }

  /**
   * Show notification
   */
  private displayNotificationMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.displayNotification = true;
    
    setTimeout(() => {
      this.displayNotification = false;
      this.cdr.markForCheck();
    }, 4000);
  }

  /**
   * Get distance text
   */
  getDistanceText(pharmacy: Pharmacy): string {
    if (!pharmacy.distance) {
      return 'Distance non calc.';
    }
    return pharmacy.distance < 1 
      ? `${Math.round(pharmacy.distance * 1000)}m` 
      : `${pharmacy.distance} km`;
  }

  getClinicDistanceText(clinic: Clinic): string {
    if (!clinic.distance) {
      return 'Distance non calc.';
    }
    return clinic.distance < 1
      ? `${Math.round(clinic.distance * 1000)}m`
      : `${clinic.distance} km`;
  }

  getClinicStatusText(clinic: Clinic): string {
    return clinic.openNow ? 'Ouverte' : 'Fermée';
  }

  getClinicStatusClass(clinic: Clinic): string {
    return clinic.openNow ? 'status-open' : 'status-closed';
  }

  /**
   * Initialize Leaflet map
   */
  private initializeMap(): void {
    if (!this.mapDiv || !this.userLocation) {
      return;
    }

    // Destroy previous map if it exists
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }

    // Create map centered on user location
    this.leafletMap = L.map(this.mapDiv.nativeElement).setView(
      [this.userLocation.latitude, this.userLocation.longitude],
      13
    );

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.leafletMap);

    // Add user location marker (blue)
    this.userMarker = L.circleMarker(
      [this.userLocation.latitude, this.userLocation.longitude],
      {
        radius: 8,
        fillColor: '#2196F3',
        color: '#1976D2',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
      }
    )
      .bindPopup('📍 Votre position')
      .addTo(this.leafletMap);

    // Add destination marker if there's a selected item
    this.updateDestinationMarker();
  }

  /**
   * Update destination marker based on selected pharmacy/clinic
   */
  private updateDestinationMarker(): void {
    if (!this.leafletMap) {
      return;
    }

    // Remove old destination marker
    if (this.destinationMarker) {
      this.leafletMap.removeLayer(this.destinationMarker);
      this.destinationMarker = null;
    }

    let destination: { lat: number; lng: number; name: string } | null = null;

    if (this.mode === 'clinic') {
      const clinic = this.selectedClinic || this.getNearestClinic();
      if (clinic) {
        destination = {
          lat: clinic.latitude,
          lng: clinic.longitude,
          name: clinic.name
        };
      }
    } else {
      const pharmacy = this.selectedPharmacy || this.getNearestPharmacy();
      if (pharmacy) {
        destination = {
          lat: pharmacy.latitude,
          lng: pharmacy.longitude,
          name: pharmacy.name
        };
      }
    }

    if (destination && this.leafletMap && this.userLocation) {
      // Add destination marker (red)
      this.destinationMarker = L.circleMarker(
        [destination.lat, destination.lng],
        {
          radius: 10,
          fillColor: '#F44336',
          color: '#D32F2F',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.8
        }
      )
        .bindPopup(`📍 ${destination.name}`)
        .addTo(this.leafletMap);

      // Fit both markers in view
      const group = new L.FeatureGroup([
        this.userMarker!,
        this.destinationMarker
      ]);
      this.leafletMap.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Update map marker when destination is clicked
   */
  private updateMapMarker(lat: number, lng: number, name: string): void {
    if (!this.leafletMap) {
      this.initializeMap();
    }

    // Remove old destination marker
    if (this.destinationMarker) {
      this.leafletMap!.removeLayer(this.destinationMarker);
    }

    // Add new destination marker
    this.destinationMarker = L.circleMarker(
      [lat, lng],
      {
        radius: 10,
        fillColor: '#F44336',
        color: '#D32F2F',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
      }
    )
      .bindPopup(`📍 ${name}`)
      .addTo(this.leafletMap!);

    // Fit both markers in view
    if (this.userMarker) {
      const group = new L.FeatureGroup([
        this.userMarker,
        this.destinationMarker
      ]);
      this.leafletMap!.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Get map embed URL (used by template for old iframe - can be removed)
   */
  getLiveMapUrl(): SafeResourceUrl {
    if (this.mode === 'clinic') {
      if (this.selectedClinic) {
        return this.getMapEmbedUrl(this.selectedClinic.latitude, this.selectedClinic.longitude);
      }
      const nearestClinic = this.getNearestClinic();
      if (nearestClinic) {
        return this.getMapEmbedUrl(nearestClinic.latitude, nearestClinic.longitude);
      }
    } else {
      if (this.selectedPharmacy) {
        return this.getMapEmbedUrl(this.selectedPharmacy.latitude, this.selectedPharmacy.longitude);
      }
      const nearestPharmacy = this.getNearestPharmacy();
      if (nearestPharmacy) {
        return this.getMapEmbedUrl(nearestPharmacy.latitude, nearestPharmacy.longitude);
      }
    }

    if (this.userLocation) {
      return this.getMapEmbedUrl(this.userLocation.latitude, this.userLocation.longitude);
    }

    // Fallback center (Tunis)
    return this.getMapEmbedUrl(36.8065, 10.1815);
  }

  getMapEmbedUrl(lat: number, lon: number): SafeResourceUrl {
    const delta = 0.02;
    const left = lon - delta;
    const right = lon + delta;
    const top = lat + delta;
    const bottom = lat - delta;
    const rawUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  getNearestPharmacy(): Pharmacy | null {
    return this.filteredPharmacies.length > 0 ? this.filteredPharmacies[0] : null;
  }

  getNearestClinic(): Clinic | null {
    return this.filteredClinics.length > 0 ? this.filteredClinics[0] : null;
  }

  getLiveMapTitle(): string {
    if (this.mode === 'clinic') {
      if (this.selectedClinic) {
        return `Clinique sélectionnée: ${this.selectedClinic.name}`;
      }
      const nearestClinic = this.getNearestClinic();
      if (nearestClinic) {
        return `Clinique la plus proche: ${nearestClinic.name}`;
      }
      return 'Votre position actuelle';
    }

    if (this.selectedPharmacy) {
      return `Pharmacie sélectionnée: ${this.selectedPharmacy.name}`;
    }
    const nearestPharmacy = this.getNearestPharmacy();
    if (nearestPharmacy) {
      return `Pharmacie la plus proche: ${nearestPharmacy.name}`;
    }
    return 'Votre position actuelle';
  }

  openLiveMapInGoogleMaps(): void {
    if (this.mode === 'clinic') {
      const c = this.selectedClinic || this.getNearestClinic();
      if (c) {
        this.openClinicInMaps(c);
        return;
      }
    } else {
      const p = this.selectedPharmacy || this.getNearestPharmacy();
      if (p) {
        this.openInMaps(p);
        return;
      }
    }

    if (this.userLocation) {
      const mapsUrl = `https://www.google.com/maps?q=${this.userLocation.latitude},${this.userLocation.longitude}`;
      window.open(mapsUrl, '_blank');
    }
  }
}
