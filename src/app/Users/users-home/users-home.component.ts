import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, Component,OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../Shared/Api/api.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DatePipe } from '@angular/common'; 
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-users-home',
  templateUrl: './users-home.component.html',
  styleUrls: ['./users-home.component.scss'],
  providers: [DatePipe] 
})
export class UsersHomeComponent implements OnInit {
  subscriptionDataSource = new MatTableDataSource<any>();
  permissibleDataSource = new MatTableDataSource<any>();
serviceDataSource = new MatTableDataSource<any>();

  @ViewChild('subscriptionPaginator') subscriptionPaginator!: MatPaginator;
  @ViewChild('permissiblePaginator') permissiblePaginator!: MatPaginator;
  @ViewChild('servicePaginator') servicePaginator!: MatPaginator;

  subscriptiondisplayedColumns: string[] = ['subscription_id', 'subscription_status', 'subscription_type', 'expand'];
  expandedElement: any | null;
  permissibleDisplayedColumns: string[] = [ 'city', 'airport_name','download', 'expand'];

  subscriptionDetails: any[] = [];
  serviceDetails: any[] = [];
  permissibleDetails: any[] = [];
  showSubscriptionDetails: boolean = false;
  showServiceDetails: boolean = false;
  showPermissibleDetails: boolean = false;

  selectedSubscription: any;
  showReceiptDetails: boolean = false;
  permissibleRowCount: number = 0;
  serviceRowCount:number =0;
  subscriptionRowCount: number = 0;
  totalSubscriptionPrice: number = 0;
  priceCalculation: string = '';

  filtersubscriptionDetails: any[] = [];
  filterpermissibleDetails: any[] = [];
  filterserviceDetails: any[] = [];


  serviceNames: { [key: string]: string } = {
    service1: 'WGS-84 Survey',
    service2: 'NOC Application & Associated Service',
    service3: 'Pre-aeronautical Study',
    service4: 'Aeronautical Study / Shielding Benefits Study',
    service5: 'Documents & Process Management'
  };
nocas: any;
airport: any;

  constructor(private http: HttpClient, public apiservice: ApiService,private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.detailsOfPermissible();
    // Optionally, fetch subscription and service details on component initialization
    // this.detailsOfSubscription();
    // this.detailsOfServices();
  }
  bufferToBase64(buffer: any) {
    return btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  }
  detailsOfSubscription() {
    // Show only subscription details section
    this.showSubscriptionDetails = true;
    this.showServiceDetails = false;
    this.showPermissibleDetails = false;

    // Reset total subscription price and row count
    this.totalSubscriptionPrice = 0;
    this.subscriptionRowCount = 0;

    // Fetch subscription data
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    const user_id = this.apiservice.userData.id;
    this.http.get<any[]>(`http://localhost:3003/api/subscription/getAllsubscriptions?user_id=${user_id}`, { headers: headers })
        .subscribe(
            response => {
                console.log('Subscription data:', response);
                let priceCalculation = '';

                response.forEach((subscription, index) => {
                    subscription.expiry_date = this.datePipe.transform(subscription.expiry_date, 'dd/MM/yyyy');

                    const price = Number(subscription.price);
                    if (!isNaN(price)) {
                        priceCalculation += price;
                        if (index < response.length - 1) {
                            priceCalculation += ' + ';
                        }
                        this.totalSubscriptionPrice += price;
                    } else {
                        console.error('Invalid price:', subscription.price);
                    }
                });

                this.priceCalculation = priceCalculation;
                this.filtersubscriptionDetails = response;
                this.subscriptionDataSource.data = this.filtersubscriptionDetails;
                this.subscriptionDataSource.paginator = this.subscriptionPaginator;
                this.subscriptionRowCount = response.length; // Count subscription rows
            },
            error => {
                console.error('Failed to fetch subscription data:', error);
            }
        );
}

  

  detailsOfServices() {
    this.showSubscriptionDetails = false;
    this.showServiceDetails = true;
    this.showPermissibleDetails = false;

    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    const user_id = this.apiservice.userData.id;
    this.http.get<any[]>(`http://localhost:3003/api/request/getAllService?user_id=${user_id}`, { headers: headers })
      .subscribe(
        response => {
          console.log('Service data:', response);
          this.serviceDetails = response.map(service => ({
            ...service,
            services: JSON.parse(service.services)
          }));

          this.serviceRowCount = response.length;
        },
        error => {
          console.error('Failed to fetch services data:', error);
        }
      );
  }
  toggleRow(element: any) {
    this.expandedElement = this.expandedElement === element ? null : element;
  }
  detailsOfPermissible() {
    // Show only permissible details section
    this.showSubscriptionDetails = false;
    this.showServiceDetails = false;
    this.showPermissibleDetails = true;
  
    // Fetch permissible data
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    const user_id = this.apiservice.userData.id;
    this.http.get<any[]>(`http://localhost:3003/api/nocas/getAllNocasData?user_id=${user_id}`, { headers: headers })
      .subscribe(
        response => {
          console.log('Nocas data:', response);
          this.permissibleDetails = response;
          this.filterpermissibleDetails = response;
          this.permissibleDataSource.data = this.filterpermissibleDetails;
          this.permissibleDataSource.paginator = this.permissiblePaginator;
  
          this.permissibleRowCount = response.length; // Count permissible rows
        },
        error => {
          console.error('Failed to fetch Nocas data:', error);
        }
      );
  }
  

  getServiceKeys(services: any): string[] {
    return Object.keys(services).filter(key => services[key] && this.serviceNames[key]);
  }

  downloadPDF(nocas: any) {
    const doc = new jsPDF();

    const data = {
      applicant_name: this.apiservice.userData.uname,
      city: nocas.city,
      airport_name: nocas.airport_name,
      latitude: nocas.latitude,
      longitude: nocas.longitude,
      site_elevation: nocas.site_elevation,
      distance: nocas.distance,
      permissible_height: nocas.permissible_height,
      permissible_elevation: nocas.permissible_elevation,
      snapshot: nocas.snapshot
    };

    // Add "Site Details" header
    doc.text('Site Details', 10, 10);

    // Set table headers
    const headers = [['Detail', 'Value']];

    // Set table data
    const rows = [
      ['Applicant Name', data.applicant_name],
      ['City', data.city],
      ['Airport Name', data.airport_name],
      ['Site Latitude', data.latitude],
      ['Site Longitude', data.longitude],
      ['Site Elevation', data.site_elevation],
      ['Distance From ARP', data.distance],
      ['Permissible Height (AGL)', data.permissible_height],
      ['Permissible Elevation (AMSL)', data.permissible_elevation],
      ['Snapshot', data.snapshot]
    ];

    // Add table to PDF
    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: 20,
      theme: 'striped',
      styles: {
        fontSize: 12,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 'auto' }
      }
    });

    // Save PDF
    doc.save('siteDetails.pdf');
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
  applyServiceFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterserviceDetails = this.serviceDetails.filter(service =>
      Object.keys(service.services).some(key =>
        this.serviceNames[key].toLowerCase().includes(filterValue)
      )
    );
    this.serviceDataSource.data = this.filterserviceDetails;
  }
  
  
}
