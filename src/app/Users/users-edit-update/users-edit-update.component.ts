import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-users-edit-update',
  templateUrl: './users-edit-update.component.html',
  styleUrl: './users-edit-update.component.scss'
})
export class UsersEditUpdateComponent {
  Editform: FormGroup | any;

  // constructor(private dialogref: MatDialogRef<UsersEditUpdateComponent>,) { }


  ngOnInit(): void {
    this.Editform = new FormGroup({
      Full_Name: new FormControl('', [Validators.required, Validators.nullValidator]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.nullValidator]),
      phone_number: new FormControl('', [Validators.required, Validators.nullValidator, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[6789]\d{9}$/)]),
      password: new FormControl('', [Validators.required, Validators.nullValidator]),
      otp: new FormControl('', [Validators.required, Validators.nullValidator, Validators.pattern(/^\d{4}$/)]),
    });

  }

  adddetail() {
    // console.log(this.Editform.value)
   
  }
}