import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../Shared/Api/api.service';

@Component({
  selector: 'app-users-home',
  templateUrl: './users-home.component.html',
  styleUrls: ['./users-home.component.scss']
})
export class UsersHomeComponent {
  constructor(private route: ActivatedRoute, private http: HttpClient, public apiservice: ApiService, private router: Router) { }

  detailsOfPermissible() {
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    this.http.get<any>('http://localhost:3001/api/user/getAllUsers', {})
      .subscribe(
        response => {
          console.log(response);
          // Handle the response data as needed
        },
        error => {
          console.error('Failed to fetch subscription data:', error);
          // Handle error appropriately, e.g., show an error message to the user
        }
      );
  }
}
