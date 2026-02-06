<template>
  <div class="login-page">
    <div class="login-container">
      <el-card class="login-card" shadow="always">
        <div class="login-header">
          <div class="logo-circle">
            <img :src="churchLogo" alt="Church Logo" class="logo-image" />
          </div>
          <h2 class="login-title">管理员登录</h2>
          <p class="login-subtitle">欢迎回来，请登录您的账户</p>
        </div>
        
        <el-form :model="formData" ref="formRef" @submit.prevent="login" class="login-form">
          <el-form-item>
            <el-input 
              v-model="username" 
              placeholder="请输入用户名" 
              size="large"
              clearable
              :prefix-icon="UserIcon"
              @keyup.enter="login"
            >
              <template #prefix>
                <span class="input-icon">👤</span>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-input 
              v-model="password" 
              placeholder="请输入密码" 
              type="password" 
              size="large"
              show-password
              @keyup.enter="login"
            >
              <template #prefix>
                <span class="input-icon">🔒</span>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item class="login-button-item">
            <el-button 
              type="primary" 
              @click="login" 
              :loading="loading"
              :disabled="!canLogin"
              size="large"
              class="login-button"
            >
              <span v-if="!loading">{{ canLogin ? '登录' : '请填写登录信息' }}</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-footer">
          <el-divider class="divider">
            <span class="divider-text">其他选项</span>
          </el-divider>
          <div class="footer-links">
            <el-link type="primary" @click="goToPublic" :underline="false">
              📱 前往公共签到页面
            </el-link>
            <!-- API配置功能暂不开放 -->
            <!-- <el-divider direction="vertical" />
            <el-link type="primary" @click="showApiConfig = true" :underline="false">
              ⚙️ API 配置
            </el-link> -->
          </div>
        </div>
      </el-card>

      <!-- API 配置弹窗 - 暂不开放 -->
      <!-- <el-dialog 
        v-model="showApiConfig" 
        title="API 服务器配置" 
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form :model="apiConfig" label-width="100px">
          <el-form-item label="服务器地址">
            <el-input 
              v-model="apiConfig.url" 
              placeholder="http://localhost:3000 或 http://example.com:3000"
              clearable
            />
          </el-form-item>
          <el-form-item label="说明">
            <div class="api-help-text">
              <p>• 默认值: <code>http://localhost:3000</code> (本地开发)</p>
              <p>• 生产部署: 留空使用相对路径 (自动使用当前域名)</p>
              <p>• 自定义: 输入完整的服务器地址，如 <code>http://192.168.1.100:3000</code></p>
              <p>• 当前地址: <code>{{ currentApiUrl || '使用相对路径' }}</code></p>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-space>
            <el-button @click="resetApiConfig">重置为默认</el-button>
            <el-button type="primary" @click="confirmApiConfig">确认保存</el-button>
            <el-button @click="showApiConfig = false">取消</el-button>
          </el-space>
        </template>
      </el-dialog> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api, { setToken } from '../../api'
import { ElMessage } from 'element-plus'
import churchLogo from '../../assets/church-logo.png'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const formRef = ref(null)
const formData = ref({})

// 计算是否可以登录
const canLogin = computed(() => {
  return username.value.trim().length > 0 && password.value.trim().length > 0
})

const login = async () => {
  if (!username.value.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  
  if (!password.value.trim()) {
    ElMessage.warning('请输入密码')
    return
  }

  try {
    loading.value = true
    const { data } = await api.post('/api/admin/login', {
      username: username.value.trim(),
      password: password.value.trim()
    })

    setToken(data.token)
    localStorage.setItem('token', data.token)
    localStorage.setItem('companyId', data.companyId)
    localStorage.setItem('adminId', data.adminId)
    localStorage.setItem('isSuper', data.isSuper ? 'true' : 'false')
    localStorage.setItem('adminUsername', username.value.trim())
    
    // 存储该管理员的所有教会列表
    if (data.churches) {
      localStorage.setItem('churches', JSON.stringify(data.churches))
    }

    ElMessage.success({
      message: '登录成功！即将跳转...',
      duration: 1500
    })
    
    // 使用路由跳转
    setTimeout(() => {
      router.push('/admin')
    }, 1000)
  } catch (e) {
    const errorMsg = e.response?.data?.msg || '登录失败，请检查用户名和密码'
    ElMessage.error({
      message: errorMsg,
      duration: 3000
    })
  } finally {
    loading.value = false
  }
}

const goToPublic = () => {
  router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: moveBackground 20s linear infinite;
}

@keyframes moveBackground {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.login-container {
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
}

.login-card {
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2);
  animation: pulse 2s ease-in-out infinite;
  backdrop-filter: blur(8px);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5), inset 0 1px 3px rgba(255, 255, 255, 0.3);
  }
}

.logo-icon {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.logo-image {
  width: 72%;
  height: 72%;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
  border-radius: 50%;
  display: block;
}

.login-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  margin: 0;
  color: #909399;
  font-size: 15px;
  font-weight: 400;
}

.login-form {
  margin-top: 30px;
}

.input-icon {
  font-size: 18px;
  margin-right: 8px;
}

:deep(.el-input__inner) {
  padding-left: 45px;
}

:deep(.el-input__prefix) {
  left: 15px;
}

.login-button-item {
  margin-top: 25px;
  margin-bottom: 0;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  background: #d3dce6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 25px;
}

.divider {
  margin: 20px 0;
}

.divider-text {
  color: #909399;
  font-size: 13px;
  padding: 0 12px;
}

.footer-links {
  text-align: center;
}

.footer-links .el-link {
  font-size: 14px;
  font-weight: 500;
}

.login-tips {
  margin-top: 20px;
  padding: 12px;
  background: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.tip-text {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

/* 响应式设计 - 平板 */
@media (max-width: 768px) {
  .login-page {
    padding: 10px;
    min-height: 100vh;
  }

  .login-card {
    padding: 30px 24px;
    border-radius: 8px;
  }

  .login-header {
    margin-bottom: 24px;
  }

  .login-title {
    font-size: 26px;
    margin: 0 0 10px;
  }

  .login-subtitle {
    font-size: 13px;
  }

  .logo-circle {
    width: 70px;
    height: 70px;
    margin: 0 auto 16px;
  }

  .logo-icon {
    font-size: 32px;
  }

  .logo-image {
    width: 70%;
    height: 70%;
  }

  .login-form {
    margin-top: 24px;
  }

  .login-form :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .login-button-item {
    margin-top: 20px;
  }

  .input-icon {
    font-size: 16px;
    margin-right: 6px;
  }

  .divider-text {
    font-size: 13px;
  }

  .footer-links .el-link {
    font-size: 13px;
  }
}

/* 响应式设计 - 手机 */
@media (max-width: 480px) {
  .login-page {
    padding: 0;
    justify-content: flex-start;
    padding-top: 10vh;
  }

  .login-container {
    margin: 0 auto;
    max-width: 100%;
    width: 100%;
  }

  .login-card {
    border-radius: 0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    padding: 24px 16px;
    margin: 0;
  }

  .login-header {
    padding: 12px 0;
    margin-bottom: 20px;
  }

  .logo-circle {
    width: 60px;
    height: 60px;
    margin: 0 auto 12px;
  }

  .logo-icon {
    font-size: 28px;
  }

  .logo-image {
    width: 70%;
    height: 70%;
  }

  .login-title {
    font-size: 22px;
    margin: 0 0 8px;
  }

  .login-subtitle {
    font-size: 12px;
    margin: 0;
  }

  .login-form {
    margin-top: 20px;
  }

  .login-form :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .login-form :deep(.el-input__wrapper) {
    padding: 6px 8px;
  }

  .login-form :deep(.el-input__inner) {
    min-height: 44px;
    font-size: 16px;
    padding-left: 40px;
  }

  .input-icon {
    font-size: 16px;
    margin-right: 6px;
  }

  .login-button-item {
    margin-top: 18px;
    margin-bottom: 0;
  }

  .login-button {
    height: 44px;
    font-size: 15px;
    border-radius: 22px;
  }

  .login-footer {
    margin-top: 16px;
  }

  .divider {
    margin: 16px 0;
  }

  .divider-text {
    font-size: 12px;
    padding: 0 8px;
  }

  .footer-links .el-link {
    font-size: 13px;
  }

  .login-tips {
    padding: 10px 12px;
    margin-top: 16px;
    font-size: 12px;
  }

  .tip-text {
    font-size: 11px;
    margin: 0;
  }
}

/* 小型手机 */
@media (max-width: 360px) {
  .login-card {
    padding: 20px 12px;
  }

  .login-title {
    font-size: 20px;
  }

  .login-subtitle {
    font-size: 11px;
  }

  .logo-circle {
    width: 55px;
    height: 55px;
  }

  .logo-icon {
    font-size: 26px;
  }

  .logo-image {
    width: 65%;
    height: 65%;
  }

  .login-form :deep(.el-input__inner) {
    min-height: 42px;
    font-size: 16px;
  }

  .input-icon {
    font-size: 14px;
  }
}

/* iOS Safari 特定优化 */
@supports (-webkit-touch-callout: none) {
  .login-page {
    position: fixed;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 20px 0;
  }

  .login-form :deep(.el-input__inner) {
    font-size: 16px;
  }

  .login-button {
    -webkit-appearance: none;
    appearance: none;
    -webkit-user-select: none;
    user-select: none;
  }
}

/* 横屏模式优化 */
@media (max-height: 500px) {
  .login-page {
    padding: 10px;
    justify-content: center;
  }

  .login-card {
    padding: 20px 16px;
  }

  .login-title {
    font-size: 18px;
    margin: 0 0 6px;
  }

  .login-subtitle {
    font-size: 11px;
  }

  .logo-circle {
    width: 50px;
    height: 50px;
    margin: 0 auto 8px;
  }

  .logo-icon {
    font-size: 22px;
  }

  .logo-image {
    width: 65%;
    height: 65%;
  }

  .login-form {
    margin-top: 12px;
  }

  .login-form :deep(.el-form-item) {
    margin-bottom: 8px;
  }

  .login-button {
    height: 40px;
    font-size: 14px;
  }

  .login-footer {
    margin-top: 8px;
  }

  .divider {
    margin: 8px 0;
  }
}

/* 输入框焦点效果 */
:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #667eea inset, 0 2px 8px rgba(102, 126, 234, 0.2);
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: rgba(30, 30, 30, 0.95);
  }
  
  .login-tips {
    background: rgba(64, 158, 255, 0.1);
  }
}
</style>