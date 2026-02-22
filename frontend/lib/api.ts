import axios, { AxiosError, AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken()
          if (refreshed && error.config) {
            return this.client.request(error.config)
          }
          // Redirect to login
          this.clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken')
    }
    return null
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    }
  }

  private clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) return false

      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken,
      })

      if (response.data.accessToken) {
        this.setTokens(response.data.accessToken, refreshToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    if (response.data.accessToken) {
      this.setTokens(response.data.accessToken, response.data.refreshToken)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
    }
    return response.data
  }

  async register(data: any) {
    const response = await this.client.post('/auth/register', data)
    return response.data
  }

  logout() {
    this.clearAuth()
    window.location.href = '/login'
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get(endpoint, { params })
    return response.data
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.post(endpoint, data)
    return response.data
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.patch(endpoint, data)
    return response.data
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint)
    return response.data
  }
}

export const api = new ApiClient()
