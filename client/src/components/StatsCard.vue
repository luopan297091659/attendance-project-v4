<template>
  <el-row :gutter="20" class="stats-cards">
    <el-col :xs="24" :sm="8" :md="8">
      <el-card shadow="hover" class="stat-card total-card">
        <el-skeleton :rows="2" animated v-if="loading" />
        <div v-else class="stat-content">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-number">{{ total }}</div>
            <div class="stat-label">人员总数</div>
            <div class="stat-placeholder"></div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="8" :md="8">
      <el-card shadow="hover" class="stat-card signed-card">
        <el-skeleton :rows="2" animated v-if="loading" />
        <div v-else class="stat-content">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-number">{{ signed }}</div>
            <div class="stat-label">今日已签到</div>
            <div class="stat-percent" v-if="total > 0">
              {{ ((signed / total) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="8" :md="8">
      <el-card shadow="hover" class="stat-card absent-card">
        <el-skeleton :rows="2" animated v-if="loading" />
        <div v-else class="stat-content">
          <div class="stat-icon">❌</div>
          <div class="stat-info">
            <div class="stat-number">{{ absent }}</div>
            <div class="stat-label">今日未签到</div>
            <div class="stat-percent" v-if="total > 0">
              {{ ((absent / total) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
const props = defineProps({ 
  total: Number, 
  signed: Number, 
  absent: Number,
  loading: Boolean
})
</script>

<style scoped>
.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.total-card {
  border-left: 4px solid #409eff;
}

.signed-card {
  border-left: 4px solid #67c23a;
}

.absent-card {
  border-left: 4px solid #f56c6c;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
  min-height: 60px;
}

.stat-icon {
  font-size: 48px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  line-height: 1;
}

.stat-percent {
  color: #606266;
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  min-height: 16px;
}

.stat-placeholder {
  min-height: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    margin-bottom: 12px;
  }
  
  .stat-content {
    gap: 16px;
    padding: 6px 0;
    min-height: 56px;
  }
  
  .stat-icon {
    font-size: 40px;
    width: 48px;
    height: 48px;
  }
  
  .stat-number {
    font-size: 28px;
  }
  
  .stat-label {
    font-size: 13px;
  }
  
  .stat-percent {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .stat-content {
    gap: 12px;
    padding: 4px 0;
    min-height: 52px;
  }
  
  .stat-icon {
    font-size: 36px;
    width: 44px;
    height: 44px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .stat-percent {
    font-size: 10px;
  }
}
</style>