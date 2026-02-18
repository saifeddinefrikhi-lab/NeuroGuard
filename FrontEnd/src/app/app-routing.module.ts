// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { PatientLayout } from './theme/layouts/patient-layout/patient-layout.component';
import { CaregiverLayout } from './theme/layouts/caregiver-layout/caregiver-layout.component';
import { ProviderLayout } from './theme/layouts/provider-layout/provider-layout.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'homePage',  // Redirect root to homePage
    pathMatch: 'full'
  },
  {
    path: '',
    component: AdminLayout,
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
    children: [
      {
        path: 'patient/home',
        loadComponent: () => import('./Front-office/patient/home/home.component').then((c) => c.HomeComponent)
      },
    ]
  },

  {
    path: '',
    component: CaregiverLayout,
    children: [
      {
        path: 'caregiver/home',
        loadComponent: () => import('./Front-office/caregiver/home/home.component').then((c) => c.HomeComponent)
      },
    ]
  },

  {
    path: '',
    component: ProviderLayout,
    children: [
      {
        path: 'provider/home',
        loadComponent: () => import('./Front-office/healthcare-provider/home/home.component').then((c) => c.HomeComponent)
      },
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
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}