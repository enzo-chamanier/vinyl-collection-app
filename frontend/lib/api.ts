interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

async function request(endpoint: string, options: RequestOptions = {}): Promise<any> {
  const baseUrl = API_URL
  const url = `${baseUrl}${endpoint}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || error.error || "Request failed")
  }

  return response.json()
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: "GET" }),
  post: (endpoint: string, data: any) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),
}
