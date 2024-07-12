import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../Admin/auth.service';
@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {

  LogInForm: FormGroup | any;

  constructor(private formbuilder: FormBuilder, private formBuilder: FormBuilder, private router: Router, private authService: AuthService) { }
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
    if (this.LogInForm.valid) {
      const email = this.LogInForm.get('email')?.value;
      const password = this.LogInForm.get('password')?.value;

      if (this.authService.login(email, password)) {
        this.router.navigate(['AdminDashboard']);
      } else {
        // Handle authentication error (show error message, etc.)
      }
    }
  }
}





