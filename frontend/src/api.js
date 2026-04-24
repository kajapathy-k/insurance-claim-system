import axios from "axios"

export const userPolicyApi = axios.create({
  baseURL: "http://localhost:8001",
})

export const claimApi = axios.create({
  baseURL: "http://localhost:8002",
})

export const processingApi = axios.create({
  baseURL: "http://localhost:8003",
})
