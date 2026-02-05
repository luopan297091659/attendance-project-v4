<template>
  <el-card shadow="hover" class="church-card">
    <div class="church-header">
      <h3 class="section-title">⛪ 教会管理</h3>
      <el-button type="primary" @click="showCreateDialog = true">➕ 创建新教会</el-button>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <el-table v-else :data="churches" style="width: 100%" stripe>
      <el-table-column prop="id" label="ID" width="80" align="center"/>
      <el-table-column prop="name" label="教会名称" min-width="200">
        <template #default="{ row }">
          <strong>{{ row.name }}</strong>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="代码" width="150">
        <template #default="{ row }">
          <el-tag type="info">{{ row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="成员数" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="success">{{ row.memberCount || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">修改名称</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建教会对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新教会" width="500px" align-center>
      <el-form :model="newChurch" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-form-item label="教会名称" prop="name">
          <el-input 
            v-model="newChurch.name" 
            placeholder="请输入教会名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="教会代码" prop="code">
          <el-input 
            v-model="newChurch.code" 
            placeholder="请输入唯一代码（用于签到识别）"
            clearable
          >
            <template #append>
              <el-button @click="generateCode">生成</el-button>
            </template>
          </el-input>
          <div class="form-tip">提示：代码必须唯一，建议使用英文缩写</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createChurch" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 修改教会名称对话框 -->
    <el-dialog v-model="showEditDialog" title="修改教会名称" width="500px" align-center>
      <el-form :model="editChurch" label-width="100px" :rules="editRules" ref="editFormRef">
        <el-form-item label="教会名称" prop="name">
          <el-input
            v-model="editChurch.name"
            placeholder="请输入新的教会名称"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateChurch" :loading="updating">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import { ElMessage } from 'element-plus'

const churches = ref([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const creating = ref(false)
const updating = ref(false)
const loading = ref(false)

const newChurch = ref({ name: '', code: '' })
const createFormRef = ref(null)
const editChurch = ref({ id: null, name: '' })
const editFormRef = ref(null)

// 表单验证规则
const createRules = {
  name: [
    { required: true, message: '请输入教会名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入教会代码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '代码只能包含字母、数字、下划线和短横线', trigger: 'blur' }
  ]
}

const editRules = {
  name: [
    { required: true, message: '请输入教会名称', trigger: 'blur' }
  ]
}

// 生成随机代码
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  newChurch.value.code = code
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载教会列表
const loadChurches = async () => {
  try {
    loading.value = true
    const { data } = await api.get('/api/admin/churches')
    churches.value = data
  } catch (e) {
    ElMessage.error('加载教会列表失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 创建教会
const createChurch = async () => {
  try {
    if (!newChurch.value.name || !newChurch.value.code) {
      ElMessage.error('教会名称和代码不能为空')
      return
    }

    creating.value = true
    await api.post('/api/admin/churches', {
      name: newChurch.value.name,
      code: newChurch.value.code
    })

    ElMessage.success('教会创建成功')
    showCreateDialog.value = false
    newChurch.value = { name: '', code: '' }
    loadChurches()
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '创建失败')
  } finally {
    creating.value = false
  }
}

// 打开编辑对话框
const openEditDialog = (row) => {
  editChurch.value = { id: row.id, name: row.name }
  showEditDialog.value = true
}

// 更新教会名称
const updateChurch = async () => {
  try {
    if (!editChurch.value.name || !editChurch.value.name.trim()) {
      ElMessage.error('教会名称不能为空')
      return
    }

    updating.value = true
    await api.put(`/api/admin/churches/${editChurch.value.id}`, {
      name: editChurch.value.name
    })

    ElMessage.success('教会名称已更新')
    showEditDialog.value = false
    editChurch.value = { id: null, name: '' }
    loadChurches()
  } catch (e) {
    if (e.response?.status === 403) {
      ElMessage.error('无权限修改该教会')
    } else if (e.response?.status === 404) {
      ElMessage.error('教会不存在或已被删除')
    } else {
      const serverMsg = e.response?.data?.msg
      const serverErr = e.response?.data?.error
      ElMessage.error(serverErr ? `${serverMsg || '更新失败'}：${serverErr}` : (serverMsg || '更新失败'))
    }
  } finally {
    updating.value = false
  }
}

onMounted(loadChurches)
</script>

<style scoped>
.church-card {
  border-radius: 12px;
}

.church-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.loading-state {
  padding: 40px 20px;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .church-card {
    border-radius: 8px;
  }

  .church-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .section-title {
    font-size: 16px;
    margin: 0;
  }

  .church-header .el-button {
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

  :deep(.el-form) {
    --el-form-label-width: 90px;
  }

  :deep(.el-dialog) {
    width: 90% !important;
  }
}

@media (max-width: 480px) {
  .church-card {
    border-radius: 0;
  }

  .church-header {
    flex-direction: column;
    gap: 8px;
  }

  .section-title {
    font-size: 15px;
    margin: 0;
  }

  .church-header .el-button {
    width: 100%;
    font-size: 12px;
    padding: 4px 8px;
    height: 32px;
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

  :deep(.el-tag) {
    font-size: 11px;
    padding: 2px 6px;
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

  :deep(.el-dialog) {
    width: 95% !important;
  }

  :deep(.el-dialog__header) {
    padding: 12px;
  }

  :deep(.el-dialog__body) {
    padding: 12px;
  }

  :deep(.el-dialog__footer) {
    padding: 12px;
  }

  .form-tip {
    font-size: 11px;
    margin-top: 4px;
  }
}
</style>
