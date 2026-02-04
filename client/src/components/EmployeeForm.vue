<template>
  <div>
    <el-form :model="model" label-width="80px">
      <el-form-item label="姓名" required>
        <el-input v-model="model.name" placeholder="请输入姓名"/>
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="model.gender" placeholder="请选择性别">
          <el-option label="男" value="男"/>
          <el-option label="女" value="女"/>
          <el-option label="其他" value="其他"/>
        </el-select>
      </el-form-item>
      <el-form-item label="年龄">
        <el-input-number v-model="model.age" :min="0" :max="150"/>
      </el-form-item>
      <el-form-item label="手机号" required>
        <el-input v-model="model.phone" placeholder="请输入手机号"/>
      </el-form-item>
      <el-form-item label="住址">
        <el-input v-model="model.address" placeholder="请输入住址" type="textarea" :rows="2"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save" :loading="loading">保存</el-button>
        <el-button @click="$emit('cancel')">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import api from '../api'
import { ElMessage } from 'element-plus'

const props = defineProps({ model: Object })
const emit = defineEmits(['saved', 'cancel'])
const loading = ref(false)
const model = reactive({ ...props.model })

const save = async () => {
  try {
    if (!model.name || !model.name.trim()) {
      ElMessage.error('姓名不能为空')
      return
    }
    if (!model.phone || !model.phone.trim()) {
      ElMessage.error('手机号不能为空')
      return
    }

    loading.value = true
    if (model.id) {
      await api.put('/api/admin/employees/' + model.id, model)
      ElMessage.success('更新成功')
    } else {
      await api.post('/api/admin/employees', model)
      ElMessage.success('添加成功')
    }
    emit('saved')
    emit('cancel')
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.el-form) {
  --el-form-label-width: 80px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input), 
:deep(.el-select),
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-button) {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-form) {
    --el-form-label-width: 70px;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
  }

  :deep(.el-input) {
    font-size: 14px;
  }

  :deep(.el-input__wrapper) {
    padding: 6px 8px;
  }
}

@media (max-width: 480px) {
  :deep(.el-form) {
    --el-form-label-width: 60px;
  }

  :deep(.el-form-item) {
    margin-bottom: 12px;
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

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-button) {
    padding: 4px 12px;
    font-size: 12px;
    margin-right: 4px;
  }

  :deep(.el-select) {
    width: 100%;
  }
}
</style>