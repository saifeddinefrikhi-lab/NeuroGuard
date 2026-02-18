// Angular import
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { SidenavComponent } from './sidenav/sidenav.component';



@Component({
  selector: 'app-guest',
  imports: [CommonModule, RouterModule, NavbarComponent, SidenavComponent, FooterComponent],
  templateUrl: './guest-layout.component.html',
  styleUrls: ['./guest-layout.component.scss']
})
export class GuestLayoutComponent {
 
}
