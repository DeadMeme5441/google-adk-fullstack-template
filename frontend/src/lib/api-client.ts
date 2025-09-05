import { client } from '@/client'
import { auth } from './auth'

// Configure the API client with authentication
function configureAuthenticatedClient() {
  // Set up request interceptor to add Bearer token
  client.setConfig({
    headers: {
      'Content-Type': 'application/json',
    },
    // Add interceptor to include auth token in requests
    fetch: async (url: RequestInfo | URL, init?: RequestInit) => {
      const token = auth.getToken()
      
      // Always create init if it doesn't exist, then add token if available
      if (!init) {
        init = {}
      }
      
      if (token) {
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${token}`,
        }
      }
      
      return fetch(url, init)
    }
  })
}

// Initialize the client on module load
configureAuthenticatedClient()

export { client }