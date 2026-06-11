<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  newUsers: { type: Array, default: () => [] },
  activeUsers: { type: Array, default: () => [] },
  colors: { type: Array, default: () => ['#43ACC5', '#0DADA8'] },
  height: { type: [Number, String], default: 320 },
})

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const series = computed(() => [
  { name: 'New Signups', data: props.newUsers },
  { name: 'Still Active (30d)', data: props.activeUsers },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    fontFamily: 'Mulish, sans-serif',
    foreColor: isDark.value ? '#9CA7AF' : '#6A7788',
  },
  colors: props.colors,
  plotOptions: {
    bar: { borderRadius: 6, columnWidth: '55%' },
  },
  dataLabels: { enabled: false },
  legend: { position: 'top', horizontalAlign: 'right' },
  grid: { borderColor: isDark.value ? '#333333' : '#EEF2F3', strokeDashArray: 4 },
  xaxis: { categories: props.categories },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))
</script>

<template>
  <apexchart type="bar" :height="height" :options="chartOptions" :series="series" />
</template>
