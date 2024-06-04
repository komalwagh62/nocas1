import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../Shared/Api/api.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-users-home',
  templateUrl: './users-home.component.html',
  styleUrls: ['./users-home.component.scss']
})
export class UsersHomeComponent implements OnInit {
  subscriptionDetails: any[] = [];
  serviceDetails: any[] = [];
  nocasDetails: any[] = [];
  showSubscriptionDetails: boolean = false;
  showServiceDetails: boolean = false;
  showPermissibleDetails: boolean = false;
  selectedSubscription: any;
  showReceiptDetails: boolean = false;
  permissibleRowCount: number = 0;
  subscriptionRowCount: number = 0;


  serviceNames: { [key: string]: string } = {
    service1: 'WGS-84 Survey',
    service2: 'NOC Application & Associated Service',
    service3: 'Pre-aeronautical Study',
    service4: 'Aeronautical Study / Shielding Benefits Study',
    service5: 'Documents & Process Management'
  };

  constructor(private http: HttpClient, public apiservice: ApiService) { }

  ngOnInit(): void {
    this.fetchPermissibleRowCount();
    // Optionally, fetch subscription and service details on component initialization
    // this.detailsOfSubscription();
    // this.detailsOfServices();
  }
  fetchPermissibleRowCount(): void {
    // Fetch permissible row count data from API and update permissibleRowCount variable
    // Example implementation:
    // this.http.get<any>(API_ENDPOINT)
    //   .subscribe(
    //     data => {
    //       this.permissibleRowCount = data.rowCount;
    //       this.generatePermissiblePieChart();
    //     },
    //     error => {
    //       console.error('Failed to fetch permissible row count:', error);
    //     }
    //   );
    // For demonstration purpose, setting a static value
    this.permissibleRowCount = 50;
    this.generatePermissiblePieChart();
  }
  generatePermissiblePieChart(): void {
    new Chart('permissibleChart', {
      type: 'pie',
      data: {
        labels: ['Permissible', 'Other'],
        datasets: [{
          data: [this.permissibleRowCount, 100 - this.permissibleRowCount],
          backgroundColor: ['#36a2eb', '#ff6384'],
        }]
      }
    });
  }

  toggleSubscriptionDetails() {
    this.showSubscriptionDetails = !this.showSubscriptionDetails;
  }

  detailsOfSubscription() {
    this.showSubscriptionDetails = true;
    this.showServiceDetails = false;
    this.showPermissibleDetails = false;

    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    const user_id = this.apiservice.userData.id;
    this.http.get<any[]>(`http://localhost:3001/api/subscription/getAllsubscriptions?user_id=${user_id}`, { headers: headers })
      .subscribe(
        response => {
          console.log('Subscription data:', response);
          this.subscriptionDetails = response;
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
    this.http.get<any[]>(`http://localhost:3001/api/request/getAllService?user_id=${user_id}`, { headers: headers })
      .subscribe(
        response => {
          console.log('Service data:', response);
          this.serviceDetails = response.map(service => ({
            ...service,
            services: JSON.parse(service.services)
          }));
        },
        error => {
          console.error('Failed to fetch services data:', error);
        }
      );
  }

  detailsOfPermissible() {
    this.showSubscriptionDetails = false;
    this.showServiceDetails = false;
    this.showPermissibleDetails = true;

    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    const user_id = this.apiservice.userData.id;
    this.http.get<any[]>(`http://localhost:3001/api/nocas/getAllNocasData?user_id=${user_id}`, { headers: headers })
      .subscribe(
        response => {
          console.log('Nocas data:', response);
          this.nocasDetails = response;
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
}
