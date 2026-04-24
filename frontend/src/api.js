import axios from "axios"

const createApi = (baseURL) => {
  const api = axios.create({ baseURL })
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("nexus_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  return api
}

export const userPolicyApi = createApi(import.meta.env.VITE_USER_POLICY_API_URL || "/api/policy")
export const claimApi = createApi(import.meta.env.VITE_CLAIM_API_URL || "/api/claim")
export const processingApi = createApi(import.meta.env.VITE_PROCESSING_API_URL || "/api/processing")

