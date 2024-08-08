import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from '../Shared/Api/api.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

 
@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss']
})
export class TransactionDetailsComponent implements OnInit {
  receiptDetails: any;
  subscriptionDetails: any[] = [];
  showReceiptDetails: boolean = false;
  selectedSubscription: any;
  displayedColumns: string[] = [
    'applicantName',
    'transactionID',
    'transactionDate',
    'transactionStatus',
    'expiryDate',
    'subscriptionType',
    'price',
    'action'
  ];
  dataSource!: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private router: Router,
    private http: HttpClient,
    public apiservice: ApiService
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.receiptDetails = navigation?.extras?.state?.['receiptDetails'];
  }
  ngOnInit(): void {
    this.detailsOfSubscription();
    if (!this.receiptDetails) {
      this.router.navigate(['UsersPricingPlans']);
    }
  }
  detailsOfSubscription() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.apiservice.token}`);
    const user_id = this.apiservice.userData.id;
    this.http.get<any[]>(`http://localhost:3001/api/subscription/getAllsubscriptions?user_id=${user_id}`, { headers: headers })
      .subscribe(
        response => {
          this.subscriptionDetails = response.map(subscription => ({
            ...subscription,
            razorpay_payment_id: subscription.razorpay_payment_id.trim(),
            createdAt: subscription.createdAt.trim(),
            subscription_status: subscription.subscription_status.trim(),
            expiry_date: subscription.expiry_date.trim(),
            subscription_type: subscription.subscription_type.trim(),
            price: subscription.price.trim()
          }));
          this.dataSource = new MatTableDataSource(this.subscriptionDetails);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error => {
          console.error('Failed to fetch subscription data:', error);
        }
      );
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
 
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  downloadReceipt(subscription: any) {
    this.selectedSubscription = subscription;
    this.showReceiptDetails = true;
    const doc = new jsPDF();
  
    const logo = new Image();
    logo.src = 'assets/cropped-C_Name.png';
  
    logo.onload = () => {
      // Add the logo to the PDF
      doc.addImage(logo, 'PNG', 10, 10, 50, 20); // Adjust the coordinates and size as needed
  
      // Add the invoice title and other details
      doc.setFontSize(18);
      doc.text('Tax Invoice', 75, 40);
  
      const invoiceDate = new Date().toLocaleDateString();
      const createdAt = new Date(subscription.createdAt); // Assuming subscription.createdAt is the creation date
      const invoiceNumber = `${createdAt.getFullYear()}${('0' + (createdAt.getMonth() + 1)).slice(-2)}${('0' + createdAt.getDate()).slice(-2)}${('0' + createdAt.getHours()).slice(-2)}${('0' + createdAt.getMinutes()).slice(-2)}${('0' + createdAt.getSeconds()).slice(-2)}`;
  
      doc.setFontSize(12);
      doc.text(`Invoice Date: ${invoiceDate}                                    Invoice No: ${invoiceNumber}`, 10, 60);
      
      
      doc.text(`To:`, 10, 80);
      doc.text(this.apiservice.userData.uname, 10, 90);
      doc.text(this.apiservice.userData.email, 10, 100);
  
      // Add subscription details in a formatted way
      doc.setFontSize(10);
      let yPosition = 120; // Initial y-position for the details
      const labelX = 10; // X position for labels
      const valueX = 140; // X position for values
  
      doc.text('Subscription Details', labelX, yPosition);
      yPosition += 10;
      
      doc.text('Subscription ID', labelX, yPosition);
      doc.text(subscription.subscription_id, valueX, yPosition);
      yPosition += 10;
      doc.text('Status', labelX, yPosition);
      doc.text(subscription.subscription_status, valueX, yPosition);
      yPosition += 10;
      doc.text('Expiry Date', labelX, yPosition);
      doc.text(subscription.expiry_date, valueX, yPosition);
      yPosition += 10;
      doc.text('Subscription Type', labelX, yPosition);
      doc.text(subscription.subscription_type, valueX, yPosition);
      yPosition += 10;
      doc.text('Razorpay Payment ID', labelX, yPosition);
      doc.text(subscription.razorpay_payment_id, valueX, yPosition);
  
      // Additional line before the footer section
      yPosition += 10; // Adding some space before the footer
      doc.text('----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------', 10, yPosition); // This is the added line
  
      // Add footer or any additional information
      yPosition += 7; // Adding some space before the payment details
      
      doc.text('Total', 150, yPosition);
      doc.text(subscription.price.toString(), 180, yPosition);
  
      yPosition += 10;
      doc.text('Total charged', 150, yPosition);
      doc.text(subscription.price.toString(), 180, yPosition);
      doc.text('Please retain for your records.', 10, doc.internal.pageSize.getHeight() - 60);
      doc.text('Company Name: Cognitive Navigation Pvt Ltd.', 10, doc.internal.pageSize.getHeight() - 50);
      doc.text('Company Address', 10, doc.internal.pageSize.getHeight() - 40);
  
      // Save the PDF
      doc.save('receipt.pdf');
    };
  }
  
  
  
  
  
}  