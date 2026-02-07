<template>
  <div ref="chart" class="trend-chart"></div>
</template>

<script setup>
import { onMounted, watch, ref, nextTick } from 'vue'
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
  
  inst.value.setOption({
    xAxis: {
      type: 'category',
      data: props.data.days
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [{
      type: 'line',
      data: props.data.series,
      smooth: true,
      itemStyle: { color: '#409EFF' },
      lineStyle: { width: 2 }
    }],
    grid: {
      left: '3%',
      right: '2%',
      bottom: '5%',
      top: '2%',
      containLabel: true
    }
  })
}

// 暴露resize方法供外部调用
const doResize = async () => {
  await nextTick()
  inst.value?.resize()
}

defineExpose({ doResize })
</script>

<style scoped>
.trend-chart {
  width: 100%;
  height: 100%;
}
</style>