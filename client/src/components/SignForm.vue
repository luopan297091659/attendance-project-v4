<template>
  <el-card class="box">
    <h2>{{ companyName ? companyName + ' - 签到' : '扫码签到' }}</h2>

    <!-- 公司选择：允许切换公司或从链接自动预选 -->
    <div class="company-select-row">
      <el-select v-model="companyCode" placeholder="请选择公司" filterable clearable @change="onCompanyChange" class="company-select">
        <el-option v-for="c in companies" :key="c.code" :label="c.name + ' ('+c.code+')'" :value="c.code" />
      </el-select>
      <el-button type="text" icon="el-icon-refresh" @click="fetchCompanies" class="refresh-btn">刷新</el-button>
    </div>

    <div class="form-content">
      <div class="form-group">
        <label>姓名（选填）</label>
        <input 
          v-model="form.name" 
          type="text"
          placeholder="请输入姓名"
          class="input-field"
          @input="updateStatus"
        />
      </div>

      <div class="form-group">
        <label>手机号（选填）</label>
        <input 
          v-model="form.phone" 
          type="text"
          placeholder="请输入手机号"
          class="input-field"
          @input="updateStatus"
        />
      </div>

      <button @click="onSubmit" :disabled="loading || !companyCode || inputStatus === 'invalid'" class="submit-btn">
        <span v-if="inputStatus === 'valid'" class="status-light valid"></span>
        <span v-else-if="inputStatus === 'invalid'" class="status-light invalid"></span>
        <span v-else class="status-light empty"></span>
        {{ loading ? '签到中...' : (!companyCode ? '缺少公司信息' : '签到') }}
      </button>
    </div>

    <div class="tip">{{ statusText }}</div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const form = ref({ name: '', phone: '' })
const loading = ref(false)
const inputStatusVal = ref('empty')
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
    const phoneOk = /^1[3-9]\d{9}$/.test(phone)
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
    if (/^1[3-9]\d{9}$/.test(phone)) inputStatusVal.value = 'valid'
    else inputStatusVal.value = 'invalid'
  }
}

const inputStatus = computed(() => inputStatusVal.value)

const statusText = computed(() => {
  const { name, phone } = form.value
  const nameInputted = name && name.trim().length > 0
  const phoneInputted = phone && phone.trim().length > 0
  const nameOk = name && name.trim().length > 0
  const phoneOk = phone && /^1[3-9]\d{9}$/.test(phone)
  
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
    return '✗ 手机号格式错误（格式：13-19开头的11位数字）'
  }
  
  return '请输入姓名或手机号（至少选一个）'
})

const fetchCompanies = async (q = '') => {
  try {
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
    ElMessage.error('获取公司列表失败')
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
  
  if (phoneInputted && !/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.warning('手机号格式不正确（11位数字，开头13-19）')
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
      if (resp?.code === 'NOT_MATCH') {
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
</script>

<style scoped>
.box {
  max-width: 500px;
  margin: 40px auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 20px;
}

.form-content {
  margin: 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.input-field {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.input-field::placeholder {
  color: #a8abb2;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.submit-btn:disabled {
  background-color: #a8abb2;
  cursor: not-allowed;
}

.status-light {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
  vertical-align: middle;
  flex-shrink: 0;
}

.status-light.valid {
  background-color: #67c23a;
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.6);
}

.status-light.invalid {
  background-color: #f56c6c;
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.6);
}

.status-light.empty {
  background-color: #909399;
  opacity: 0.5;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.company-select-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.company-select {
  min-width: 260px;
  max-width: 420px;
  flex: 1;
}

.refresh-btn {
  color: #409eff;
  flex-shrink: 0;
}

.tip {
  text-align: center;
  color: #606266;
  font-size: 12px;
  margin-top: 12px;
  height: 16px;
  min-height: 16px;
}

@media (max-width: 768px) {
  .box {
    border-radius: 8px;
  }

  .box h2 {
    font-size: 18px;
    text-align: center;
    margin: 0 0 16px 0;
  }

  .company-select-row {
    gap: 8px;
    margin-bottom: 12px;
  }

  .company-select {
    min-width: 140px;
    max-width: 100%;
    flex: 1;
  }

  .form-content {
    gap: 12px;
  }

  .form-group {
    gap: 6px;
  }

  .form-group label {
    font-size: 14px;
  }

  .input-field {
    padding: 8px 12px;
    font-size: 16px;
  }

  .submit-btn {
    padding: 10px 16px;
    font-size: 16px;
    border-radius: 6px;
  }

  .status-light {
    width: 10px;
    height: 10px;
  }

  .tip {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .box {
    border-radius: 0;
    padding: 12px;
  }

  .box h2 {
    font-size: 16px;
    margin: 0 0 12px 0;
  }

  .company-select-row {
    gap: 6px;
    margin-bottom: 12px;
  }

  .company-select {
    min-width: 100px;
    max-width: 100%;
  }

  .refresh-btn {
    padding: 6px 8px;
    font-size: 12px;
  }

  .form-content {
    gap: 10px;
  }

  .form-group {
    gap: 4px;
  }

  .form-group label {
    font-size: 13px;
  }

  .input-field {
    padding: 6px 10px;
    font-size: 16px;
    border-radius: 4px;
  }

  .submit-btn {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 4px;
    width: 100%;
    gap: 4px;
  }

  .status-light {
    width: 8px;
    height: 8px;
  }

  .tip {
    font-size: 10px;
    margin-top: 8px;
  }
}
</style>
