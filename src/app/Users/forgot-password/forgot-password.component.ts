import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordsMatch: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) { }

  sendOTP() {
    const email = this.email;
    this.http.post<any>('http://localhost:3001/api/otp/sendOtp', { email })
      .subscribe(
        response => {
          console.log(response);
          this.toastr.success("An OTP has been sent to your email address. Please check your email.");
          this.showOTPForm(); // Show the OTP form
        },
        error => {
          console.error('Error sending OTP:', error);
          this.toastr.error("Failed to send OTP. Please check your email ID.");
        }
      );
  }

  submitOTP() {
    console.log("Submitting OTP...");
    this.http.post<any>('http://localhost:3001/api/otp/validateOtp', { email: this.email, otp: this.otp })
      .subscribe(
        response => {
          console.log(response);
          if (response.valid) {
            this.toastr.success("OTP validated successfully. Please set a new password.");
            this.showPasswordForm();
          } else {
            this.toastr.error("Invalid OTP. Please check the OTP and try again.");
            console.error('Invalid OTP');
          }
        },
        error => {
          console.error('Error validating OTP:', error);
          this.toastr.error("Failed to validate OTP. Please try again.");
        }
      );
  }

  validatePassword() {
    // Check if the passwords match
    this.passwordsMatch = this.newPassword === this.confirmPassword && !!this.newPassword;
  }

  submitNewPassword() {
    const newPassword = this.newPassword; // Get the new password value from the component property
  
    this.http.post<any>('http://localhost:3001/api/user/updatePassword', { email: this.email, password: newPassword })
      .subscribe(
        response => {
          console.log(response);
          if (response.success) {
            this.toastr.success("Your password has been updated successfully. You will be redirected to the login page.");
            this.router.navigate(['UsersLogin']);
          } else {
            this.toastr.error("Failed to update password. Please try again.");
          }
        },
        error => {
          console.error('Error updating password:', error);
          this.toastr.error("Failed to update password. Please try again later.");
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
