import { HttpClient } from '@angular/common/http';
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
  
    const razorpayOptions = {
      key: 'rzp_test_IScA4BP8ntHVNp',
      amount: planAmount * 100,
      currency: 'INR',
      name: 'Cognitive Navigation Pvt. Ltd',
      description: `${planName} Plan Subscription`,
      image: 'https://imgur.com/a/J4UAMhv',
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
    const rzp = new Razorpay(razorpayOptions);
    // Attach event listener for payment success
    rzp.on('payment.success', (response: any) => {
      console.log('Payment success:', response);
  
    });
    // Open Razorpay payment modal
    rzp.open();
    this.makeHttpRequest(planName, planAmount);
  } 

  makeHttpRequest(planName: string, planAmount: number) {
    const apiUrl = 'http://localhost:3001/api/subscription/addSubscription';
    const requestData = {
      user_id: this.apiService.userData.id,
      subscription_type: planName,
      price: planAmount 
    };
    console.log(requestData);

    this.http.post<any>(apiUrl, requestData)
      .subscribe(response => {
        this.responseData = response;
        console.log('API response:', this.responseData);
        
      }, error => {
        console.error('Error:', error,"defrgthy");
      });
  }
}
