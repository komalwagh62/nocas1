import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../Shared/Api/api.service';
@Component({
  selector: 'app-users-login',
  templateUrl: './users-login.component.html',
  styleUrl: './users-login.component.scss'
})
export class UsersLoginComponent {

  LogInForm: FormGroup | any;
  email: string = '';
  password: string = '';
  loginError: string = '';
  isAuthenticated: boolean = false;


  constructor(private formbuilder: FormBuilder, private router: Router, private apiservice: ApiService) { }
  public showPassword: boolean = false;

  ngOnInit(): void {
    this.LogInForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email, Validators.nullValidator]),
      password: new FormControl('', [Validators.required, Validators.nullValidator])
    });
  }

  login() {
    // Check if the form is valid
    if (this.LogInForm.valid) {
      // Form is valid, proceed with login
      const credentials = { email: this.LogInForm.value.email, password: this.LogInForm.value.password };
      let url = this.apiservice.baseUrl + '/user/userLogin';
  
      this.apiservice.http.post<any>(url, credentials)
        .subscribe(
          response => {
            console.log(response)
            if (response.success) {
              // let {id,uname,address,phone_number,email,password} = response.user
              // this.apiservice.userData = new User(id,uname,address,phone_number,email,password)
              this.apiservice.token = response.jwttoken
              console.log(response.jwttoken)
              this.router.navigate(['UsersProfile']);
              // this.isAuthenticated = true;
            } else {
              alert('Invalid email or password. Please try again.');
            } 
          },
          error => {
            console.error('Error during login:', error);
            alert('Failed to login. Please try again.');
          }
        );
    } else {
      // Form is invalid, display error message or take appropriate action
      alert('Please fill in all required fields and ensure they are valid.');
    }
  }
  


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

}