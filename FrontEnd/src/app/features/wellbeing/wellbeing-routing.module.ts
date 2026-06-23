import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WellbeingDashboardComponent } from './components/wellbeing-dashboard/wellbeing-dashboard.component';

const routes: Routes = [
    {
        path: '',
        component: WellbeingDashboardComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WellbeingRoutingModule { }
