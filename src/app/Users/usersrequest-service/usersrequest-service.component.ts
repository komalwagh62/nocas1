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
  // services!: {service1:'NOC Application & Associated Service',service2:'Pre-aeronautical Study',services3:'Aeronautical Study / Shielding Benefits Study',service4:'Documents & Process Management'};
  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private apiService: ApiService // Corrected injection of ApiService
  ) { }
 
  ngOnInit(): void {
    this.requestForm = this.formBuilder.group({
      service1: [false],
      service2: [false],
      service3: [false],
      service4: [false]
    });
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

}
