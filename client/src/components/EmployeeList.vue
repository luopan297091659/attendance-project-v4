<template>
  <el-card>
    <div class="employee-header">
      <h3>人员管理</h3>
      <div class="header-actions">
        <el-input v-model="query" placeholder="搜索姓名/手机号" class="search-input"/>
        <div class="action-buttons">
          <el-button @click="exportCsv" class="export-btn">📥 CSV</el-button>
          <el-button @click="exportExcel" class="export-btn">📊 Excel</el-button>
          <el-button type="primary" @click="openForm()" class="add-btn">➕ 新增</el-button>
        </div>
      </div>
    </div>
    <el-table :data="pagedData" style="width:100%" stripe>
      <el-table-column prop="name" label="姓名" min-width="80"/>
      <el-table-column prop="gender" label="性别" min-width="60" align="center"/>
      <el-table-column prop="age" label="年龄" min-width="60" align="center"/>
      <el-table-column prop="phone" label="手机号" min-width="110"/>
      <el-table-column prop="address" label="住址" min-width="150" show-overflow-tooltip/>
      <el-table-column label="操作" min-width="120" align="center" fixed="right">
        <template #default="{row}">
          <el-button type="primary" size="small" text @click="openForm(row)">编辑</el-button>
          <el-popconfirm title="确认删除此员工?" @confirm="remove(row.id)">
            <template #reference>
              <el-button type="danger" size="small" text>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination 
        :current-page="page" 
        @current-change="page = $event"
        :page-size="pageSize" 
        :total="filtered.length" 
        layout="prev, pager, next"
        small
      />
    </div>

    <el-dialog v-model="showForm" title="员工信息" width="500px" :close-on-click-modal="false">
      <employee-form :model="formModel" @saved="refresh" @cancel="showForm=false" />
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../api'
import EmployeeForm from './EmployeeForm.vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const employees = ref([])
const showForm = ref(false)
const formModel = ref(null)
const query = ref('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const filtered = computed(() =>
  employees.value.filter(e =>
    (e.name || '').includes(query.value) || (e.phone || '').includes(query.value)
  )
)

const pagedData = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
)

const fetch = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/employees')
    if (Array.isArray(data)) {
      employees.value = data
    } else if (data.rows) {
      employees.value = data.rows
    } else {
      employees.value = []
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载员工列表失败')
  } finally {
    loading.value = false
  }
}

const openForm = (row) => {
  formModel.value = row ? { ...row } : { name: '', gender: '', age: null, phone: '', address: '' }
  showForm.value = true
}

const remove = async (id) => {
  try {
    await api.delete('/api/admin/employees/' + id)
    ElMessage.success('删除成功')
    fetch()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const refresh = () => {
  showForm.value = false
  fetch()
}

const exportCsv = () => {
  const rows = [['姓名', '性别', '年龄', '手机号', '住址'], ...employees.value.map(r => [r.name, r.gender, r.age, r.phone, r.address])]
  const csv = rows.map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'employees.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const exportExcel = async () => {
  try {
    const ws = XLSX.utils.aoa_to_sheet([['姓名', '性别', '年龄', '手机号', '住址'], ...employees.value.map(r => [r.name, r.gender, r.age, r.phone, r.address])])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '人员')
    XLSX.writeFile(wb, 'employees.xlsx')
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败: ' + (e.message || ''))
    console.error('Excel export error:', e)
  }
}

// 导出fetch方法供父组件使用
defineExpose({
  fetch
})

onMounted(fetch)
</script>

<style scoped>
.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.employee-header h3 {
  margin: 0;
  font-size: 18px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 200px;
}

.search-input {
  min-width: 180px;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.export-btn,
.add-btn {
  white-space: nowrap;
  flex-shrink: 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .employee-header {
    flex-direction: column;
    align-items: stretch;
  }

  .employee-header h3 {
    width: 100%;
  }

  .header-actions {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .action-buttons {
    width: 100%;
  }

  .action-buttons :deep(.el-button) {
    flex: 1;
    font-size: 13px;
  }

  .export-btn {
    min-width: 70px;
  }

  .add-btn {
    min-width: 70px;
  }

  .pagination-container :deep(.el-pagination) {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .employee-header {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .employee-header h3 {
    font-size: 16px;
    margin: 0;
  }

  .search-input {
    width: 100%;
    font-size: 14px;
  }

  .action-buttons {
    width: 100%;
    gap: 6px;
  }

  .action-buttons :deep(.el-button) {
    flex: 1;
    font-size: 12px;
    padding: 6px 8px;
    height: 32px;
  }

  .pagination-container {
    margin-top: 12px;
    padding-top: 8px;
    justify-content: center;
  }

  .pagination-container :deep(.el-pagination) {
    display: flex;
    justify-content: center;
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
}
</style>