<script setup>
import { onMounted } from 'vue'

import { useDashboardStore } from '@/stores/dashboardStore'
import { useGrowthStore } from '@/stores/growthStore'

import StatsCard from '@/components/common/StatsCard.vue'
import InsightsHeader from '@/components/common/InsightsHeader.vue'
import UserGrowthChart from '@/components/charts/UserGrowthChart.vue'
import LinkOpensChart from '@/components/charts/LinkOpensChart.vue'

const dashboardStore = useDashboardStore()
const growthStore = useGrowthStore()

onMounted(() => {
  dashboardStore.loadOverview()
  growthStore.loadUserGrowthSeries()
})

function handleRefresh() {
  dashboardStore.refresh()
  growthStore.refresh()
}
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="Signups, growth rate, and account composition over the last 8 weeks."
      :loading="dashboardStore.loading || growthStore.loading"
      :last-updated="dashboardStore.lastUpdated"
      @refresh="handleRefresh"
    />

    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="New Users (This Week)"
          :value="dashboardStore.newUsersThisWeek.toLocaleString()"
          icon="mdi-account-plus-outline"
          color="primary"
          :loading="dashboardStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="New Users (Last Week)"
          :value="dashboardStore.newUsersLastWeek.toLocaleString()"
          icon="mdi-account-arrow-left-outline"
          color="brand-blue"
          :loading="dashboardStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Week-over-Week Growth"
          :value="`${dashboardStore.userGrowthPct}%`"
          icon="mdi-trending-up"
          color="success"
          subtitle="New signups vs. last week"
          :loading="dashboardStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Pro Users"
          :value="dashboardStore.proUsers.toLocaleString()"
          icon="mdi-crown-outline"
          color="brand-orange"
          :subtitle="`${dashboardStore.proConversionPct}% of users`"
          :loading="dashboardStore.loading"
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="8">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Total Users (Cumulative)
            </div>

            <v-skeleton-loader v-if="growthStore.loading" type="image" height="280" />

            <UserGrowthChart
              v-else
              :categories="growthStore.userGrowthSeries.labels"
              :series="[{ name: 'Total Users', data: growthStore.userGrowthSeries.cumulative }]"
              :colors="['#0DADA8']"
              :height="280"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Guest vs Registered
            </div>

            <v-skeleton-loader v-if="dashboardStore.loading" type="image" height="280" />

            <LinkOpensChart
              v-else
              :labels="['Guest', 'Registered']"
              :series="[dashboardStore.guestUsers, dashboardStore.registeredUsers]"
              :colors="['#FEA736', '#0DADA8']"
              total-label="Users"
              :height="280"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="8">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              New Users per Week
            </div>

            <v-skeleton-loader v-if="growthStore.loading" type="image" height="260" />

            <UserGrowthChart
              v-else
              :categories="growthStore.userGrowthSeries.labels"
              :series="[{ name: 'New Users', data: growthStore.userGrowthSeries.newUsers }]"
              :colors="['#43ACC5']"
              :height="260"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Platform Split
            </div>

            <v-skeleton-loader v-if="growthStore.loading" type="image" height="260" />

            <LinkOpensChart
              v-else-if="growthStore.deviceBreakdown.labels.length"
              :labels="growthStore.deviceBreakdown.labels"
              :series="growthStore.deviceBreakdown.counts"
              :colors="['#43ACC5', '#0DADA8']"
              total-label="Devices"
              :height="260"
            />

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No device data yet.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
