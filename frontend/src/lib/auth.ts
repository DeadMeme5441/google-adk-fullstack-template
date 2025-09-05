// Simple token-based auth utilities
export const auth = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token')
  },
  
  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token)
  },
  
  clearToken: (): void => {
    localStorage.removeItem('auth_token')
  },
  
  isAuthenticated: (): boolean => {
    return !!auth.getToken()
  }
} as const