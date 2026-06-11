<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  labels: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
  colors: { type: Array, default: () => ['#0DADA8', '#43ACC5', '#FEA736', '#F47874'] },
  height: { type: [Number, String], default: 280 },
  totalLabel: { type: String, default: 'Total' },
})

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'Mulish, sans-serif',
    foreColor: isDark.value ? '#9CA7AF' : '#6A7788',
  },
  labels: props.labels,
  colors: props.colors,
  legend: { position: 'bottom' },
  dataLabels: {
    enabled: true,
    formatter: val => `${Number(val).toFixed(1)}%`,
  },
  stroke: { show: true, width: 2, colors: [isDark.value ? '#1E1E1E' : '#FFFFFF'] },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          total: {
            show: true,
            label: props.totalLabel,
            color: isDark.value ? '#FFFFFF' : '#202C33',
          },
        },
      },
    },
  },
}))
</script>

<template>
  <apexchart type="donut" :height="height" :options="chartOptions" :series="series" />
</template>
