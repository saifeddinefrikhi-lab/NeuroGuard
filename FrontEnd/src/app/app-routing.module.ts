import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { PatientLayout } from './theme/layouts/patient-layout/patient-layout.component';
import { CaregiverLayout } from './theme/layouts/caregiver-layout/caregiver-layout.component';
import { ProviderLayout } from './theme/layouts/provider-layout/provider-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'homePage',
    pathMatch: 'full'
  },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./Back-office/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'admin/providers',
        loadComponent: () => import('./Back-office/pages/healthcare-privider-management/healthcare-privider-management').then((c) => c.HealthcarePrividerManagement)
      },
      {
        path: 'admin/caregivers',
        loadComponent: () => import('./Back-office/pages/caregiver-management/caregiver-management').then((c) => c.CaregiverManagement)
      },
      {
        path: 'admin/patients',
        loadComponent: () => import('./Back-office/pages/patient-management/patient-management').then((c) => c.PatientManagement)
      },
    ]
  },

  { 
    path: '',
    component: PatientLayout,
    canActivate: [authGuard],
    data: { roles: ['PATIENT'] },
    children: [
      {
        path: 'patient/home',
        loadComponent: () => import('./Front-office/patient/home/home.component').then((c) => c.HomeComponent)
      },
      {
        path: 'patient/medical-history',
        loadComponent: () => import('./Front-office/patient/patient-medical-history/patient-medical-history').then((c) => c.PatientMedicalHistoryComponent)
      },
       
      
    ]
  },

  {
    path: '',
    component: CaregiverLayout,
    canActivate: [authGuard],
    data: { roles: ['CAREGIVER'] },
    children: [
      {
        path: 'caregiver/home',
        loadComponent: () => import('./Front-office/caregiver/home/home.component').then((c) => c.HomeComponent)
      },
      {
        path: 'caregiver/medical-history/patients',
        loadComponent: () => import('./Front-office/caregiver/caregiver-patient-list/caregiver-patient-list').then((c) => c.CaregiverPatientListComponent)
      },
      {
        path: 'caregiver/medical-history/view/:patientId',
        loadComponent: () => import('./Front-office/caregiver/caregiver-patient-detail/caregiver-patient-detail').then((c) => c.CaregiverPatientDetailComponent)
      }
      
    ]
  },

  {
    path: '',
    component: ProviderLayout,
    canActivate: [authGuard],
    data: { roles: ['PROVIDER'] },
    children: [
      {
        path: 'provider/home',
        loadComponent: () => import('./Front-office/healthcare-provider/home/home.component').then((c) => c.HomeComponent)
      },
      {
        path: 'provider/medical-history',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-medical-history-list/provider-medical-history-list').then((c) => c.ProviderMedicalHistoryListComponent)
      },
     
      {
        path: 'provider/medical-history/new',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-medical-history-form/provider-medical-history-form').then((c) => c.ProviderMedicalHistoryFormComponent)
      },
      {
        path: 'provider/medical-history/edit/:patientId',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-medical-history-form/provider-medical-history-form').then((c) => c.ProviderMedicalHistoryFormComponent)
      },
      {
        path: 'provider/medical-history/view/:patientId',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-medical-history-detail/provider-medical-history-detail').then((c) => c.ProviderMedicalHistoryDetailComponent)
      }
      
     
    ]
  },

  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/authentication/auth-register/auth-register.component').then((c) => c.AuthRegisterComponent)
      },
      {
        path: 'homePage',
        loadComponent: () => import('./Front-office/home-page/home-page.component').then((c) => c.HomePageComponent)
      },
      {
        path: 'restricted',
        loadComponent: () => import('./pages/restriction/restricted.component').then((c) => c.RestrictedComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'homePage'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}