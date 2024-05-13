import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  
  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    public apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    
  }

  handlePayment(planName: string, planAmount: number) {
    if (!this.apiService.token) {
      // User not logged in, redirect to login page
      this.router.navigate(['UsersLogin']);
      return;
    }
  
    const RozarpayOptions = {
        key: 'rzp_test_IScA4BP8ntHVNp',
        amount: planAmount * 100,
        currency: 'INR',
        name: 'Cognitive Navigation Pvt. Ltd',
        description: `${planName} Plan Subscription`,
        image: 'https://imgur.com/a/J4UAMhv',
        handler: (response: any) => {
          console.log('Payment successful:', response);
          alert("Payment Succesfully Done")
          this.router.navigate(['C_NOCAS-MAP']);
          
          
          this.makeHttpRequest(planName, planAmount,response);
        },
  
        prefill: {
          name: 'Vikas',
          email: 'user@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#528FF0'
        },
        payment_method: {
          external: ['upi']
        }
      };
    const rzp = new Razorpay(RozarpayOptions);
    // Open Razorpay payment modal
    rzp.open();
    
    rzp.on('payment.success', (response: any) => {
      console.log('Payment success:', response);
      
    });
    rzp.on('payment.error', (error: any) => {
      console.error('Payment error:', error);
    });
  } 

  makeHttpRequest(planName: string, planAmount: number, paymentResponse: any) {
    // Set headers if needed (e.g., authorization token)
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiService.token}`);
  
    const apiUrl = 'http://localhost:3001/api/subscription/addSubscription';
    const requestData = {
      user_id: this.apiService.userData.id,
      subscription_type: planName,
      price: planAmount,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      subscribeAgain: true
    };
  
    this.http.post<any>(apiUrl, requestData, { headers: headers })
      .subscribe(response => {
        this.responseData = response;
        console.log('API response:', this.responseData);
        
        if (response.isSubscribed) {
          console.log('User is already subscribed.');
  
          // You can add additional logic here to forcefully subscribe the user
  
          console.log('Forcefully subscribing the user and storing subscription details...');
        } else {
          console.log('User subscription stored successfully.');
        }
      }, error => {
        console.error('Error:', error);
      });
  }
  
}
