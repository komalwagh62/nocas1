import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userDetails: any[] = [];
  subscriptionDetails:any[] = [];
  permissibleDetails:any[] = [];
  showSubscriptionDetails: boolean = false;
  showUserDetails: boolean = false;
  showPermissibleDetails: boolean = false;
  
  constructor(public apiService: ApiService) { }

  ngOnInit(): void {
    this.getAllUsers();
  }
  
  getAllUsers() {
    this.showSubscriptionDetails = false;
    this.showUserDetails = true;
    this.showPermissibleDetails = false;
    (this.apiService as ApiService).getAllUsers().subscribe(
      (response: any[]) => {
        this.userDetails = response;
      },
      (error: any) => {
        console.error('Failed to fetch user details:', error);
      }
    );
  }

  getAllSubscriptions(){
    this.showSubscriptionDetails = true;
    this.showUserDetails = false;
    this.showPermissibleDetails = false;
    (this.apiService as ApiService).getAllSubscriptions().subscribe(
      (response: any[]) => {
        this.subscriptionDetails = response;
      },
      (error: any) => {
        console.error('Failed to fetch user details:', error);
      }
    );
  }

  getAllPermissible(){
    this.showSubscriptionDetails = false;
    this.showUserDetails = false;
    this.showPermissibleDetails = true;
    (this.apiService as ApiService).getAllPermissible().subscribe(
      (response: any[]) => {
        this.permissibleDetails = response;
      },
      (error: any) => {
        console.error('Failed to fetch user details:', error);
      }
    );
  }
}
