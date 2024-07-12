import axios from "axios";

const axiosBase = axios.create({ baseURL: 'http://localhost:3001/api', headers: { 'Content-Type': 'application/json' } })

export default axiosBase