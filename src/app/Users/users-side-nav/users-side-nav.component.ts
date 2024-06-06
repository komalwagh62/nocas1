import { Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ApiService } from '../Shared/Api/api.service';

@Component({
  selector: 'app-users-side-nav',
  templateUrl: './users-side-nav.component.html',
  styleUrl: './users-side-nav.component.scss'
})



export class UsersSideNavComponent {
  isAdminDashboardActive: boolean = false;

  
  // Method to determine if the admin dashboard is active
  isDashboardActive(url: string): boolean {
    return url.includes('/AdminDashboard');
  }

  isloggedIn : boolean = false
  constructor(private router: Router, public apiService: ApiService) { 
    this.isloggedIn = !!this.apiService.token
  }
  
  
  logout() {
    // Clear user data and authentication token
    this.apiService.userData.uname = "";
    this.apiService.token = "";
    this.apiService.isAuthenticated = false;
    this.apiService.userData.id = ""; // Set userData to null

    
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Navigate to the login page
    this.router.navigate(['UsersLogin']);
  }
  
 
  navigateToProfile() {
    this.router.navigate(['UsersProfile']);
  }
}

