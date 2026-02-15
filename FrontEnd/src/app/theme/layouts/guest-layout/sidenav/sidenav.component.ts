import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidenav',
  imports: [CommonModule, RouterModule, MatSidenavModule, MatListModule, MatIconModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
    @ViewChild('sidenav') sidenav!: MatSidenav;
    isMobile = false;

    constructor(
        public auth: AuthService,
        private breakpointObserver: BreakpointObserver
    ) {
        this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
            this.isMobile = result.matches;
        });
    }

    toggle(): void {
        this.sidenav?.toggle();
    }

    closeMobile(): void {
        if (this.isMobile) {
            this.sidenav?.close();
        }
    }
}
