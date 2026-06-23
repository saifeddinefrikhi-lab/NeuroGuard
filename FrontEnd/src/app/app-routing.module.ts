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
        path: 'admin/users',
        loadComponent: () => import('./Back-office/pages/user-list.component/user-list.component').then((c) => c.UserListComponent)
      },
      {
        path: 'admin/products',
        loadComponent: () => import('./Back-office/pages/product-list.component/product-list.component').then((c) => c.ProductListComponent)
      },
      {
        path: 'admin/orders',
        loadComponent: () => import('./Back-office/pages/order-list.component/order-list.component').then((c) => c.OrderListComponent)
      },
      
      {
        path: 'admin/forum',
        loadComponent: () => import('./pages/post-list.component/post-list.component').then((c) => c.PostListComponent)
      },
      {
        path: 'admin/forum/new',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'admin/forum/edit/:id',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'admin/forum/:id',
        loadComponent: () => import('./pages/post-detail.component/post-detail.component').then((c) => c.PostDetailComponent)
      },
      {
        path: 'admin/care-plans',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-list/care-plan-list.component').then((c) => c.CarePlanListComponent)
      },
      {
        path: 'admin/care-plans/stats',
        loadComponent: () => import('./Back-office/pages/care-plan-stats/care-plan-stats.component').then((c) => c.CarePlanStatsComponent)
      },
      {
        path: 'admin/care-plans/new',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-form/care-plan-form.component').then((c) => c.CarePlanFormComponent)
      },
      {
        path: 'admin/care-plans/edit/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-form/care-plan-form.component').then((c) => c.CarePlanFormComponent)
      },
      {
        path: 'admin/care-plans/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-detail/care-plan-detail.component').then((c) => c.CarePlanDetailComponent)
      },
      {
        path: 'admin/prescriptions',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-list/prescription-list.component').then((c) => c.PrescriptionListComponent)
      },
      {
        path: 'admin/prescriptions/new',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-form/prescription-form.component').then((c) => c.PrescriptionFormComponent)
      },
      {
        path: 'admin/prescriptions/edit/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-form/prescription-form.component').then((c) => c.PrescriptionFormComponent)
      },
      {
        path: 'admin/prescriptions/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-detail/prescription-detail.component').then((c) => c.PrescriptionDetailComponent)
      },
      {
        path: 'admin/prescription-analytics',
        loadComponent: () => import('./Back-office/pages/prescription-analytics/prescription-analytics.component').then((c) => c.PrescriptionAnalyticsComponent)
      },
      {
        path: 'admin/medications',
        loadComponent: () => import('./Back-office/pages/pharmacy-clinic-management/pharmacy-clinic-management.component').then((c) => c.PharmacyClinicManagementComponent)
      },
      {
        path: 'admin/risk-analysis',
        loadComponent: () => import('./Back-office/dashboard/risk-analysis/risk-analysis.component').then((c) => c.RiskAnalysisComponent)
        },
        {
          path: 'admin/pharmacies-clinics',
          loadComponent: () => import('./Back-office/pages/pharmacy-clinic-management/pharmacy-clinic-management.component').then((c) => c.PharmacyClinicManagementComponent)
        },
        {
        path: 'admin/consultations',
        loadComponent: () => import('./Back-office/pages/admin-consultations/admin-consultations.component').then((c) => c.AdminConsultationsComponent)
      },
      {
        path: 'admin/assurance',
        loadComponent: () => import('./Back-office/pages/assurance-admin/assurance-admin.component').then((c) => c.AssuranceAdminComponent)
      },
      {
        path: 'admin/monitoring',
        loadChildren: () => import('./features/monitoring/monitoring.module').then(m => m.MonitoringModule)
      },
      {
        path: 'admin/wellbeing',
        loadChildren: () => import('./features/wellbeing/wellbeing.module').then(m => m.WellbeingModule)
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
      {
        path: 'patient/alerts',
        loadComponent: () => import('./Front-office/patient/patient-alerts.component/patient-alerts.component').then((c) => c.PatientAlertsComponent)
      },
      {
        path: 'patient/forum',
        loadComponent: () => import('./pages/post-list.component/post-list.component').then((c) => c.PostListComponent)
      },
      {
        path: 'patient/forum/new',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'patient/forum/edit/:id',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'patient/forum/:id',
        loadComponent: () => import('./pages/post-detail.component/post-detail.component').then((c) => c.PostDetailComponent)
      },
      {
        path: 'patient/care-plans',
        loadComponent: () => import('./Front-office/patient/care-plan-kanban/care-plan-kanban.component').then((c) => c.CarePlanKanbanComponent)
      },
      {
        path: 'patient/care-plans/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-detail/care-plan-detail.component').then((c) => c.CarePlanDetailComponent)
      },
      {
        path: 'patient/prescriptions',
        loadComponent: () => import('./Front-office/patient/prescription/patient-prescription-list/patient-prescription-list.component').then((c) => c.PatientPrescriptionListComponent)
      },
      {
        path: 'patient/prescriptions/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-detail/prescription-detail.component').then((c) => c.PrescriptionDetailComponent)
      },
      {
        path: 'patient/pharmacy',
        loadComponent: () => import('./Front-office/patient/pharmacy/pharmacy-locator/pharmacy-locator.component').then((c) => c.PharmacyLocatorComponent)
      },
      {
        path: 'patient/consultation',
        loadComponent: () => import('./Front-office/patient/patient-consultations/patient-consultations.component').then((c) => c.PatientConsultationsComponent)
      },
      {
        path: 'patient/assurance',
        loadComponent: () => import('./Front-office/patient/assurance-management/assurance-management.component').then((c) => c.AssuranceManagementComponent)
      },
      {
        path: 'patient/find-nearby-doctors',
        loadComponent: () => import('./pages/consultation/find-nearby-doctors/find-nearby-doctors.component').then((c) => c.FindNearbyDoctorsComponent)
      },
      {
        path: 'patient/reservations',
        loadComponent: () => import('./Front-office/patient/patient-reservations/patient-reservations.component').then((c) => c.PatientReservationsComponent)
      },
      {
        path: 'patient/medication',
        redirectTo: 'patient/prescriptions',
        pathMatch: 'full'
      },
      {
        path: 'patient/monitoring',
        loadChildren: () => import('./features/monitoring/monitoring.module').then(m => m.MonitoringModule)
      },
      {
        path: 'patient/wellbeing',
        loadChildren: () => import('./features/wellbeing/wellbeing.module').then(m => m.WellbeingModule)
      }
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
      },
      {
        path: 'caregiver/alerts',
        loadComponent: () => import('./Front-office/caregiver/caregiver-alerts.component/caregiver-alerts.component').then((c) => c.CaregiverAlertsComponent)
      },
      {
        path: 'caregiver/forum',
        loadComponent: () => import('./pages/post-list.component/post-list.component').then((c) => c.PostListComponent)
      },
      {
        path: 'caregiver/forum/new',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'caregiver/forum/edit/:id',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'caregiver/forum/:id',
        loadComponent: () => import('./pages/post-detail.component/post-detail.component').then((c) => c.PostDetailComponent)
      },
       {
        path: 'caregiver/care-plans',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-list/care-plan-list.component').then((c) => c.CarePlanListComponent)
      },
      {
        path: 'caregiver/care-plans/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-detail/care-plan-detail.component').then((c) => c.CarePlanDetailComponent)
      },
      {
        path: 'caregiver/prescriptions',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-list/prescription-list.component').then((c) => c.PrescriptionListComponent)
      },
      {
        path: 'caregiver/prescriptions/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-detail/prescription-detail.component').then((c) => c.PrescriptionDetailComponent)
      },
      {
        path: 'caregiver/consultations',
        loadComponent: () => import('./Front-office/caregiver/caregiver-consultations/caregiver-consultations.component').then((c) => c.CaregiverConsultationsComponent)
      },
      {
        path: 'caregiver/monitoring',
        loadChildren: () => import('./features/monitoring/monitoring.module').then(m => m.MonitoringModule)
      },
      {
        path: 'caregiver/wellbeing',
        loadChildren: () => import('./features/wellbeing/wellbeing.module').then(m => m.WellbeingModule)
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
      },
      {
        path: 'provider/alerts',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-alerts.component/provider-alerts.component').then((c) => c.ProviderAlertsComponent)
      },
      {
        path: 'provider/forum',
        loadComponent: () => import('./pages/post-list.component/post-list.component').then((c) => c.PostListComponent)
      },
      {
        path: 'provider/forum/new',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'provider/forum/edit/:id',
        loadComponent: () => import('./pages/post-form.component/post-form.component').then((c) => c.PostFormComponent)
      },
      {
        path: 'provider/forum/:id',
        loadComponent: () => import('./pages/post-detail.component/post-detail.component').then((c) => c.PostDetailComponent)
      },
      {
        path: 'provider/care-plans',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-list/care-plan-list.component').then((c) => c.CarePlanListComponent)
      },
      {
        path: 'provider/care-plans/ml-recommendation',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-ml-recommendation/care-plan-ml-recommendation.component').then((c) => c.CarePlanMlRecommendationComponent)
      },
      {
        path: 'provider/care-plans/new',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-form/care-plan-form.component').then((c) => c.CarePlanFormComponent)
      },
      {
        path: 'provider/care-plans/edit/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-form/care-plan-form.component').then((c) => c.CarePlanFormComponent)
      },
      {
        path: 'provider/care-plans/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/care-plan/care-plan-detail/care-plan-detail.component').then((c) => c.CarePlanDetailComponent)
      },
      {
        path: 'provider/prescriptions',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-list/prescription-list.component').then((c) => c.PrescriptionListComponent)
      },
      {
        path: 'provider/prescriptions/new',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-form/prescription-form.component').then((c) => c.PrescriptionFormComponent)
      },
      {
        path: 'provider/prescriptions/edit/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-form/prescription-form.component').then((c) => c.PrescriptionFormComponent)
      },
      {
        path: 'provider/prescriptions/view/:id',
        loadComponent: () => import('./Front-office/healthcare-provider/prescription/prescription-detail/prescription-detail.component').then((c) => c.PrescriptionDetailComponent)
      },
      {
        path: 'provider/consultations',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-consultations.component/provider-consultations.component').then((c) => c.ProviderConsultationsComponent)
      },
      {
        path: 'provider/consultations/history',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-consultation-history/provider-consultation-history.component').then((c) => c.ProviderConsultationHistoryComponent)
      },
      {
        path: 'provider/availability',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-availability/provider-availability.component').then((c) => c.ProviderAvailabilityComponent)
      },
      {
        path: 'provider/find-nearby-doctors',
        loadComponent: () => import('./pages/consultation/find-nearby-doctors/find-nearby-doctors.component').then((c) => c.FindNearbyDoctorsComponent)
      },
      {
        path: 'provider/reservations',
        loadComponent: () => import('./Front-office/healthcare-provider/provider-reservations/provider-reservations.component').then((c) => c.ProviderReservationsComponent)
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
        path: 'forgot-password',
        loadComponent: () => import('./pages/authentication/auth-forgot-password/auth-forgot-password.component').then((c) => c.AuthForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/authentication/auth-reset-password/auth-reset-password.component').then((c) => c.AuthResetPasswordComponent)
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

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }