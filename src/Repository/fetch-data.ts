import axiosBase from "../Api/ApiConfig";
import axios, { AxiosHeaders, AxiosRequestHeaders } from "axios";
import { IfetchData } from "./Interfaces/IfetchData";
import { IrequestOptions } from "./Interfaces/IrequestOptions";

export class FetchData implements IfetchData {
  constructor() { }

  async makeRequest<T>(requestOptions: IrequestOptions, callbacks?: { ifSuccess: (data: T) => void; ifError: (error: Error) => void }): Promise<T> {
    const { method, url, headers, body, token } = requestOptions;
    // const { ifSuccess, ifError } = callbacks;

    const axiosHeaders = new AxiosHeaders();
    Object.entries(axiosBase.defaults.headers.common as AxiosRequestHeaders).forEach(([key, value]) => {
      axiosHeaders.set(key, value);
    });
    // Add custom headers from requestOptions
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        axiosHeaders.set(key, value);
      });
    }
    // Add token to headers if provided
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
      // ifSuccess(response.data);
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        // ifError(new Error(`Error making request: ${error.message}`));
        throw new Error(`Error making request: ${error.message}`);
      } else {
        // ifError(new Error(`Unexpected error: ${error}`));
        throw new Error(`Unexpected error: ${error}`);
      }
    }
  }
}
