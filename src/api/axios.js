import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requestUrl = error.config?.url || '';

        // Do not log the user out or reload the app when the login request itself fails.
        // Only force logout on real authenticated-route failures.
        if (error.response && error.response.status === 401 && !requestUrl.includes('/login')) {
            localStorage.clear();

            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
