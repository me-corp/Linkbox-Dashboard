<script setup>
defineProps({
  subtitle: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  lastUpdated: {
    type: Date,
    default: null,
  },
})

defineEmits(['refresh'])

function formatTime(date) {
  if (!date) return '—'
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-2">
    <p v-if="subtitle" class="view-subtitle">
      {{ subtitle }}
    </p>
    <v-spacer v-else />

    <div class="d-flex align-center ga-2">
      <span class="text-caption text-medium-emphasis">
        Updated {{ formatTime(lastUpdated) }}
      </span>

      <v-btn
        icon="mdi-refresh"
        variant="text"
        density="comfortable"
        size="small"
        :loading="loading"
        @click="$emit('refresh')"
      />
    </div>
  </div>
</template>

<style scoped>
.view-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-tertiary));
  max-width: 560px;
  margin: 0;
}
</style>
