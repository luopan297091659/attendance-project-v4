<template>
  <div class="admin-dashboard">
    <!-- 顶部导航栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-container">
        <div class="left-section">
          <h2 class="dashboard-title">📊 管理控制台</h2>
          <div class="church-selector">
            <span class="label">当前教会：</span>
            <el-select v-model="currentChurchId" @change="switchChurch" size="large" class="church-select">
              <el-option v-for="church in churches" :key="church.id" :label="church.name" :value="church.id">
                <span style="float: left">{{ church.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ church.code }}</span>
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="right-section">
          <div class="admin-info">
            <el-avatar :size="32" class="admin-avatar">
              <span class="icon-emoji">👤</span>
            </el-avatar>
            <div class="admin-text">
              <div class="admin-name">{{ adminUsername }}</div>
              <div class="admin-role">{{ isSuper ? '超级管理员' : '普通管理员' }}</div>
            </div>
          </div>
          <el-divider direction="vertical" style="height: 40px" />
          <el-button @click="loadStats" :loading="loading" :icon="RefreshIcon" class="icon-btn">刷新</el-button>
          <el-button type="primary" @click="showQRCode" class="icon-btn">
            <span class="icon-emoji">📱</span>
            <span>签到二维码</span>
          </el-button>
          <el-button @click="changePasswordVisible = true" class="icon-btn">
            <span class="icon-emoji">🔑</span>
            <span>修改密码</span>
          </el-button>
          <el-button @click="logout" class="icon-btn">
            <span class="icon-emoji">🚪</span>
            <span>退出登录</span>
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 二维码对话框 -->
    <el-dialog v-model="qrcodeVisible" width="500px" align-center>
      <template #header>
        <span class="dialog-title"><span class="icon-emoji">📱</span> 签到二维码</span>
      </template>
      <div class="qrcode-content">
        <div ref="qrcodeContainer" class="qrcode-container"></div>
        <div class="qrcode-info">
          <p class="church-code">教会代码: <strong>{{ currentChurchCode }}</strong></p>
          <div class="qrcode-url">
            <el-input 
              v-model="qrcodeUrl" 
              readonly 
              size="small"
            >
              <template #append>
                <el-button @click="copyUrl">复制链接</el-button>
              </template>
            </el-input>
          </div>
          <p class="tip"><span class="icon-emoji">👆</span> 成员可扫描此二维码或访问上方链接进行签到</p>
          <el-button type="primary" @click="downloadQRCode" plain>
            <span class="icon-emoji">💾</span>
            <span>下载二维码</span>
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="changePasswordVisible" title="🔑 修改密码" width="450px" align-center>
      <el-form :model="passwordForm" label-width="100px" @submit.prevent="submitChangePassword">
        <el-form-item label="旧密码" required>
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChangePassword" :loading="passwordChanging">确认修改</el-button>
      </template>
    </el-dialog>



    <!-- 选项卡 -->
    <el-tabs v-model="activeTab" class="dashboard-tabs">
      <el-tab-pane name="today">
        <template #label>
          <span class="tab-label"><span class="icon-emoji">📅</span> 今日签到</span>
        </template>
        
        <!-- 统计信息卡片 -->
        <StatsCard :total="total" :signed="todaySigned" :absent="absent.length" :loading="loading" />

        <!-- 签到情况和趋势图 -->
        <el-row :gutter="20" class="content-row">
          <el-col :xs="24" :sm="24" :md="14" :lg="14">
            <el-card shadow="hover" class="data-card">
              <template #header>
                <div class="card-header">
                  <span class="card-title"><span class="icon-emoji">✅</span> 已签到 ({{ signed.length }})</span>
                  <div class="card-actions">
                    <el-date-picker
                      v-model="selectedDate"
                      type="date"
                      placeholder="选择日期"
                      size="small"
                      style="width: 150px;"
                      @change="onDateChange"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                    />
                    <el-input 
                      v-model="searchKeyword" 
                      placeholder="搜索姓名/手机号" 
                      clearable
                      style="width: 180px;"
                      size="small"
                    />
                    <el-button size="small" @click="exportToday">
                      <span class="icon-emoji">📥</span>
                      <span>导出</span>
                    </el-button>
                  </div>
                </div>
              </template>
              
              <div v-if="loading" class="loading-state">
                <el-skeleton :rows="5" animated />
              </div>
              
              <div v-else-if="filteredSigned.length === 0" class="empty-state">
                <el-empty description="暂无签到记录" />
              </div>
              
              <div v-else>
                <el-table :data="paginatedSigned" style="width: 100%" stripe>
                  <el-table-column prop="name" label="姓名" width="100"/>
                  <el-table-column prop="gender" label="性别" width="60" align="center"/>
                  <el-table-column prop="age" label="年龄" width="60" align="center"/>
                  <el-table-column prop="phone" label="手机号" width="130"/>
                  <el-table-column prop="address" label="住址" show-overflow-tooltip/>
                  <el-table-column label="签到时间" width="100">
                    <template #default="{ row }">
                      <span class="sign-time">{{ formatTime(row.signTime) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
                
                <div class="pagination-container">
                  <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="filteredSigned.length"
                    layout="total, sizes, prev, pager, next, jumper"
                    @current-change="handlePageChange"
                    @size-change="handleSizeChange"
                  />
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="24" :md="10" :lg="10">
            <el-card shadow="hover" class="data-card">
              <template #header>
                <div class="trend-header">
                  <span class="card-title"><span class="icon-emoji">📈</span> 签到趋势</span>
                  <div class="trend-controls">
                    <el-date-picker 
                      v-model="trendDateRange" 
                      type="daterange" 
                      range-separator="到"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      :editable="true"
                      size="small"
                      @change="onTrendDateChange"
                      style="width: 240px;"
                    />
                  </div>
                </div>
              </template>
              <div v-if="loading || trendLoading" class="loading-state">
                <el-skeleton :rows="5" animated />
              </div>
              <div v-else class="card-chart-wrapper">
                <ECharts :data="trendData" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane name="employees">
        <template #label>
          <span class="tab-label"><span class="icon-emoji">👥</span> 人员管理</span>
        </template>
        <employee-list ref="employeeListRef" />
      </el-tab-pane>

      <!-- 教会管理仅超级管理员可见 -->
      <el-tab-pane name="super" v-if="isSuper">
        <template #label>
          <span class="tab-label"><span class="icon-emoji">🔧</span> 超级管理</span>
        </template>
        <super-admin-panel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import api from '../../api'
import EmployeeList from '../../components/EmployeeList.vue'
import ChurchManagement from '../../components/ChurchManagement.vue'
import SuperAdminPanel from '../../components/SuperAdminPanel.vue'
import StatsCard from '../../components/StatsCard.vue'
import ECharts from '../../components/SignTrendChart.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import QRCode from 'qrcode'

const router = useRouter()

const activeTab = ref('today')
const loading = ref(false)
const employeeListRef = ref(null)

const signed = ref([])
const absent = ref([])
const total = ref(0)
const todaySigned = ref(0)
const trendData = ref({ days: [], series: [] })
const selectedDate = ref(new Date())
const trendDateRange = ref([dayjs().subtract(6, 'day').toDate(), dayjs().toDate()])
const trendLoading = ref(false)

const changePasswordVisible = ref(false)
const passwordChanging = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const churches = ref([])
const currentChurchId = ref(null)
const currentChurchCode = ref('')
const qrcodeVisible = ref(false)
const qrcodeContainer = ref(null)
const qrcodeUrl = ref('')
const searchKeyword = ref('')
const isSuper = ref(false)
const adminUsername = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 刷新图标组件（使用 emoji）
const RefreshIcon = {
  render() {
    return '🔄'
  }
}

// 计算属性：过滤后的签到列表
const filteredSigned = computed(() => {
  if (!searchKeyword.value) return signed.value
  const keyword = searchKeyword.value.toLowerCase()
  return signed.value.filter(item => 
    item.name?.toLowerCase().includes(keyword) || 
    item.phone?.includes(keyword)
  )
})

// 计算属性：分页后的签到列表
const paginatedSigned = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredSigned.value.slice(start, end)
})

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 监听搜索关键字变化，重置页码
watch(searchKeyword, () => {
  currentPage.value = 1
})

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 退出登录
const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    localStorage.removeItem('token')
    localStorage.removeItem('companyId')
    localStorage.removeItem('adminId')
    localStorage.removeItem('churches')
    ElMessage.success('已退出登录')
    router.push('/admin/login')
  } catch {
    // 用户取消
  }
}

// 提交修改密码
const submitChangePassword = async () => {
  // 验证输入
  if (!passwordForm.value.oldPassword) {
    ElMessage.error('请输入旧密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    ElMessage.error('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.error('新密码至少需要6位')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }
  if (passwordForm.value.oldPassword === passwordForm.value.newPassword) {
    ElMessage.error('新密码不能与旧密码相同')
    return
  }

  try {
    passwordChanging.value = true
    await api.post('/api/admin/change-password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    changePasswordVisible.value = false
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    // 跳转到登录页
    setTimeout(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('companyId')
      localStorage.removeItem('adminId')
      localStorage.removeItem('churches')
      router.push('/admin/login')
    }, 1000)
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '密码修改失败')
  } finally {
    passwordChanging.value = false
  }
}

// 加载教会列表
const loadChurches = async () => {
  try {
    const { data } = await api.get('/api/admin/churches')
    churches.value = data
    if (data.length > 0 && !currentChurchId.value) {
      currentChurchId.value = data[0].id
      currentChurchCode.value = data[0].code
    }
  } catch (e) {
    console.error('加载教会列表失败:', e)
    ElMessage.error('加载教会列表失败')
  }
}

// 切换教会
const switchChurch = async () => {
  try {
    loading.value = true
    const church = churches.value.find(c => c.id === currentChurchId.value)
    if (church) {
      currentChurchCode.value = church.code
      const { data } = await api.post('/api/admin/switch-church', { churchId: currentChurchId.value })
      api.defaults.headers.common['Authorization'] = data.token
      localStorage.setItem('token', data.token)
      localStorage.setItem('companyId', data.companyId)
      ElMessage.success(`已切换到 ${church.name}`)
      // 重新加载数据
      await loadStats()
      // 刷新人员列表
      if (employeeListRef.value && employeeListRef.value.fetch) {
        await employeeListRef.value.fetch()
      }
    }
  } catch (e) {
    ElMessage.error('切换失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 生成并显示二维码
const showQRCode = async () => {
  try {
    const { data } = await api.get('/api/admin/qrcode')
    qrcodeVisible.value = true
    qrcodeUrl.value = data.url || data.content

    // 延迟渲染，确保 DOM 已更新
    await new Promise(resolve => setTimeout(resolve, 100))

    // 清空容器
    if (qrcodeContainer.value) {
      qrcodeContainer.value.innerHTML = ''
      
      // 生成二维码
      await QRCode.toCanvas(document.createElement('canvas'), data.content, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(canvas => {
        qrcodeContainer.value.appendChild(canvas)
      })
    }
  } catch (e) {
    ElMessage.error('生成二维码失败')
    console.error(e)
  }
}

// 复制链接
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(qrcodeUrl.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (e) {
    // 降级方案
    const input = document.createElement('input')
    input.value = qrcodeUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    ElMessage.success('链接已复制到剪贴板')
  }
}

// 下载二维码
const downloadQRCode = () => {
  try {
    const canvas = qrcodeContainer.value?.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${currentChurchCode.value}-签到二维码.png`
      link.href = url
      link.click()
      ElMessage.success('下载成功')
    }
  } catch (e) {
    ElMessage.error('下载失败')
    console.error(e)
  }
}

// 导出今日签到数据
const exportToday = () => {
  try {
    if (filteredSigned.value.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    // 生成 CSV
    const headers = ['姓名', '性别', '年龄', '手机号', '住址', '签到时间']
    const rows = filteredSigned.value.map(item => [
      item.name,
      item.gender,
      item.age,
      item.phone,
      item.address,
      formatTime(item.signTime)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n')

    // 添加 BOM 以支持中文
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const today = new Date().toISOString().split('T')[0]
    link.download = `${currentChurchCode.value}-签到记录-${today}.csv`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
    console.error(e)
  }
}

// 加载签到数据（按选定日期）
const loadSignData = async () => {
  try {
    loading.value = true
    const dateStr = selectedDate.value ? 
      new Date(selectedDate.value).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
    
    const { data } = await api.get('/api/admin/today', {
      params: { date: dateStr }
    })
    signed.value = data.signed
    
    // 未签到数据始终使用今天的日期
    const today = new Date().toISOString().split('T')[0]
    const { data: todayData } = await api.get('/api/admin/today', {
      params: { date: today }
    })
    absent.value = todayData.absent
  } catch (e) {
    console.error('加载签到数据失败:', e)
    ElMessage.error('加载签到数据失败')
  } finally {
    loading.value = false
  }
}

// 加载统计卡片和趋势图数据
const loadStatsData = async (startDate = null, endDate = null) => {
  try {
    let url = '/api/admin/stats'
    if (startDate && endDate) {
      const start = dayjs(startDate).format('YYYY-MM-DD')
      const end = dayjs(endDate).format('YYYY-MM-DD')
      url += `?startDate=${start}&endDate=${end}`
    }
    
    const { data: stats } = await api.get(url)
    total.value = stats.totalEmployees
    todaySigned.value = stats.todaySigned
    trendData.value = {
      days: stats.days,
      series: stats.series
    }
  } catch (e) {
    console.error('加载统计数据失败:', e)
    ElMessage.error('加载统计数据失败')
  }
}

// 加载所有数据（统计+签到）
const loadStats = async () => {
  loading.value = true
  await Promise.all([
    loadSignData(),
    loadStatsData()
  ])
  loading.value = false
}

// 日期改变时只重新加载签到数据
const onDateChange = () => {
  loadSignData()
}

// 趋势图时间范围变化
const onTrendDateChange = () => {
  if (trendDateRange.value && trendDateRange.value.length === 2) {
    trendLoading.value = true
    loadStatsData(trendDateRange.value[0], trendDateRange.value[1]).finally(() => {
      trendLoading.value = false
    })
  }
}

onMounted(async () => {
  // 从 localStorage 恢复 companyId 和 isSuper
  const savedCompanyId = localStorage.getItem('companyId')
  if (savedCompanyId) {
    currentChurchId.value = parseInt(savedCompanyId)
  }

  // 检查是否是超级管理员
  const savedIsSuper = localStorage.getItem('isSuper')
  isSuper.value = savedIsSuper === 'true'

  // 获取管理员用户名
  adminUsername.value = localStorage.getItem('adminUsername') || '管理员'

  await loadChurches()
  await loadStats()
  
  // 自动刷新数据（每30秒）
  setInterval(() => {
    if (activeTab.value === 'today') {
      loadStats()
    }
  }, 30000)
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

/* 头部样式 */
.header-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.dashboard-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.church-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.church-selector .label {
  color: #606266;
  font-weight: 500;
  flex-shrink: 0;
}

.church-select {
  min-width: 150px;
  flex-shrink: 0;
}

.right-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-avatar {
  background-color: #409eff !important;
  flex-shrink: 0;
}

.admin-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.admin-role {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
}

/* 统一图标样式 */
.icon-emoji {
  display: inline-block;
  font-size: 16px;
  line-height: 1;
  vertical-align: middle;
  margin-right: 4px;
}

/* 统一按钮样式 */
.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.icon-btn .icon-emoji {
  margin-right: 0;
}

/* 对话框标题 */
.dialog-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.dialog-title .icon-emoji {
  font-size: 20px;
}

/* 标签页样式 */
.dashboard-tabs {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tab-label {
  font-size: 15px;
  font-weight: 500;
}

/* 内容区域 */
.content-row {
  margin-top: 20px;
}

.data-card {
  border-radius: 12px;
  margin-bottom: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sign-time {
  color: #67c23a;
  font-weight: 500;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

/* 分页容器样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px 0;
}

/* 二维码对话框样式 */
.qrcode-content {
  text-align: center;
  padding: 20px;
}

.qrcode-container {
  display: inline-block;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.qrcode-info {
  margin-top: 24px;
}

.qrcode-url {
  margin: 16px 0;
}

.church-code {
  font-size: 16px;
  color: #606266;
  margin: 12px 0;
}

.church-code strong {
  color: #409eff;
  font-size: 20px;
}

.tip {
  font-size: 14px;
  color: #909399;
  margin: 8px 0 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 12px;
  }

  .header-card {
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .header-container {
    flex-direction: column;
    gap: 12px;
  }

  .left-section {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .dashboard-title {
    font-size: 20px;
  }

  .church-selector {
    width: 100%;
  }

  .church-select {
    width: 100%;
  }

  .right-section {
    flex-direction: row;
    gap: 8px;
    width: 100%;
    flex-wrap: wrap;
  }

  .admin-info {
    min-width: 120px;
  }

  .admin-name {
    font-size: 13px;
  }

  .admin-role {
    font-size: 11px;
  }

  .icon-btn {
    font-size: 13px;
    padding: 6px 8px;
  }

  .dashboard-tabs {
    padding: 12px;
  }

  .tab-label {
    font-size: 14px;
  }

  .content-row {
    margin-top: 12px;
  }

  .data-card {
    margin-bottom: 12px;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
  }

  .card-title {
    font-size: 15px;
  }

  .card-actions {
    flex-direction: column;
    gap: 8px;
  }

  .card-actions .el-input {
    width: 100%;
  }

  .card-actions .el-button {
    width: 100%;
  }

  :deep(.el-table) {
    font-size: 13px;
  }

  :deep(.el-table__header th) {
    padding: 8px 4px;
  }

  :deep(.el-table__body td) {
    padding: 8px 4px;
  }

  .sign-time {
    font-size: 12px;
  }

  .qrcode-container {
    max-width: 100%;
  }

  .church-code {
    font-size: 14px;
  }

  .church-code strong {
    font-size: 18px;
  }

  .tip {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .admin-dashboard {
    padding: 0;
    background: #f5f7fa;
  }

  .header-card {
    border-radius: 0;
    margin-bottom: 12px;
  }

  .header-container {
    flex-direction: column;
    gap: 8px;
  }

  .left-section {
    flex-direction: column;
    gap: 8px;
  }

  .dashboard-title {
    font-size: 18px;
    margin: 0;
  }

  .church-selector {
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
  }

  .church-selector .label {
    font-size: 13px;
    flex-shrink: 0;
  }

  .church-select {
    min-width: 120px;
    font-size: 14px;
    flex-shrink: 0;
  }

  .right-section {
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .admin-info {
    width: 100%;
    padding: 8px;
    background: #f9f9f9;
    border-radius: 4px;
  }

  :deep(.el-avatar) {
    width: 28px !important;
    height: 28px !important;
    font-size: 12px;
  }

  .admin-name {
    font-size: 12px;
  }

  .admin-role {
    font-size: 10px;
  }

  :deep(.el-divider--vertical) {
    display: none;
  }

  .icon-btn {
    font-size: 12px;
    padding: 4px 6px;
    width: 100%;
  }

  .icon-emoji {
    font-size: 14px;
  }

  .dashboard-tabs {
    padding: 8px;
    border-radius: 0;
  }

  .tab-label {
    font-size: 13px;
  }

  .tab-label .icon-emoji {
    font-size: 14px;
    margin-right: 2px;
  }

  .content-row {
    margin-top: 8px;
  }

  .data-card {
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .card-header {
    flex-direction: column;
    gap: 6px;
  }

  .card-title {
    font-size: 14px;
  }

  .card-title .icon-emoji {
    font-size: 15px;
  }

  .card-actions {
    flex-direction: column;
    gap: 6px;
  }

  .card-actions .el-input {
    width: 100%;
    font-size: 13px;
  }

  .card-actions .el-button {
    width: 100%;
    font-size: 12px;
    padding: 4px 6px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table__header th) {
    padding: 6px 2px;
  }

  :deep(.el-table__body td) {
    padding: 6px 2px;
  }

  :deep(.el-pagination) {
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }

  .sign-time {
    font-size: 11px;
  }

  :deep(.el-dialog) {
    width: 95% !important;
  }

  :deep(.el-dialog__header) {
    padding: 12px;
  }

  :deep(.el-dialog__body) {
    padding: 12px;
  }

  .qrcode-content {
    padding: 12px;
  }

  .qrcode-container {
    padding: 12px;
  }

  .qrcode-container canvas {
    max-width: 100%;
    height: auto;
  }

  .qrcode-info {
    margin-top: 16px;
  }

  .church-code {
    font-size: 13px;
  }

  .church-code strong {
    font-size: 16px;
  }

  .qrcode-url {
    margin: 12px 0;
  }

  .qrcode-url :deep(.el-input) {
    font-size: 12px;
  }

  .tip {
    font-size: 11px;
    margin: 6px 0 12px;
  }
}

/* 趋势图头部和控制按钮 */
.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.trend-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card-chart-wrapper {
  width: 100%;
  height: 250px;
}

/* 全屏趋势图容器 */
.fullscreen-trend-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
  box-sizing: border-box;
}

.fullscreen-trend-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  background: #fff;
}

.fullscreen-chart-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  background: #fff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.fullscreen-chart-wrapper .loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-info {
  color: #606266;
  font-size: 14px;
  min-width: 300px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .trend-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .trend-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .card-chart-wrapper {
    height: 200px;
  }

  .fullscreen-trend-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .trend-info {
    font-size: 12px;
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .card-chart-wrapper {
    height: 160px;
  }
}

/* 全屏对话框样式调整 */
:deep(.el-dialog--fullscreen) {
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog--fullscreen .el-dialog__header) {
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

:deep(.el-dialog--fullscreen .el-dialog__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  min-height: 0;
}
</style>