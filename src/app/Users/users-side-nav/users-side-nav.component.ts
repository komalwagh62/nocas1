import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../Shared/Api/api.service';

@Component({
  selector: 'app-users-side-nav',
  templateUrl: './users-side-nav.component.html',
  styleUrl: './users-side-nav.component.scss'
})
export class UsersSideNavComponent {
  constructor(private router: Router, public apiService: ApiService) { }
 
  logout() {
    // Clear user data and authentication token
    this.apiService.userData.uname = "";
    this.apiService.token = "";
    this.apiService.isAuthenticated = false;
 
    // Navigate to the login page
    this.router.navigate(['UsersLogin']);
  }
 
  navigateToProfile() {
    this.router.navigate(['UsersProfile']);
  }
}

