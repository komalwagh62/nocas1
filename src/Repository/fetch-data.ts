import axiosBase from "../Api/ApiConfig";
import axios, { AxiosHeaders, AxiosRequestHeaders } from "axios";
import { IfetchData } from "./Interfaces/IfetchData";
import { IrequestOptions } from "./Interfaces/IrequestOptions";

import { Injectable } from "@angular/core";
@Injectable({
  providedIn: 'root',
})
export class FetchData implements IfetchData {
  constructor() { }

  async makeRequest<T>(requestOptions: IrequestOptions): Promise<T> {
    const { method, url, headers, body } = requestOptions;
    

    const axiosHeaders = new AxiosHeaders();
    Object.entries(axiosBase.defaults.headers.common as AxiosRequestHeaders).forEach(([key, value]) => {
      axiosHeaders.set(key, value);
    });
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        axiosHeaders.set(key, value);
      });
    }
    // Add token to headers if provided
    const token = localStorage.getItem('token');
    if (token) {
      axiosHeaders.set('Authorization', `Bearer ${token}`);
    }
    try {
      const response = await axiosBase.request<T>({
        method,
        url,
        headers: axiosHeaders,
        data: body

      });
      console.log(response,"fcvg")
      if (response.status == 401 || response.status == 403){
        alert("Login failed")
        localStorage.removeItem('userData');
        localStorage.removeItem('token')
        // window.location.reload();
        // this.router.navigate(['UsersLogin']);
        
      }
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Error making request: ${error.message}`);
      } else {
        throw new Error(`Unexpected error: ${error}`);
      }
    }
  }
}
