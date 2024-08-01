import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../Shared/Api/api.service';
@Component({
  selector: 'app-users-profile',
  templateUrl: './users-profile.component.html',
  styleUrl: './users-profile.component.scss'
})
export class UsersProfileComponent implements OnInit {
  user: any = {};
  updatedUser: any = {};
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordsMatch: boolean = false;
  constructor(private route: ActivatedRoute, private http: HttpClient, public apiservice: ApiService, private router: Router, private cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
    this.getUserDetails();
  }
  imageUrl: string = '';
  imageName: string = '';
  selectedFile: File | undefined;
  airports: any[] = [];
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.selectedFile = file;
    this.imageName = file.name;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.imageUrl = reader.result as string;
    };
  }
  saveChanges(): void {
    this.http.put<any>('http://localhost:3001/api/user/updateUser', this.updatedUser)
      .subscribe(
        response => {
          this.apiservice.userData = JSON.parse(JSON.stringify(response.updatedUser))
          this.updatedUser = JSON.parse(JSON.stringify(response.updatedUser))
          this.user = JSON.parse(JSON.stringify(response.updatedUser))
          alert(response.message)
        },
        error => {
          console.error('Error updating profile:', error);
          alert('Failed to update profile. Please try again.');
        }
      );
  }
  logout() {
    this.router.navigate(['UserLogin']);
  }
  navigateToProfile() {
    this.router.navigate(['users-profile']);
  }
  getUserDetails(): void {
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    this.http.post<any>('http://localhost:3001/api/user/myProfile', {}, { headers: headers })
      .subscribe(
        response => {
          this.apiservice.parseUserData(response);
          this.updatedUser = JSON.parse(JSON.stringify(response));
          this.user = JSON.parse(JSON.stringify(response));
        },
        error => {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          this.cdr.detectChanges();
          alert("Failed Login");
          this.router.navigate(['UsersLogin']);
        }
      );
  }

  validatePassword() {
    this.passwordsMatch = this.newPassword === this.confirmPassword && !!this.newPassword;
  }

  changePassword(): void {
    const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
    let passwordData = { currentPassword: this.currentPassword, newPassword: this.confirmPassword }
    this.http.post<any>('http://localhost:3001/api/user/changePassword', passwordData, { headers: headers })
      .subscribe(
        response => {
          alert(response.message)
        },
        error => {
          alert(error)
        }
      )
  }
}