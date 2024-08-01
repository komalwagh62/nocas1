import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../Shared/Api/api.service';
declare var Razorpay: any;
@Component({
  selector: 'app-users-pricing-plans',
  templateUrl: './users-pricing-plans.component.html',
  styleUrls: ['./users-pricing-plans.component.scss']
})
export class UsersPricingPlansComponent implements OnInit {
  responseData: any;
  user: any = {};
  freeTrialCount!: number;
  transactionId: string | null = null;  
  receiptDetails: any = null;
  constructor(
    private http: HttpClient,
    public apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }
  ngOnInit(): void {
  }
  handlePayment(planName: string, planAmount: number) {
    if (!this.apiService.token) {
      alert("Please Login First");
      this.router.navigate(['UsersLogin']);
      return;
    }
    const RazorpayOptions = {
      key: 'rzp_test_IScA4BP8ntHVNp',
      amount: planAmount * 100,
      currency: 'INR',
      name: 'Cognitive Navigation Pvt. Ltd',
      description: `${planName} Plan Subscription`,
      image: 'https://imgur.com/a/J4UAMhv',
      handler: (response: any) => {
        const confirmation = confirm("Payment Successfully Done. If you want to see payment details, please click Ok");
    if (!confirmation) {
      return;
    }
        this.makeHttpRequest(planName, planAmount, response);
        this.setReceiptDetails({
          status: 'success',
          razorpay_payment_id: response.razorpay_payment_id,
          amount: planAmount * 100,
          description: `${planName} Plan Subscription`,
          name: this.apiService.userData.uname,
          email: this.apiService.userData.email,
          contact: this.apiService.userData.phone_number
        });
        this.router.navigate(['TransactionDetails'], { state: { receiptDetails: this.receiptDetails } });
      },
      prefill: {
        name: this.apiService.userData.uname,
        email: this.apiService.userData.email,
        contact: this.apiService.userData.phone_number
      },
      theme: {
        color: '#528FF0'
      },
      payment_method: {
        external: ['upi']
      }
    };
    const rzp = new Razorpay(RazorpayOptions);
    rzp.open();
    rzp.on('payment.success', (response: any) => {
    });

    rzp.on('payment.error', (error: any) => {
      console.error('Payment error:', error);
      alert("Payment Failed");
    });
  }
  setReceiptDetails(details: any) {
    this.receiptDetails = details;
    this.cdr.detectChanges();
  }
  async makeHttpRequest(planName: string, planAmount: number, paymentResponse: any): Promise<void> {
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiService.token}`);
    const apiUrl = 'http://localhost:3001/api/subscription/addSubscription';
    const requestData = {
      user_id: this.apiService.userData.id,
      subscription_type: planName,
      price: planAmount,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      subscribeAgain: true
    };
    try {
      const response = await this.http.post<any>(apiUrl, requestData, { headers }).toPromise();
      this.responseData = response;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  freetrial() {
    if (!this.apiService.token) {
      alert("Please login first to access the free trial.");
      this.router.navigate(['UsersLogin']);
      return;
    }
    if (!this.freeTrialCount) {
      alert("Sorry, the free trial is not available anymore. Please Subscribe Other packages to check the permissible height.");
      return;
    }
    alert("Your free trial has been successfully activated. Please proceed to check the permissible height.");
    this.router.navigate(['C_NOCAS-MAP']);
  }
}
