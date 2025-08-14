import axios from 'axios';
import { BASE_URL } from './apiPaths';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // Set a timeout of 10 seconds
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});


//request interceptor to add token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


//response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle unauthorized access, e.g., redirect to login
            // localStorage.removeItem('token');
        if (error.response.status === 401) {
                alert("Session expired. Please log in again.");
                // Redirect to login page
            window.location.href = '/login'; // Redirect to login page
        } else if (error.response.status === 500) {
            console.error("Server error. Please try again later.");
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error("Request timed out. Please try again.");
        }

        return Promise.reject(error);
    }
);

//have to export this 
export default axiosInstance;
