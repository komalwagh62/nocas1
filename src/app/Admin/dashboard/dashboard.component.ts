import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DatePipe } from '@angular/common'; 
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [DatePipe] 
})
export class DashboardComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'uname', 'phone_number', 'address', 'email'];
  subscriptiondisplayedColumns: string[] = ['subscription_id', 'subscription_status', 'subscription_type', 'expand'];
  expandedElement: any | null;
  permissibleDisplayedColumns: string[] = ['request_id', 'city', 'airport_name', 'expand'];
  
  dataSource = new MatTableDataSource<any>();
  subscriptionDataSource = new MatTableDataSource<any>();
  permissibleDataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('subscriptionPaginator') subscriptionPaginator!: MatPaginator;
  @ViewChild('permissiblePaginator') permissiblePaginator!: MatPaginator;

  userDetails: any[] = [];
  subscriptionDetails: any[] = [];
  permissibleDetails: any[] = [];

  filteredUserDetails: any[] = [];
  filtersubscriptionDetails: any[] = [];
  filterpermissibleDetails: any[] = [];

  showSubscriptionDetails: boolean = false;
  showUserDetails: boolean = false;
  showPermissibleDetails: boolean = false;

  constructor(public apiService: ApiService,private datePipe: DatePipe) { }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.getAllUsers();
  }

  getAllUsers() {
    this.showSubscriptionDetails = false;
    this.showUserDetails = true;
    this.showPermissibleDetails = false;
    this.apiService.getAllUsers().subscribe(
      (response: any[]) => {
        console.log('User Details:', response);
        this.userDetails = response;
        this.filteredUserDetails = response; // Check if data is fetched
        this.dataSource.data = response;
        // Assign paginator after data is set
        this.dataSource.paginator = this.paginator;
      },
      (error: any) => {
        console.error('Failed to fetch user details:', error);
      }
    );
  }

  getAllSubscriptions() {
    this.showSubscriptionDetails = true;
    this.showUserDetails = false;
    this.showPermissibleDetails = false;
    this.apiService.getAllSubscriptions().subscribe(
      (response: any[]) => {
        console.log('Subscription Details:', response);
  
        // Format the expiry_date
        response.forEach(subscription => {
          console.log('Original expiry_date:', subscription.expiry_date);
          subscription.expiry_date = this.datePipe.transform(subscription.expiry_date, 'dd/MM/yyyy');
          console.log('Formatted expiry_date:', subscription.expiry_date);
        });
  
        this.subscriptionDetails = response;
        this.filtersubscriptionDetails = response;
        this.subscriptionDataSource.data = this.filtersubscriptionDetails;
        this.subscriptionDataSource.paginator = this.subscriptionPaginator;
      },
      (error: any) => {
        console.error('Failed to fetch subscription details:', error);
      }
    );
  }
  
  toggleRow(element: any) {
    this.expandedElement = this.expandedElement === element ? null : element;
  }
  
  getAllPermissible() {
    this.showSubscriptionDetails = false;
    this.showUserDetails = false;
    this.showPermissibleDetails = true;
    this.apiService.getAllPermissible().subscribe(
      (response: any[]) => {
        console.log('Permissible Details:', response);
        this.permissibleDetails = response;
        this.filterpermissibleDetails = response;
        this.permissibleDataSource.data = this.filterpermissibleDetails;
        this.permissibleDataSource.paginator = this.permissiblePaginator;
      },
      (error: any) => {
        console.error('Failed to fetch permissible details:', error);
      }
    );
  }

  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredUserDetails = this.userDetails.filter(user =>
      Object.values(user).some(val =>
        String(val).toLowerCase().includes(filterValue)
      )
    );
    this.dataSource.data = this.filteredUserDetails;
  }

  applySubscriptionFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filtersubscriptionDetails = this.subscriptionDetails.filter(subscription =>
      Object.values(subscription).some(val =>
        String(val).toLowerCase().includes(filterValue)
      )
    );
    this.subscriptionDataSource.data = this.filtersubscriptionDetails;
  }

  applyPermissibleFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterpermissibleDetails = this.permissibleDetails.filter(permissible =>
      Object.values(permissible).some(val =>
        String(val).toLowerCase().includes(filterValue)
      )
    );
    this.permissibleDataSource.data = this.filterpermissibleDetails;
  }
}
