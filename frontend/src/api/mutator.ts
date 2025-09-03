import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Custom Axios instance that automatically includes JWT auth headers
 */
export const customInstance = async <T>({
  url,
  method,
  params,
  data,
  headers,
  ...config
}: AxiosRequestConfig): Promise<T> => {
  // Get JWT token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // Prepare headers with auth token if available
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  const response: AxiosResponse<T> = await axios({
    url,
    method,
    params,
    data,
    headers: {
      ...authHeaders,
      ...headers, // Allow overriding auth headers if needed
    },
    ...config,
  });

  return response.data;
};