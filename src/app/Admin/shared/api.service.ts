import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../Users/Shared/Model/users/users';
import { Subscription } from '../../Users/Shared/Model/subscription';
import { Nocas } from '../../Users/Shared/Model/nocas';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3001/api';
  public userData!: User;
  public subscriptionData!:Subscription
  public nocasData!:Nocas

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/getAllUsers`);
  }

  getAllSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subscription/getAllSubscription`);
  }

  getAllPermissible(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/nocas/getAllPermissible`);
  }
  private loggedIn = false;

  login() {
    // Implement your login logic here
    this.loggedIn = true;
  }

  logout() {
    // Implement your logout logic here
    this.loggedIn = false;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }
}

