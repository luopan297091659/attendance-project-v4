<template>
  <div ref="chart" class="trend-chart"></div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({ data: Object })
const chart = ref(null)
const inst = ref(null)

onMounted(() => {
  inst.value = echarts.init(chart.value)
  render()
  // 响应式处理
  window.addEventListener('resize', () => {
    inst.value?.resize()
  })
})

watch(() => props.data, () => render(), { deep: true })

function render() {
  if (!inst.value || !props.data || !props.data.days) return
  
  // 根据窗口大小调整图表选项
  const isMobile = window.innerWidth <= 480
  const isTablet = window.innerWidth <= 768
  
  inst.value.setOption({
    xAxis: {
      type: 'category',
      data: props.data.days,
      axisLabel: {
        fontSize: isMobile ? 10 : isTablet ? 11 : 12
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: {
        fontSize: isMobile ? 10 : isTablet ? 11 : 12
      }
    },
    series: [{
      type: 'line',
      data: props.data.series,
      smooth: true,
      itemStyle: { color: '#409EFF' },
      lineStyle: {
        width: isMobile ? 1 : 2
      }
    }],
    grid: {
      left: isMobile ? '15%' : isTablet ? '12%' : '10%',
      right: isMobile ? '8%' : '5%',
      bottom: isMobile ? '15%' : '10%',
      top: isMobile ? '8%' : '5%',
      containLabel: true
    }
  })
}
</script>

<style scoped>
.trend-chart {
  width: 100%;
  height: 240px;
}

@media (max-width: 768px) {
  .trend-chart {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .trend-chart {
    height: 160px;
  }
}
</style>