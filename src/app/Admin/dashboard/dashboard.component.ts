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
  userRowCount: number = 0;
  permissibleRowCount: number = 0;
  totalSubscriptionPrice: number = 0;
  priceCalculation: string = '';
  constructor(public apiService: ApiService,private datePipe: DatePipe) { }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.getAllUsers();
  }

  getAllUsers() {
    // Set flags to control visibility of different sections
    this.showSubscriptionDetails = false;
    this.showUserDetails = true;
    this.showPermissibleDetails = false;
  
    // Call API to fetch user details
    this.apiService.getAllUsers().subscribe(
      (response: any[]) => {
        console.log('User Details:', response);
        
        // Update user details arrays
        this.userDetails = response;
        this.filteredUserDetails = response;
  
        // Update dataSource with fetched data
        this.dataSource.data = response;
  
        // Assign paginator after data is set
        this.dataSource.paginator = this.paginator;
  
        // Update userRowCount with the count of rows
        this.userRowCount = this.dataSource.data.length;
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
  
    // Reset totalSubscriptionPrice before fetching new data
    this.totalSubscriptionPrice = 0;
    this.priceCalculation = '';
  
    this.apiService.getAllSubscriptions().subscribe(
      (response: any[]) => {
        console.log('Subscription Details:', response);
  
        response.forEach((subscription, index) => {
          console.log('Original expiry_date:', subscription.expiry_date);
          subscription.expiry_date = this.datePipe.transform(subscription.expiry_date, 'dd/MM/yyyy');
          console.log('Formatted expiry_date:', subscription.expiry_date);
  
          // Ensure price is treated as a number
          const price = Number(subscription.price);
          if (!isNaN(price)) {
            // Append the price to the calculation string
            this.priceCalculation += price;
            if (index < response.length - 1) {
              this.priceCalculation += ' + ';
            }
  
            // Sum up the total price
            this.totalSubscriptionPrice += price;
          } else {
            console.error('Invalid price:', subscription.price);
          }
        });
  
        // Assign response to subscription details
        this.subscriptionDetails = response;
        this.filtersubscriptionDetails = response;
        this.subscriptionDataSource.data = this.filtersubscriptionDetails;
        this.subscriptionDataSource.paginator = this.subscriptionPaginator;
  
        // Print the total subscription price
        console.log('Total Subscription Price in Rs:', this.totalSubscriptionPrice);
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

        this.permissibleRowCount = this.permissibleDataSource.data.length;
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
