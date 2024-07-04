import axiosBase from "../Api/ApiConfig";
import axios, { AxiosRequestHeaders } from "axios";
import { IfetchData } from "./Interfaces/IfetchData";
import { IrequestOptions } from "./Interfaces/irequestOptions";

export class FetchData implements IfetchData {
  constructor() {}

  async makeRequest<T>(requestOptions: IrequestOptions): Promise<T> {
    const { method, url, headers } = requestOptions;

    // Ensure headers type conforms to AxiosRequestHeaders
    const axiosHeaders: AxiosRequestHeaders = {
        ...(axiosBase.defaults.headers.common as AxiosRequestHeaders), // Use 'common' to get default headers
        ...(headers as unknown as AxiosRequestHeaders), // Type cast headers to AxiosRequestHeaders
      };

    try {
      const response = await axiosBase.request<T>({
        method,
        url,
        
        headers: axiosHeaders,
      });

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
