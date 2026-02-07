<template>
  <div class="sign-container">
    <div class="box">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">📝 签到</h1>
        <p class="page-subtitle">请选择教会并填写信息</p>
      </div>

      <!-- 公司选择：允许切换公司或从链接自动预选 -->
      <div class="company-select-row">
        <div class="select-wrapper">
          <label class="select-label">⛪ 选择教会</label>
          <el-select 
            v-model="companyCode" 
            placeholder="请选择教会" 
            filterable 
            clearable 
            @change="onCompanyChange" 
            class="company-select"
            size="large"
          >
            <el-option v-for="c in companies" :key="c.code" :label="c.name + ' ('+c.code+')'" :value="c.code" />
          </el-select>
        </div>
        <el-button 
          @click="fetchCompanies" 
          class="refresh-btn" 
          circle
          size="large"
          :loading="companyLoading"
        >
          🔄
        </el-button>
      </div>

      <div class="form-content">
        <div class="form-group">
          <label class="field-label">
            <span class="label-icon">👤</span>
            <span>姓名</span>
            <span class="optional-tag">选填</span>
          </label>
          <div class="input-wrapper">
            <input 
              v-model="form.name" 
              type="text"
              placeholder="请输入姓名"
              class="input-field"
              @input="updateStatus"
            />
            <span v-if="form.name" class="clear-btn" @click="form.name = ''; updateStatus()">✕</span>
          </div>
        </div>

        <div class="form-group">
          <label class="field-label">
            <span class="label-icon">📱</span>
            <span>手机号</span>
            <span class="optional-tag">选填</span>
          </label>
          <div class="input-wrapper">
            <input 
              v-model="form.phone" 
              type="tel"
              placeholder="请输入手机号"
              class="input-field"
              @input="updateStatus"
            />
            <span v-if="form.phone" class="clear-btn" @click="form.phone = ''; updateStatus()">✕</span>
          </div>
        </div>

        <button 
          @click="onSubmit" 
          :disabled="loading || !companyCode || inputStatus === 'invalid'" 
          class="submit-btn"
          :class="{ 'loading': loading }"
        >
          <span v-if="loading" class="loading-spinner">⏳</span>
          <span v-else-if="inputStatus === 'valid'" class="status-icon">✓</span>
          <span v-else-if="inputStatus === 'invalid'" class="status-icon invalid">✗</span>
          <span v-else class="status-icon">●</span>
          <span class="btn-text">{{ loading ? '签到中...' : (!companyCode ? '请先选择教会' : '签到') }}</span>
        </button>
      </div>

      <div class="tip" :class="{ 'valid': inputStatus === 'valid', 'invalid': inputStatus === 'invalid' }">
        {{ statusText }}
      </div>

      <div class="footer-link">
        <a href="https://adventist.jp/author/commu/" target="_blank" class="church-link">
          <span class="link-icon">⛪</span>
          <span>大阪中心教会网页</span>
        </a>
      </div>
    </div>
  </div>

  <!-- 多人选择对话框 -->
  <el-dialog 
    v-model="showSelectDialog" 
    title="📋 请选择具体人员"
    width="90%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="select-dialog"
    align-center
  >
    <p class="select-dialog-hint">该手机号对应多个成员，请选择要签到的人员：</p>
    <div class="employee-list">
      <button 
        v-for="emp in multipleEmployees" 
        :key="emp.id"
        @click="selectEmployee(emp)"
        class="employee-option"
      >
        <div class="emp-header">
          <span class="emp-avatar">👤</span>
          <span class="emp-name">{{ emp.name }}</span>
        </div>
        <span class="emp-info">{{ emp.gender ? emp.gender + ' · ' : '' }}{{ emp.age ? emp.age + '岁' : '' }}</span>
      </button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const form = ref({ name: '', phone: '' })
const loading = ref(false)
const companyLoading = ref(false)
const inputStatusVal = ref('empty')
const showSelectDialog = ref(false)
const multipleEmployees = ref([])
const selectedPhoneForMultiple = ref('')
// 支持两种参数格式：?company=xxx 或 ?code=xxx
const urlParams = new URLSearchParams(location.search)
const initialCompany = urlParams.get('company') || urlParams.get('code')
const companyCode = ref(initialCompany || '')
const companyName = ref('')
const companies = ref([])

const updateStatus = () => {
  const { name, phone } = form.value
  const nameInputted = name && name.trim().length > 0
  const phoneInputted = phone && phone.trim().length > 0
  
  // 如果都输入了
  if (nameInputted && phoneInputted) {
    const nameOk = name.trim().length > 0
    const phoneOk = /^(1[3-9]\d{9}|0\d{9,10})$/.test(phone)
    if (nameOk && phoneOk) inputStatusVal.value = 'valid'
    else inputStatusVal.value = 'invalid'
  }
  // 如果都没输入
  else if (!nameInputted && !phoneInputted) {
    inputStatusVal.value = 'empty'
  }
  // 只输入了一个
  else if (nameInputted && !phoneInputted) {
    // 只有姓名，姓名有效即可
    if (name.trim().length > 0) inputStatusVal.value = 'valid'
    else inputStatusVal.value = 'invalid'
  }
  else if (phoneInputted && !nameInputted) {
    // 只有电话，电话有效即可
    if (/^(1[3-9]\d{9}|0\d{9,10})$/.test(phone)) inputStatusVal.value = 'valid'
    else inputStatusVal.value = 'invalid'
  }
}

const inputStatus = computed(() => inputStatusVal.value)

const statusText = computed(() => {
  const { name, phone } = form.value
  const nameInputted = name && name.trim().length > 0
  const phoneInputted = phone && phone.trim().length > 0
  const nameOk = name && name.trim().length > 0
  const phoneOk = phone && /^(1[3-9]\d{9}|0\d{9,10})$/.test(phone)
  
  if (nameInputted && phoneInputted) {
    if (nameOk && phoneOk) return '✓ 姓名和手机号都有效，可以签到'
    if (!nameOk && !phoneOk) return '✗ 姓名和手机号都不符合要求'
    if (!nameOk) return '✗ 姓名不符合要求'
    if (!phoneOk) return '✗ 手机号格式错误'
  }
  
  if (nameInputted && !phoneInputted) {
    if (nameOk) return '✓ 姓名有效，可以签到'
    return '✗ 姓名不符合要求'
  }
  
  if (phoneInputted && !nameInputted) {
    if (phoneOk) return '✓ 手机号有效，可以签到'
    return '✗ 手机号格式错误（中国：13-19开头11位；日本：0开头10-11位）'
  }
  
  return '请输入姓名或手机号（至少选一个）'
})

const fetchCompanies = async (q = '') => {
  try {
    companyLoading.value = true
    const { data } = await api.get('/api/public/companies', { params: { q } })
    companies.value = data
    if (companyCode.value) {
      const found = companies.value.find(c => c.code === companyCode.value)
      if (found) companyName.value = found.name
      else {
        try {
          const { data: d } = await api.get('/api/public/company', { params: { code: companyCode.value } })
          companyName.value = d.name
        } catch {
          companyName.value = ''
        }
      }
    } else {
      companyName.value = ''
    }
  } catch (err) {
    console.error('fetchCompanies failed', err)
    ElMessage.error('获取教会列表失败')
  } finally {
    companyLoading.value = false
  }
}

const onCompanyChange = (code) => {
  companyCode.value = code
  const found = companies.value.find(c => c.code === code)
  companyName.value = found ? found.name : ''
  // 更新 URL 不刷新页面
  const params = new URLSearchParams(location.search)
  if (code) params.set('company', code)
  else params.delete('company')
  history.replaceState(null, '', location.pathname + (params.toString() ? ('?' + params.toString()) : ''))
}

onMounted(async () => {
  await fetchCompanies()
  // 如果URL中有company参数，自动选中该公司
  if (initialCompany) {
    companyCode.value = initialCompany
    const found = companies.value.find(c => c.code === initialCompany)
    if (found) {
      companyName.value = found.name
    } else {
      // 尝试从后端获取该公司信息
      try {
        const { data } = await api.get('/api/public/company', { params: { code: initialCompany } })
        companyName.value = data.name
      } catch (err) {
        console.error('获取公司信息失败', err)
      }
    }
  }
})

const onSubmit = () => {
  const { name, phone } = form.value
  const nameInputted = name && name.trim().length > 0
  const phoneInputted = phone && phone.trim().length > 0
  
  if (!nameInputted && !phoneInputted) {
    ElMessage.warning('请输入姓名或手机号')
    return
  }
  
  if (phoneInputted && !/^(1[3-9]\d{9}|0\d{9,10})$/.test(phone)) {
    ElMessage.warning('手机号格式不正确（中国：11位，开头13-19；日本：10-11位，开头0）')
    return
  }
  
  if (!companyCode.value) {
    ElMessage.warning('请先选择公司')
    return
  }

  loading.value = true
  api.post('/api/public/sign', {
    companyCode: companyCode.value,
    name: form.value.name.trim(),
    phone: form.value.phone.trim()
  })
    .then(() => {
      ElMessage.success('签到成功')
      form.value.name = ''
      form.value.phone = ''
      inputStatusVal.value = 'empty'
    })
    .catch(e => {
      const resp = e?.response?.data
      if (resp?.code === 'MULTIPLE_EMPLOYEES') {
        // 多个员工匹配
        multipleEmployees.value = resp.employees || []
        selectedPhoneForMultiple.value = form.value.phone.trim()
        showSelectDialog.value = true
      } else if (resp?.code === 'NOT_MATCH') {
        let errorMsg = '未找到员工'
        if (resp.nameError && resp.phoneError) {
          errorMsg = '姓名和手机号都不匹配'
        } else if (resp.nameError) {
          errorMsg = '该姓名不存在'
        } else if (resp.phoneError) {
          errorMsg = '该手机号不存在'
        }
        ElMessageBox.confirm(errorMsg + '，是否登记新员工？', '提示', {
          confirmButtonText: '登记',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 将当前输入的姓名和手机号带到登记页，方便用户无需重复输入
          const params = new URLSearchParams({ company: companyCode.value })
          if (form.value.name) params.set('name', form.value.name.trim())
          if (form.value.phone) params.set('phone', form.value.phone.trim())
          location.href = '/register?' + params.toString()
        })
      } else if (resp?.code === 'SIGNED') {
        ElMessage.warning('今日已签到')
      } else if (resp?.code === 'MISSING_COMPANY' || resp?.code === 'INVALID_COMPANY') {
        ElMessage.error(resp?.msg || '公司信息有误，无法签到')
      } else {
        ElMessage.error(resp?.msg || '签到失败')
      }
    })
    .finally(() => (loading.value = false))
}

const selectEmployee = async (employee) => {
  try {
    showSelectDialog.value = false
    loading.value = true
    
    // 使用选中的员工名字重新提交签到
    const response = await api.post('/api/public/sign', {
      companyCode: companyCode.value,
      name: employee.name,
      phone: selectedPhoneForMultiple.value
    })
    
    ElMessage.success('签到成功')
    form.value.name = ''
    form.value.phone = ''
    inputStatusVal.value = 'empty'
    multipleEmployees.value = []
  } catch (e) {
    const resp = e?.response?.data
    if (resp?.code === 'SIGNED') {
      ElMessage.warning('今日已签到')
    } else {
      ElMessage.error(resp?.msg || '签到失败')
    }
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.sign-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.box {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 32px 24px;
  box-sizing: border-box;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.5px;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
}

.company-select-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 24px;
}

.select-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  display: block;
}

.company-select {
  width: 100%;
}

.refresh-btn {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  font-size: 20px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: #409eff;
  border-color: #409eff;
  transform: rotate(180deg);
}

.form-content {
  margin: 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.label-icon {
  font-size: 18px;
}

.optional-tag {
  font-size: 11px;
  color: #95a5a6;
  font-weight: 400;
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: auto;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field {
  width: 100%;
  padding: 14px 40px 14px 16px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: 500;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-field::placeholder {
  color: #adb5bd;
  font-weight: 400;
}

.clear-btn {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dee2e6;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  user-select: none;
}

.clear-btn:hover {
  background: #adb5bd;
  color: white;
}

.clear-btn:active {
  transform: scale(0.9);
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-sizing: border-box;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  background: linear-gradient(135deg, #adb5bd 0%, #95a5a6 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.submit-btn.loading {
  position: relative;
  pointer-events: none;
}

.loading-spinner {
  display: inline-block;
  font-size: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  font-weight: bold;
}

.status-icon.invalid {
  background: rgba(231, 76, 60, 0.3);
}

.btn-text {
  font-size: 16px;
}

.tip {
  text-align: center;
  font-size: 13px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: #f8f9fa;
  color: #6c757d;
  line-height: 1.5;
  min-height: 20px;
  transition: all 0.3s ease;
}

.tip.valid {
  background: #d1f2eb;
  color: #0a6847;
  font-weight: 500;
}

.tip.invalid {
  background: #f8d7da;
  color: #c92a3a;
  font-weight: 500;
}

.footer-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #f1f3f5;
}

.church-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: white;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
  transition: all 0.3s ease;
}

.church-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(243, 156, 18, 0.5);
}

.church-link:active {
  transform: translateY(0);
}

.link-icon {
  font-size: 16px;
}

/* 多人选择对话框样式 */
.select-dialog :deep(.el-dialog) {
  border-radius: 16px;
  max-width: 450px;
}

.select-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 2px solid #f1f3f5;
}

.select-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.select-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.select-dialog-hint {
  margin: 0 0 16px;
  color: #6c757d;
  font-size: 14px;
  line-height: 1.6;
}

.employee-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.employee-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-family: inherit;
  gap: 8px;
}

.employee-option:hover {
  background: #e7f3ff;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateX(4px);
}

.employee-option:active {
  transform: scale(0.98);
}

.emp-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.emp-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.emp-name {
  font-weight: 700;
  font-size: 16px;
  color: #2c3e50;
  flex: 1;
}

.emp-info {
  font-size: 13px;
  color: #6c757d;
  padding-left: 46px;
}

/* 响应式设计 */

/* 平板设备 (768px - 1023px) */
@media (max-width: 1023px) and (min-width: 768px) {
  .sign-container {
    padding: 16px;
  }

  .box {
    padding: 28px 20px;
  }

  .page-title {
    font-size: 24px;
  }
}

/* 手机设备 (max-width: 767px) */
@media (max-width: 767px) {
  .sign-container {
    padding: 0;
    background: white;
    align-items: flex-start;
  }

  .box {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
    padding: 24px 20px;
    min-height: 100vh;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .company-select-row {
    margin-bottom: 20px;
    gap: 10px;
  }

  .select-label {
    font-size: 13px;
  }

  .refresh-btn {
    width: 44px;
    height: 44px;
  }

  .field-label {
    font-size: 14px;
  }

  .label-icon {
    font-size: 16px;
  }

  .optional-tag {
    font-size: 10px;
  }

  .input-field {
    padding: 12px 36px 12px 14px;
    font-size: 16px;
    border-radius: 10px;
  }

  .clear-btn {
    right: 10px;
    width: 22px;
    height: 22px;
    font-size: 12px;
  }

  .submit-btn {
    padding: 14px;
    font-size: 16px;
    border-radius: 10px;
  }

  .btn-text {
    font-size: 15px;
  }

  .tip {
    font-size: 12px;
    padding: 10px;
  }

  .church-link {
    font-size: 13px;
    padding: 10px 20px;
  }

  /* 对话框样式调整 */
  .select-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }

  .emp-avatar {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .emp-name {
    font-size: 15px;
  }

  .emp-info {
    font-size: 12px;
    padding-left: 42px;
  }
}

/* 小手机设备 (max-width: 375px) */
@media (max-width: 375px) {
  .box {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .company-select-row {
    margin-bottom: 16px;
  }

  .refresh-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .input-field {
    padding: 11px 34px 11px 12px;
    font-size: 15px;
  }

  .submit-btn {
    padding: 13px;
    font-size: 15px;
  }

  .tip {
    font-size: 11px;
    padding: 8px;
  }

  .church-link {
    font-size: 12px;
    padding: 9px 18px;
  }

  .link-icon {
    font-size: 14px;
  }
}

/* 横屏手机优化 */
@media (max-height: 600px) and (max-width: 767px) and (orientation: landscape) {
  .sign-container {
    align-items: flex-start;
    padding: 12px;
  }

  .box {
    min-height: auto;
    padding: 16px;
  }

  .page-header {
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .page-subtitle {
    font-size: 11px;
  }

  .company-select-row {
    margin-bottom: 12px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .input-field {
    padding: 10px 32px 10px 12px;
  }

  .submit-btn {
    padding: 11px;
  }

  .tip {
    margin-top: 12px;
    padding: 8px;
  }

  .footer-link {
    margin-top: 16px;
    padding-top: 12px;
  }
}

/* iOS Safari 特定优化 */
@supports (-webkit-touch-callout: none) {
  .input-field,
  .submit-btn {
    -webkit-appearance: none;
    appearance: none;
  }

  .input-field:focus {
    font-size: 16px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .submit-btn:hover {
    transform: none;
  }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .church-link:hover {
    transform: none;
  }

  .church-link:active {
    transform: scale(0.97);
  }

  .employee-option:hover {
    transform: none;
  }

  .employee-option:active {
    transform: scale(0.98);
  }
}
</style>
