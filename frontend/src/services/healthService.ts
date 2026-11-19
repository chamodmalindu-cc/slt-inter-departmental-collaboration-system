export interface HealthCheckResponse {
  status: string
  timestamp: string
  service: string
  version: string
  database: {
    configured: boolean
    host: string
    port: string
    database: string
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
