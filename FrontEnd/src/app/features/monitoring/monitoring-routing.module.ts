import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MonitoringDashboardComponent } from './components/monitoring-dashboard/monitoring-dashboard.component';
import { PatientListComponent } from './components/patient-list/patient-list.component';

const routes: Routes = [
    {
        path: '',
        component: PatientListComponent
    },
    {
        path: ':id',
        component: MonitoringDashboardComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MonitoringRoutingModule { }
