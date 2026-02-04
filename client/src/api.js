import axios from 'axios'

// 获取 API 基础 URL
// 优先级: localStorage > Vite 环境变量 > 默认值
function getApiBaseUrl() {
  // 1. 优先使用 localStorage 中保存的用户自定义配置
  const savedUrl = localStorage.getItem('api_base_url')
  if (savedUrl) {
    return savedUrl
  }

  // 2. 其次使用 Vite 环境变量 (编译时设置)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 3. 最后使用默认值 (相对路径，与前端同机)
  // 空字符串表示相对于当前域名 (如: http://example.com/api)
  return ''
}

// 创建 axios 实例
const api = axios.create({
  baseURL: getApiBaseUrl()
})

// 导出函数：设置 Token
export function setToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = token
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// 导出函数：更新 API 基础 URL (运行时配置)
export function setApiBaseUrl(url) {
  // 移除末尾的 /
  const cleanUrl = url.replace(/\/$/, '')
  
  // 保存到 localStorage
  localStorage.setItem('api_base_url', cleanUrl)
  
  // 更新 axios 实例的 baseURL
  api.defaults.baseURL = cleanUrl
  
  console.log(`[API] Base URL updated to: ${cleanUrl}`)
}

// 导出函数：获取当前 API 基础 URL
export function getApiUrl() {
  return api.defaults.baseURL
}

// 导出函数：重置 API 配置为默认值
export function resetApiConfig() {
  localStorage.removeItem('api_base_url')
  // 重新计算默认值
  api.defaults.baseURL = getApiBaseUrl()
  console.log(`[API] Config reset to default: ${getApiBaseUrl()}`)
}

export default api
