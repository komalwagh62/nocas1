import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../Shared/Api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usersrequest-service',
  templateUrl: './usersrequest-service.component.html',
  styleUrl: './usersrequest-service.component.scss'
})
export class UsersrequestServiceComponent implements OnInit {
  requestForm!: FormGroup;
  user: any = {};
  updatedUser: any = {};
  
  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private apiService: ApiService,
    private router: Router
  ) {}
 
  ngOnInit(): void {
    this.requestForm = this.formBuilder.group({
      service1: [false],
      service2: [false],
      service3: [false],
      service4: [false],
      service5: [false]
    });

    this.getUserDetails();
  }
 
  createRequest() {
    if (this.requestForm.valid) {
      const requestData = {
        services: JSON.stringify(this.requestForm.value),
        user_id: this.apiService.userData.id
      };

      console.log(this.requestForm.value,"dgtrf")
 
      this.http.post<any>('http://localhost:3001/api/request/createRequest', requestData)
        .subscribe(
          (result) => {
            console.log("Request creation response:", result);
            alert("Request created successfully");
          },
          (error) => {
            console.error("Error creating request:", error);
            alert("Error creating request");
          }
        );
    } else {
      alert('Please select a service.');
    }
  }

  getUserDetails(): void {
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiService.token}`);
    this.http.post<any>('http://localhost:3001/api/user/myProfile', {}, { headers })
      .subscribe(
        response => {
          this.apiService.userData = JSON.parse(JSON.stringify(response))
          this.updatedUser = JSON.parse(JSON.stringify(response))
          this.user = JSON.parse(JSON.stringify(response))
          localStorage.setItem('this.user', JSON.stringify(response.apiservice.userData));
        },
        error => {
          console.error("Failed to fetch user details:", error);
          alert("Failed to fetch user details. Please log in again.");
          this.router.navigate(['UsersLogin']);
        }
      );
  }
}

