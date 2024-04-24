import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../Shared/Api/api.service';

@Component({
  selector: 'app-usersrequest-service',
  templateUrl: './usersrequest-service.component.html',
  styleUrl: './usersrequest-service.component.scss'
})
export class UsersrequestServiceComponent {
  requestForm!: FormGroup;
 
  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private apiService: ApiService // Corrected injection of ApiService
  ) { }
 
  ngOnInit(): void {
    this.requestForm = this.formBuilder.group({
      service: ['', Validators.required]
    });
  }
 
  createRequest() {
    if (this.requestForm.valid) {
      const requestData = {
        service_name: this.requestForm.value.service,
        user_id: this.apiService.userData.id
      };
 
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

}
