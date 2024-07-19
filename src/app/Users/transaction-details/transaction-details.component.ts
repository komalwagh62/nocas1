import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../Shared/Api/api.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { User } from '../Shared/Model/users/users';

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
  subscription: any;

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
    this.http.get<any[]>(`http://localhost:3003/api/subscription/getAllsubscriptions?user_id=${user_id}`, { headers: headers })
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

  downloadReceipt(subscription: any) {
    this.selectedSubscription = subscription;
    this.showReceiptDetails = true;

    // Create PDF
    const doc = new jsPDF();
    const data = {
      applicant_name:this.apiservice.userData.uname,
      subscriptionId: subscription.subscription_id,
      status: subscription.subscription_status,
      expiryDate: subscription.expiry_date,
      subscriptionType: subscription.subscription_type,
      price: subscription.price,
      razorpayPaymentId: subscription.razorpay_payment_id
    };

    // Add "Transaction Details" and "Permissible Height" headers
    
    doc.text('Transaction Details', 10, 10);
    // Set table headers
    const headers = [['Detail', 'Value']];

    // Set table data
    const rows = [
      
      ['Subscription Price', data.price.toString()],
      ['Subscription ID', data.subscriptionId.toString()],
      ['Status', data.status.toString()],
      ['Expiry Date', data.expiryDate.toString()],
      ['Subscription Type', data.subscriptionType.toString()],
      ['Razorpay Payment ID', data.razorpayPaymentId.toString()]
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
    doc.save('receipt.pdf');
  }
}
