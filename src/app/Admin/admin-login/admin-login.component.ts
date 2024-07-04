import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../Admin/shared/api.service';
@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {

  LogInForm: FormGroup | any;

  constructor(private formbuilder: FormBuilder, private router: Router,private authService: ApiService,) { }
  public showPassword: boolean = false;

  ngOnInit(): void {
    this.LogInForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email, Validators.nullValidator]),
      password: new FormControl('', [Validators.required, Validators.nullValidator])
    });
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }




  onsubmit() {
    const { email, password } = this.LogInForm.value;
    // const email = this.LogInForm.controls.email.value;
    // const password = this.LogInForm.controls.password.value;
    
    // Check if the entered email and password are valid
    if (email === 'komalwagh62@gmail.com' && password === 'password') {
      this.authService.login();
      // Perform the login logic here (e.g., navigate to another page)
      this.router.navigate(['/AdminDashboard']);
      console.log('Login successful');
    } else {
      // Display an error message or perform another action for invalid credentials
      console.log('Invalid email or password');
    }
  }
}





