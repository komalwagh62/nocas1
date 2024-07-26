import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ActivatedRoute,Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string ='';
  passwordsMatch: boolean = false;

  constructor(private route: ActivatedRoute,private http: HttpClient,private router: Router) { }

  sendOTP() {
    const email = this.email;
    this.http.post<any>('http://localhost:3001/api/otp/sendOtp', { email })
      .subscribe(
        response => {
          console.log(response);
          this.showOTPForm();
        },
        error => {
          console.error('Error sending OTP:', error);
        }
      );
  }

  submitOTP() {
    console.log("uhjnkm")
    this.http.post<any>('http://localhost:3001/api/otp/validateOtp', { email: this.email, otp: this.otp })
      .subscribe(
        response => {
          console.log(response);
          if (response.valid) {
            this.showPasswordForm();
          } else {
            console.error('Invalid OTP');
          }
        },
        error => {
          console.error('Error validating OTP:', error);
        }
      );
  }
  
  validatePassword() {
    // Check if the paswords match
    this.passwordsMatch = this.newPassword  === this.confirmPassword  && !!this.newPassword ;
}

  
  submitNewPassword() {
    const newPassword = this.newPassword; // Get the new password value from the component property
   
    this.http.post<any>('http://localhost:3001/api/user/updatePassword', { email: this.email, password: this.newPassword })
    .subscribe(
      response => {
        console.log(response);
        if (response.success) {
         alert(response.message)
         this.router.navigate(['UserLogin']);
        } else {
          alert("something went wrong")
          
        }
      },
      error => {
        console.error('Error validating OTP:', error);
      }
    );


    
  }









  showOTPForm() {
    const emailForm = document.getElementById('emailForm');
    const otpForm = document.getElementById('otpForm');
    if (emailForm && otpForm) {
      emailForm.style.display = 'none';
      otpForm.style.display = 'block';
    }
  }

  showPasswordForm() {
    const otpForm = document.getElementById('otpForm');
    const passwordForm = document.getElementById('passwordForm');
    if (otpForm && passwordForm) {
      otpForm.style.display = 'none';
      passwordForm.style.display = 'block';
    }
  }
}
