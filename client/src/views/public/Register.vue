<template>
  <div class="register-container">
    <el-card class="register-box">
      <div class="header-row">
        <div class="title-row">
          <h2 class="title">{{ companyName }} - 员工登记</h2>
          <p class="subtitle">填写基本信息完成登记，登记后可直接返回签到</p>
        </div>
        <div class="avatar-preview">
          <div class="avatar">{{ initials }}</div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="register-form"
        @submit.prevent="submitForm"
      >
        <el-form-item label="姓名" prop="name">
          <el-input
            ref="nameInput"
            v-model="form.name"
            placeholder="请输入姓名"
            maxlength="50"
            clearable
            @keyup.enter="submitForm"
          />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别" clearable>
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="年龄" prop="age">
          <el-input-number
            v-model="form.age"
            :min="5"
            :max="100"
            placeholder="请输入年龄"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            maxlength="13"
            clearable
            @keyup.enter="submitForm"
          />
        </el-form-item>

        <el-form-item label="住址" prop="address">
          <el-input
            v-model="form.address"
            placeholder="请输入住址"
            maxlength="255"
            type="textarea"
            :rows="3"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="autoSign">登记后自动签到</el-checkbox>
        </el-form-item>

        <div class="button-group">
          <el-button type="primary" @click="submitForm" :loading="loading" size="large">
            立即登记
          </el-button>
          <el-button @click="backToSign" size="large">返回签到</el-button>
        </div>
      </el-form>

      <div class="tip-text">
        <p>✓ 填写完整信息有助于统计与管理</p>
        <p>✓ 支持回车提交（在姓名或手机号输入框按 Enter）</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'

const formRef = ref(null)
const nameInput = ref(null)
const loading = ref(false)
const autoSign = ref(true)
const companyCode = new URLSearchParams(location.search).get('company')
const companyName = ref('公司')

const form = ref({
  name: '',
  gender: '',
  age: null,
  phone: '',
  address: ''
})

const initials = computed(() => {
  const n = form.value.name.trim()
  if (!n) return '员工'
  return n.split(' ').map(s=>s[0]).join('').slice(0,2)
})

const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度2-50个字符', trigger: 'blur' }
  ],
  // 性别为选填
  gender: [],
  // 年龄为选填，但若填写必须在 18-70
  age: [
    {
      validator: (rule, value, callback) => {
        if (value !== null && value !== undefined && value !== '') {
          if (isNaN(value)) return callback(new Error('年龄必须为数字'))
          if (value < 5 || value > 100) return callback(new Error('年龄应在5-100岁之间'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
    //   pattern: /^1[3-9]\d{9}$/,
      pattern: /^(\+\d{1,4})?((1[3-9]\d{9})|(0?[7-9]\d{9})|([2-9]\d{7,14}))$/,
      message: '手机号格式错误',
      trigger: 'blur'
    }
  ],
  // 住址为选填
  address: [
    { max: 255, message: '住址长度不能超过255个字符', trigger: 'blur' }
  ]
} 

onMounted(async () => {
  // 从 URL 参数中读取预填信息（如果有）
  const params = new URLSearchParams(location.search)
  const preName = params.get('name') || ''
  const prePhone = params.get('phone') || ''
  if (preName) form.value.name = decodeURIComponent(preName)
  if (prePhone) form.value.phone = decodeURIComponent(prePhone)

  if (companyCode) {
    try {
      const { data } = await api.get('/api/public/company', { params: { code: companyCode } })
      companyName.value = data.name
    } catch (e) {
      ElMessage.error('公司代码无效')
      setTimeout(() => {
        location.href = '/'
      }, 2000)
    }
  }

  // autofocus name input if empty, else move focus to phone
  setTimeout(() => {
    if (!form.value.name) nameInput.value?.focus && nameInput.value.focus()
    else {
      // try to focus phone input
      const phoneEl = document.querySelector('input[placeholder="请输入手机号"]')
      phoneEl && phoneEl.focus()
    }
  }, 50)
})

const submitForm = async () => {
  try {
    await formRef.value.validate()

    if (!companyCode) {
      ElMessage.error('公司代码缺失')
      return
    }

    loading.value = true
    const { data } = await api.post('/api/public/register', {
      companyCode,
      name: form.value.name.trim(),
      gender: form.value.gender,
      age: form.value.age,
      phone: form.value.phone.trim(),
      address: form.value.address.trim()
    })

    // 如果用户选择自动签到，则发起签到请求
    if (autoSign.value) {
      try {
        await api.post('/api/public/sign', {
          companyCode,
          name: form.value.name.trim(),
          phone: form.value.phone.trim()
        })
        ElMessage.success('登记并签到成功')
      } catch (signErr) {
        // 登记成功但签到失败（比如已签到），通知用户
        const code = signErr?.response?.data?.code
        if (code === 'SIGNED') ElMessage.warning('登记成功，但今天已签到')
        else if (code === 'NOT_MATCH') ElMessage.warning('登记成功，但自动签到失败：信息未匹配')
        else ElMessage.warning('登记成功，但自动签到失败')
      }
    } else {
      ElMessage.success('登记成功')
    }

    // 返回签到页
    setTimeout(() => {
      location.href = '/?company=' + companyCode
    }, 900)

  } catch (e) {
    if (e.response?.status === 400) {
      ElMessage.error(e.response?.data?.msg || '登记失败：信息有误')
    } else {
      ElMessage.error('登记失败，请重试')
    }
    console.error(e)
  } finally {
    loading.value = false
  }
}

const backToSign = () => {
  location.href = '/?company=' + companyCode
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-box {
  width: 100%;
  max-width: 680px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  border-radius: 12px;
  padding: 22px 28px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.title-row .title {
  margin: 0;
  font-size: 24px;
  color: #1f2d3d;
  font-weight: 700;
}

.subtitle {
  margin: 6px 0 0 0;
  color: #666;
  font-size: 13px;
}

.avatar-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 6px 18px rgba(102, 166, 255, 0.28);
}

.register-form {
  margin: 20px 0 10px 0;
}

@media (max-width: 768px) {
  .register-container {
    padding: 12px;
  }

  .register-box {
    padding: 16px;
    border-radius: 8px;
  }

  .header-row {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .title {
    font-size: 18px;
  }

  .subtitle {
    font-size: 13px;
  }

  .avatar {
    width: 56px;
    height: 56px;
    font-size: 18px;
  }

  :deep(.el-form) {
    --el-form-label-width: 80px;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
  }

  .button-group {
    flex-direction: column;
    gap: 8px;
  }

  .button-group :deep(.el-button) {
    width: 100%;
  }

  .tip-text {
    padding: 10px 12px;
    font-size: 12px;
  }

  .tip-text p {
    margin: 4px 0;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 0;
    background: #f5f7fa;
  }

  .register-box {
    border-radius: 0;
    padding: 12px;
    margin: 0;
  }

  .header-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .title {
    font-size: 16px;
    margin: 0;
  }

  .subtitle {
    display: none;
  }

  .avatar {
    width: 48px;
    height: 48px;
    font-size: 16px;
    flex-shrink: 0;
  }

  :deep(.el-form) {
    --el-form-label-width: 70px;
  }

  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }

  :deep(.el-input) {
    font-size: 14px;
  }

  :deep(.el-input__inner) {
    padding: 6px 8px !important;
  }

  :deep(.el-textarea__inner) {
    padding: 6px 8px !important;
    font-size: 14px;
  }

  .button-group {
    margin-top: 16px;
  }

  .button-group :deep(.el-button) {
    height: 36px;
    font-size: 14px;
  }

  .tip-text {
    padding: 8px 10px;
    margin-top: 12px;
  }

  .tip-text p {
    margin: 3px 0;
    font-size: 11px;
  }
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.button-group :deep(.el-button) {
  flex: 1;
}

.tip-text {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
  padding: 12px 15px;
  border-radius: 4px;
  margin-top: 18px;
}

.tip-text p {
  margin: 6px 0;
  color: #606266;
  font-size: 13px;
}

:deep(.el-input__wrapper) {
  background-color: #f5f7fa;
}

:deep(.el-input__wrapper:hover) {
  background-color: #f9fafb;
}

/* 强制显示 Element 输入组件的内部输入框（解决样式或主题缺失导致输入框不可见的问题） */
:deep(.el-input__inner), :deep(.el-textarea__inner), :deep(.el-input-number__input) {
  background: #fff !important;
  border: 1px solid #dcdfe6 !important;
  color: #1f2d3d !important;
  padding: 8px 10px !important;
  box-shadow: none !important;
}

:deep(.el-select), :deep(.el-select .el-input__inner) {
  min-width: 200px;
  background: #fff !important;
  border: 1px solid #dcdfe6 !important;
}

:deep(.el-select .el-input__inner) {
  padding: 6px 12px !important;
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}

:deep(.el-input__inner::placeholder), :deep(.el-textarea__inner::placeholder) {
  color: #9aa0a6 !important;
}
</style>