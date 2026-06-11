<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
  colors: { type: Array, default: () => ['#0DADA8', '#43ACC5'] },
  height: { type: [Number, String], default: 300 },
  // compact = sparkline mode (no axes / legend / grid)
  compact: { type: Boolean, default: false },
})

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'Mulish, sans-serif',
    foreColor: isDark.value ? '#9CA7AF' : '#6A7788',
    sparkline: { enabled: props.compact },
  },
  colors: props.colors,
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
  },
  grid: {
    show: !props.compact,
    borderColor: isDark.value ? '#333333' : '#EEF2F3',
    strokeDashArray: 4,
  },
  xaxis: {
    categories: props.categories,
    labels: { show: !props.compact },
    axisTicks: { show: !props.compact },
    axisBorder: { show: !props.compact },
  },
  yaxis: { show: !props.compact },
  legend: { show: !props.compact, position: 'top', horizontalAlign: 'right' },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))
</script>

<template>
  <apexchart type="area" :height="height" :options="chartOptions" :series="series" />
</template>
