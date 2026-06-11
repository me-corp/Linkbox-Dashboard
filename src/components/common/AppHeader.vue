<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'

const route = useRoute()
const theme = useTheme()

const pageTitle = computed(() => route.meta?.title || 'LinkBox Dashboard')

const isDark = computed(() => theme.global.name.value === 'dark')

function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark'
  theme.global.name.value = next
  localStorage.setItem('themeMode', next)
}
</script>

<template>
  <v-app-bar flat border="b" color="surface">
    <v-app-bar-title class="page-title">
      {{ pageTitle }}
    </v-app-bar-title>

    <v-spacer />

    <v-btn
      :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
      variant="text"
      color="primary"
      @click="toggleTheme"
    />
  </v-app-bar>
</template>

<style scoped>
.page-title {
  font-weight: 800;
  font-size: 18px;
  color: rgb(var(--v-theme-on-surface));
}
</style>
