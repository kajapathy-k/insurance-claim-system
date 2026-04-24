import axios from "axios"

export const userPolicyApi = axios.create({
  baseURL: import.meta.env.VITE_USER_POLICY_API_URL || "http://localhost:8001",
})

export const claimApi = axios.create({
  baseURL: import.meta.env.VITE_CLAIM_API_URL || "http://localhost:8002",
})

export const processingApi = axios.create({
  baseURL: import.meta.env.VITE_PROCESSING_API_URL || "http://localhost:8003",
})
