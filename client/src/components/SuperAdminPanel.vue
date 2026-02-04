<template>
  <div class="super-admin-panel">
    <el-alert 
      title="超级管理员面板" 
      type="info" 
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        您拥有超级管理员权限，可以管理系统配置、所有教会和管理员账号
      </template>
    </el-alert>

    <el-tabs v-model="activeTab">
      <!-- 系统配置 -->
      <el-tab-pane label="⚙️ 系统配置" name="config">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">签到URL配置</span>
          </template>
          
          <el-form label-width="120px">
            <el-form-item label="签到页面URL">
              <el-input 
                v-model="signUrl" 
                placeholder="例如: https://yourdomain.com/sign"
              >
                <template #append>
                  <el-button @click="saveConfig" :loading="saving">保存</el-button>
                </template>
              </el-input>
              <div class="form-tip">
                📌 设置后，所有教会的签到二维码将使用此URL
              </div>
            </el-form-item>
            
            <el-form-item label="当前配置">
              <el-tag type="success">{{ signUrl || '未配置' }}</el-tag>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 管理员管理 -->
      <el-tab-pane label="👥 管理员管理" name="admins">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">管理员列表</span>
              <el-button type="primary" @click="showCreateDialog = true">
                ➕ 创建管理员
              </el-button>
            </div>
          </template>

          <div v-if="admins.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无管理员" />
          </div>

          <el-table :data="admins" stripe v-loading="loading" v-else>
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column prop="username" label="用户名" width="180">
              <template #default="{ row }">
                <div style="display: flex; align-items: center; gap: 8px">
                  <strong>{{ row.username }}</strong>
                  <el-tag v-if="row.is_super" type="danger" size="small">
                    超级管理员
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="churches" label="管理的教会" min-width="250">
              <template #default="{ row }">
                <div v-if="row.churches" class="churches-list">
                  <el-tag 
                    v-for="church in row.churches.split(', ')" 
                    :key="church"
                    size="small"
                    style="margin-right: 4px; margin-bottom: 4px"
                  >
                    {{ church }}
                  </el-tag>
                </div>
                <span v-else style="color: #999">未分配教会</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-button-group>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="editAdminChurches(row)"
                    :disabled="row.is_super"
                  >
                    编辑教会
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="deleteAdmin(row)"
                    :disabled="row.is_super"
                  >
                    删除
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 教会管理 -->
      <el-tab-pane label="⛪ 教会管理" name="churches">
        <church-management />
      </el-tab-pane>
    </el-tabs>

    <!-- 创建管理员对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新管理员" width="500px">
      <el-form :model="newAdmin" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="newAdmin.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input 
            v-model="newAdmin.password" 
            type="password" 
            placeholder="请输入密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="管理教会">
          <el-select 
            v-model="newAdmin.churchIds" 
            multiple 
            placeholder="请选择教会"
            style="width: 100%"
          >
            <el-option 
              v-for="church in churches" 
              :key="church.id" 
              :label="church.name" 
              :value="church.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createAdmin" :loading="creating">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑管理员教会对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑管理员教会" width="500px">
      <div class="dialog-info" v-if="selectedAdmin">
        <p>正在为管理员 <strong>{{ selectedAdmin.username }}</strong> 分配教会</p>
      </div>
      <el-form label-width="100px">
        <el-form-item label="管理教会">
          <el-select 
            v-model="editChurchIds" 
            multiple 
            placeholder="请选择教会"
            style="width: 100%"
          >
            <el-option 
              v-for="church in churches" 
              :key="church.id" 
              :label="church.name" 
              :value="church.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateAdminChurches" :loading="updating">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import ChurchManagement from './ChurchManagement.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('config')
const signUrl = ref('')
const saving = ref(false)
const loading = ref(false)
const creating = ref(false)
const updating = ref(false)

const admins = ref([])
const churches = ref([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const selectedAdmin = ref(null)
const editChurchIds = ref([])

const newAdmin = ref({
  username: '',
  password: '',
  churchIds: []
})

// 加载配置
const loadConfig = async () => {
  try {
    const { data } = await api.get('/api/super/config')
    const signUrlConfig = data.find(c => c.config_key === 'sign_url')
    if (signUrlConfig) {
      signUrl.value = signUrlConfig.config_value
    }
  } catch (e) {
    console.error('加载配置失败:', e)
  }
}

// 保存配置
const saveConfig = async () => {
  try {
    if (!signUrl.value) {
      ElMessage.warning('请输入签到URL')
      return
    }

    saving.value = true
    await api.put('/api/super/config', {
      configKey: 'sign_url',
      configValue: signUrl.value
    })
    ElMessage.success('配置保存成功')
  } catch (e) {
    ElMessage.error('保存配置失败')
  } finally {
    saving.value = false
  }
}

// 加载管理员列表
const loadAdmins = async () => {
  try {
    loading.value = true
    const { data } = await api.get('/api/super/admins')
    admins.value = data
  } catch (e) {
    ElMessage.error('加载管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 加载教会列表
const loadChurches = async () => {
  try {
    const { data } = await api.get('/api/admin/churches')
    churches.value = data
  } catch (e) {
    console.error('加载教会列表失败:', e)
  }
}

// 创建管理员
const createAdmin = async () => {
  try {
    if (!newAdmin.value.username || !newAdmin.value.password) {
      ElMessage.warning('请填写用户名和密码')
      return
    }

    if (newAdmin.value.password.length < 6) {
      ElMessage.warning('密码至少6位')
      return
    }

    creating.value = true
    await api.post('/api/super/admins', newAdmin.value)
    ElMessage.success('管理员创建成功')
    showCreateDialog.value = false
    newAdmin.value = { username: '', password: '', churchIds: [] }
    loadAdmins()
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '创建管理员失败')
  } finally {
    creating.value = false
  }
}

// 编辑管理员教会
const editAdminChurches = async (admin) => {
  selectedAdmin.value = admin
  
  // 获取该管理员的教会
  try {
    const { data } = await api.get('/api/admin/churches')
    const adminChurches = admin.churches ? admin.churches.split(', ') : []
    editChurchIds.value = data.filter(c => adminChurches.includes(c.name)).map(c => c.id)
    showEditDialog.value = true
  } catch (e) {
    ElMessage.error('加载管理员教会失败')
  }
}

// 更新管理员教会
const updateAdminChurches = async () => {
  try {
    updating.value = true
    await api.put(`/api/super/admins/${selectedAdmin.value.id}/churches`, {
      churchIds: editChurchIds.value
    })
    ElMessage.success('更新成功')
    showEditDialog.value = false
    loadAdmins()
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    updating.value = false
  }
}

// 删除管理员
const deleteAdmin = async (admin) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除管理员 ${admin.username} 吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await api.delete(`/api/super/admins/${admin.id}`)
    ElMessage.success('删除成功')
    loadAdmins()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadConfig()
  loadAdmins()
  loadChurches()
})
</script>

<style scoped>
.super-admin-panel {
  padding: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-info {
  background: #f0f9ff;
  border-left: 4px solid #409eff;
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.dialog-info p {
  margin: 0;
  color: #606266;
}

.dialog-info strong {
  color: #409eff;
}

.churches-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .super-admin-panel {
    padding: 12px;
  }

  .card-title {
    font-size: 15px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .card-header :deep(.el-button) {
    width: 100%;
  }

  :deep(.el-form) {
    --el-form-label-width: 100px;
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

  :deep(.el-alert) {
    margin-bottom: 16px;
  }

  :deep(.el-input__wrapper) {
    padding: 6px 8px;
  }
}

@media (max-width: 480px) {
  .super-admin-panel {
    padding: 8px;
  }

  .card-title {
    font-size: 14px;
  }

  :deep(.el-form) {
    --el-form-label-width: 70px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }

  :deep(.el-input) {
    font-size: 14px;
  }

  :deep(.el-input__wrapper) {
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

  :deep(.el-button) {
    padding: 4px 8px;
    font-size: 12px;
  }

  :deep(.el-tag) {
    font-size: 11px;
    padding: 2px 6px;
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

  .dialog-info {
    padding: 8px 10px;
    margin-bottom: 16px;
  }

  .dialog-info p {
    font-size: 13px;
  }

  .empty-state {
    padding: 20px 10px;
  }
}
</style>
