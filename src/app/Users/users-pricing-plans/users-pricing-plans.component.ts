import { Component } from '@angular/core';
declare var Razorpay: any;
@Component({
  selector: 'app-users-pricing-plans',
  templateUrl: './users-pricing-plans.component.html',
  styleUrl: './users-pricing-plans.component.scss'
})
export class UsersPricingPlansComponent {

  constructor() { }

  handlePayment(planName: string, planAmount: number) {
    const RozarpayOptions = {
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

    const rzp = new Razorpay(RozarpayOptions);
    rzp.open();

  }
}
