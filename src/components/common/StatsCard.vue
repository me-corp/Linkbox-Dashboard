<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: String,
  color: {
    type: String,
    default: 'primary',
  },
  // optional WoW/period change, e.g. 12.5 or -3.2
  trend: {
    type: Number,
    default: null,
  },
  trendLabel: {
    type: String,
    default: 'vs last week',
  },
  // optional plain-text helper line, e.g. "12% of users"
  subtitle: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <v-card class="stats-card" height="100%">
    <v-card-text>
      <template v-if="loading">
        <v-skeleton-loader type="list-item-avatar-two-line" />
      </template>

      <div v-else class="d-flex justify-space-between align-start">
        <div class="stats-content">
          <div class="stats-title">
            {{ title }}
          </div>

          <div class="stats-value">
            {{ value }}
          </div>

          <div v-if="subtitle" class="stats-subtitle">
            {{ subtitle }}
          </div>

          <v-chip
            v-else-if="trend !== null"
            size="x-small"
            :color="trend >= 0 ? 'success' : 'error'"
            variant="tonal"
            class="mt-1 font-weight-bold"
          >
            <v-icon start size="14">
              {{ trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
            </v-icon>
            {{ trend >= 0 ? '+' : '' }}{{ trend }}% {{ trendLabel }}
          </v-chip>
        </div>

        <v-avatar :color="color" variant="tonal" size="44" rounded="lg" class="stats-icon">
          <v-icon :color="color" size="24">
            {{ icon }}
          </v-icon>
        </v-avatar>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.stats-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.stats-content {
  min-width: 0;
}

.stats-title {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-tertiary));
  margin-bottom: 6px;
}

.stats-value {
  font-size: 26px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
}

.stats-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-tertiary));
  margin-top: 4px;
}

.stats-icon {
  flex-shrink: 0;
}
</style>
