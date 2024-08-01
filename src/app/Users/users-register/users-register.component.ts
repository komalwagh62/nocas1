import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
@Component({
  selector: 'app-users-register',
  templateUrl: './users-register.component.html',
  styleUrls: ['./users-register.component.scss']
})
export class UsersRegisterComponent implements OnInit {
  SignupForm: FormGroup | any;
  otpSent: boolean = false;
  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }
  public showPassword: boolean = false;
  generatedOTP: string | undefined;
  ngOnInit(): void {
    this.SignupForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[6789]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      uname: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      address: ['', [Validators.required]],
    });
  }
  onOtpKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }
  onNameInput(event: any): void {
    const input = event.target.value;
    const regex = /^[a-zA-Z\s]*$/;
    if (!regex.test(input)) {
      event.target.value = input.replace(/[^a-zA-Z\s]/g, '');
    }
  }
  onPhoneNumberKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  generateOTP() {
    this.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
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
    if (this.SignupForm.valid) {
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
      alert('Please fill in all required fields and ensure they are valid.');
    }
  }
}
