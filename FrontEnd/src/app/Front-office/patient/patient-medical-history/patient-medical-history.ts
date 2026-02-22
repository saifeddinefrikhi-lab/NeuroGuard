import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { MedicalHistoryResponse, FileDto } from '../../../core/models/medical-history.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-patient-medical-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-medical-history.html',
  styleUrls: ['./patient-medical-history.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientMedicalHistoryComponent implements OnInit {
  history: MedicalHistoryResponse | null = null;
  files: FileDto[] = [];
  loading = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private medicalHistoryService: MedicalHistoryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Debug: Check current user info
    console.log('=== Patient Medical History Debug ===');
    console.log('Current User:', this.authService.currentUser);
    console.log('User Role:', this.authService.currentUser?.role);
    console.log('User ID:', this.authService.currentUser?.userId);
    console.log('Token exists:', !!this.authService.getToken());
    
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
    console.log('====================================');
    
    this.loadMedicalHistory();
    this.loadFiles();
  }

  loadMedicalHistory(): void {
  this.loading = true;
  this.errorMessage = '';
  this.cdr.markForCheck();
  
  this.medicalHistoryService.getMyMedicalHistory().subscribe({
    next: (data) => {
      this.history = data;
      this.loading = false;
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Error loading medical history:', err);
      
      const currentRole = this.authService.currentUser?.role;
      
      if (err.message.includes('not found') || err.message.includes('404')) {
        this.errorMessage = 'You do not have a medical history yet. Please contact a healthcare provider to create one.';
      } else if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        this.errorMessage = 'Session expired. Please log in again.';
      } else if (err.message.includes('Forbidden') || err.message.includes('403')) {
        this.errorMessage = `Access Denied (403). Backend security is blocking this request. Check your SecurityConfig to allow PATIENT role for /api/patient/** endpoints.`;
      } else if (err.message.includes('Service Unavailable') || err.message.includes('503')) {
        this.errorMessage = `Service Unavailable (503). The Medical History Service microservice is not running or not reachable by the gateway. Please start the medical-history-service backend.`;
      } else if (err.message.includes('CORS') || err.message.includes('status 0') || err.message.includes('Network')) {
        this.errorMessage = `CORS Error: Your backend Gateway (port 8083) needs CORS configuration to allow requests from http://localhost:4200. Add @CrossOrigin or configure CorsConfiguration in your Gateway application.`;
      } else {
        this.errorMessage = `Failed to load medical history: ${err.message}`;
      }
      
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}

  loadFiles(): void {
    this.medicalHistoryService.getMyFiles().subscribe({
      next: (data) => {
        this.files = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load files:', err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file);
    }
  }

  uploadFile(file: File): void {
    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.medicalHistoryService.uploadFile(file).subscribe({
      next: (uploadedFile) => {
        this.successMessage = 'File uploaded successfully.';
        this.files = [...this.files, uploadedFile]; // add to list
        this.uploading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Upload failed.';
        console.error(err);
        this.uploading = false;
        this.cdr.markForCheck();
      }
    });
  }

  downloadFile(fileId: number, fileName: string): void {
    this.medicalHistoryService.downloadFile(fileId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Download failed.');
        console.error(err);
      }
    });
  }

  deleteFile(fileId: number): void {
    if (confirm('Are you sure you want to delete this file?')) {
      this.medicalHistoryService.deleteMyFile(fileId).subscribe({
        next: () => {
          this.successMessage = 'File deleted successfully.';
          this.files = this.files.filter(f => f.id !== fileId);
          this.cdr.markForCheck();
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          this.errorMessage = 'Failed to delete file.';
          console.error('Error deleting file:', err);
          this.cdr.markForCheck();
        }
      });
    }
  }
}