<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
  colors: { type: Array, default: () => ['#0DADA8', '#43ACC5', '#6322CB'] },
  height: { type: [Number, String], default: 280 },
})

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    fontFamily: 'Mulish, sans-serif',
    foreColor: isDark.value ? '#9CA7AF' : '#6A7788',
  },
  colors: props.colors,
  plotOptions: {
    bar: { borderRadius: 8, columnWidth: '45%', distributed: true },
  },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: { borderColor: isDark.value ? '#333333' : '#EEF2F3', strokeDashArray: 4 },
  xaxis: { categories: props.categories },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))
</script>

<template>
  <apexchart type="bar" :height="height" :options="chartOptions" :series="series" />
</template>
