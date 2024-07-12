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






  constructor(private route: ActivatedRoute, private http: HttpClient, public apiservice: ApiService, private router: Router,private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // this.user = history.state.user;
    // Copy user data to updatedUser object for editing
    // this.updatedUser = { ...this.user };
    // console.log(this.updatedUser)
   
    this.getUserDetails();

  
  }
  // Inside your component class (e.g., ProfileComponent)
  // Inside your component class (e.g., ProfileComponent)
  imageUrl: string = '';
  imageName: string = '';
  selectedFile: File | undefined;
  airports: any[] = []; // Variable to store airport data

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.selectedFile = file;

    // Set the image name
    this.imageName = file.name;

    // Optionally, if you also want to display the image preview:
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.imageUrl = reader.result as string;
    };
  }


  saveChanges(): void {
    console.log(this.updatedUser)
    this.http.put<any>('http://localhost:3001/api/user/updateUser', this.updatedUser)
      .subscribe(
        response => {
          this.apiservice.userData = JSON.parse(JSON.stringify(response.updatedUser))
          console.log(response)
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
    // console.log("de")
    this.router.navigate(['UserLogin']);
  }

  navigateToProfile() {
    this.router.navigate(['users-profile']);
  }


  
  
  
// Inside the getUserDetails function in UsersProfileComponent
getUserDetails(): void {
  const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
  this.http.post<any>('http://localhost:3001/api/user/myProfile', {}, { headers: headers })
    .subscribe(
      response => {
        this.apiservice.parseUserData(response); // Parse user data here

        this.updatedUser = JSON.parse(JSON.stringify(response));
        this.user = JSON.parse(JSON.stringify(response));
        console.log(this.user);
        localStorage.setItem('this.user', JSON.stringify(response.apiservice.userData));
      },
      error => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
    
        // Trigger change detection to update the UI
        this.cdr.detectChanges();
        
        alert("Failed Login");
        
        this.router.navigate(['UsersLogin']);
      }
      
    );
    
}


  validatePassword() {
    // Check if the paswords match
    this.passwordsMatch = this.newPassword  === this.confirmPassword  && !!this.newPassword;
}


changePassword(): void {

  const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
  let passwordData = {currentPassword:this.currentPassword,newPassword:this.confirmPassword}
  console.log(passwordData)
  this.http.post<any>('http://localhost:3001/api/user/changePassword', passwordData, { headers: headers })
    .subscribe(
      response => {
        // this.apiservice.userData = JSON.parse(JSON.stringify(response))
        // // console.log(response)
        // this.updatedUser = JSON.parse(JSON.stringify(response))
        // this.user = JSON.parse(JSON.stringify(response))
       alert(response.message)


      },
      error => {
        alert(error)
        
      }
    )

}
}