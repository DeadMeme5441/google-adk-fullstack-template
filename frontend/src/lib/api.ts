// API client setup using the generated client
import { client } from '@/client'
import { auth } from './auth'

// Configure the client base URL
client.setConfig({
  baseUrl: 'http://localhost:8000',
})

// Export the configured client
export { client }