import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../Model/users/users';
import { Airport } from '../Model/users/airport';
import { Subscription } from '../Model/subscription';
import { Nocas } from '../Model/nocas';
import { UsersPricingPlansComponent } from '../../users-pricing-plans/users-pricing-plans.component';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  [x: string]: any;
  isAuthenticated: boolean = false;
  public baseUrl: string = 'http://localhost:3001/api';
  public loginUserId: string = '';
  public userData!: User;
  public token: string = '';
  public airportData!: Airport;
  public subscriptionData!: Subscription;
  public nocasData!: Nocas;
  public handlePayment!: UsersPricingPlansComponent;

  constructor(public http: HttpClient) {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.token = token;
    }
    const userData = localStorage.getItem('userData');
    if (userData) {
      this.userData = JSON.parse(userData);
    }
  }

  // Function to parse user data
  parseUserData(userData: any): void {
    this.userData = userData;
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Function to clear user data and token
  clearUserData(): void {
    this.userData = {} as User;
    this.token = '';
    this.isAuthenticated = false;
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
  }
}
