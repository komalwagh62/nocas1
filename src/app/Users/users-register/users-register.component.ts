import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
// import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-users-register',
  templateUrl: './users-register.component.html',
  styleUrls: ['./users-register.component.scss'] 
})

export class UsersRegisterComponent {

  SignupForm: FormGroup | any;
  otpSent: boolean = false;
  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    // private toastr: ToastrService,
    private router: Router
  ) { }
  public showPassword: boolean = false;
  generatedOTP: string | undefined;
  ngOnInit(): void {
    this.SignupForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]], // Use FormBuilder for form controls
      phone_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[6789]\d{9}$/)]],
      password: ['', [Validators.required]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      uname: ['', [Validators.required]],
      address: ['', [Validators.required]],
    });
  }
  

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  generateOTP() {
    // Generate a random 4-digit OTP
    this.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    // You can implement OTP sending logic here, like sending an SMS to the entered phone number

    alert(this.generatedOTP);
  }

  regenerateOtp() {
    const phoneNumberControl = this.SignupForm.get('phone_number');
    if (phoneNumberControl && phoneNumberControl.valid) {
      this.generateOTP();
      this.otpSent = true;
    } else {
      this.otpSent = false;
    }
  }
  onPhoneNumberChange() {
    const phoneNumberControl = this.SignupForm.get('phone_number');
    if (phoneNumberControl && phoneNumberControl.valid) {
      this.generateOTP();
      this.otpSent = true;
    } else {
      this.otpSent = false;
    }
  }
  createUser() {
    // Check if the form is valid
    if (this.SignupForm.valid) {
      // Form is valid, proceed with registration
      // Send registration data to the server
      this.http.post("http://localhost:3001/api/user/createUser", {
        uname: this.SignupForm.value.uname,
        phone_number: this.SignupForm.value.phone_number,
        address: this.SignupForm.value.address,
        email: this.SignupForm.value.email,
        password: this.SignupForm.value.password
      }).subscribe(
        (resultData: any) => {
          console.log("User registration response:", resultData);
          alert("User registered successfully");
          this.router.navigate(['UsersLogin']);
        },
        (error: any) => {
          console.error("Error registering user:", error);
          alert(error.error.message);
        }
      );
    } else {
      // Form is invalid, display error message or take appropriate action
      alert('Please fill in all required fields and ensure they are valid.');
    }
  }
  
  

}