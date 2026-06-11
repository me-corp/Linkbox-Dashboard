<script setup>
import { computed, onMounted } from 'vue'

import { useDashboardStore } from '@/stores/dashboardStore'
import { useRetentionStore } from '@/stores/retentionStore'

import StatsCard from '@/components/common/StatsCard.vue'
import InsightsHeader from '@/components/common/InsightsHeader.vue'
import DAUChart from '@/components/charts/DAUChart.vue'
import CohortRetentionChart from '@/components/charts/CohortRetentionChart.vue'
import FolderVisitsChart from '@/components/charts/FolderVisitsChart.vue'

const dashboardStore = useDashboardStore()
const retentionStore = useRetentionStore()

onMounted(() => {
  dashboardStore.loadOverview()
  retentionStore.loadRetention()
})

function handleRefresh() {
  dashboardStore.refresh()
  retentionStore.refresh()
}

function pctOfTotal(count) {
  const total = dashboardStore.totalUsers
  if (!total) return 0
  return Math.round((count / total) * 1000) / 10
}

const dormantItems = computed(() => [
  { label: 'Inactive 30+ days', count: retentionStore.dormant.inactive30, color: 'warning' },
  { label: 'Inactive 60+ days', count: retentionStore.dormant.inactive60, color: 'brand-orange' },
  { label: 'Inactive 90+ days', count: retentionStore.dormant.inactive90, color: 'error' },
])

const cohortsAvailable = computed(() => retentionStore.cohorts.activeUsers.some(v => v !== null))
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="How often users come back, and how many have gone dormant."
      :loading="retentionStore.loading"
      :last-updated="dashboardStore.lastUpdated"
      @refresh="handleRefresh"
    />

    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Daily Active Users"
          :value="retentionStore.activeCounts.dau.toLocaleString()"
          icon="mdi-account-clock-outline"
          color="primary"
          :loading="retentionStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Weekly Active Users"
          :value="retentionStore.activeCounts.wau.toLocaleString()"
          icon="mdi-calendar-week"
          color="brand-blue"
          :loading="retentionStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Monthly Active Users"
          :value="retentionStore.activeCounts.mau.toLocaleString()"
          icon="mdi-calendar-month"
          color="brand-purple"
          :loading="retentionStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Stickiness"
          :value="`${retentionStore.stickiness}%`"
          icon="mdi-magnet"
          color="success"
          subtitle="DAU / MAU"
          :loading="retentionStore.loading"
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Active Users Breakdown
            </div>

            <v-skeleton-loader v-if="retentionStore.loading" type="image" height="260" />

            <DAUChart
              v-else
              :categories="['Daily', 'Weekly', 'Monthly']"
              :series="[{ name: 'Active Users', data: [retentionStore.activeCounts.dau, retentionStore.activeCounts.wau, retentionStore.activeCounts.mau] }]"
              :height="260"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Dormant Users
            </div>

            <v-skeleton-loader v-if="retentionStore.loading" type="list-item-three-line@3" />

            <div v-else>
              <div v-for="item in dormantItems" :key="item.label" class="mb-5">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-body-2 font-weight-medium">{{ item.label }}</span>
                  <span class="text-body-2 font-weight-bold">
                    {{ item.count.toLocaleString() }} ({{ pctOfTotal(item.count) }}%)
                  </span>
                </div>
                <v-progress-linear
                  :model-value="pctOfTotal(item.count)"
                  :color="item.color"
                  height="8"
                  rounded
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Weekly Signup Cohorts vs. Still Active (30d)
            </div>

            <v-skeleton-loader v-if="retentionStore.loading" type="image" height="300" />

            <CohortRetentionChart
              v-else-if="cohortsAvailable"
              :categories="retentionStore.cohorts.labels"
              :new-users="retentionStore.cohorts.newUsers"
              :active-users="retentionStore.cohorts.activeUsers"
              :height="300"
            />

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              Cohort retention needs a Firestore composite index (users: createdAt + lastActivityAt).
              Check the browser console for a one-click link to create it.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-1">
              Why Users Leave
            </div>
            <div class="text-caption text-medium-emphasis mb-4">
              Reasons selected in the account-deletion exit survey.
            </div>

            <v-skeleton-loader v-if="retentionStore.loading" type="image" height="280" />

            <FolderVisitsChart
              v-else-if="retentionStore.churnReasons.labels.length"
              :categories="retentionStore.churnReasons.labels"
              :series="[{ name: 'Responses', data: retentionStore.churnReasons.counts }]"
              :colors="['#F47874']"
              :height="280"
            />

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No churn survey responses yet.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
