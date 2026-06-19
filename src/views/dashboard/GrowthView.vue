<script setup>
import { onMounted } from 'vue'

import { useDashboardStore } from '@/stores/dashboardStore'
import { useGrowthStore } from '@/stores/growthStore'

import StatsCard from '@/components/common/StatsCard.vue'
import InsightsHeader from '@/components/common/InsightsHeader.vue'
import UserGrowthChart from '@/components/charts/UserGrowthChart.vue'
import LinkOpensChart from '@/components/charts/LinkOpensChart.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'

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
          tooltip="Users whose createdAt falls within the current Mon–Sun calendar week."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="New Users (Last Week)"
          :value="dashboardStore.newUsersLastWeek.toLocaleString()"
          icon="mdi-account-arrow-left-outline"
          color="brand-blue"
          :loading="dashboardStore.loading"
          tooltip="Users whose createdAt falls within the previous Mon–Sun calendar week."
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
          tooltip="(This week signups − last week signups) ÷ last week signups × 100. Positive means accelerating growth."
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
          tooltip="Users with an active Pro subscription (isPro = true). The percentage is Pro ÷ Total Users."
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="8">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              Total Users (Cumulative)
              <InfoTooltip text="Running total of all registered users, plotted week by week. Each point is the total account count up to that week." />
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
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              Guest vs Registered
              <InfoTooltip text="Guest accounts are created without a phone number. Registered accounts have verified a phone number. Calculated from the isGuest field on each user document." />
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
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              New Users per Week
              <InfoTooltip text="New signups each week, counted by grouping createdAt timestamps into Mon–Sun buckets. Shows whether growth is accelerating or slowing." />
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
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              Platform Split
              <InfoTooltip text="Breakdown of users by device platform (iOS, Android, etc.), derived from the platform field on user documents." />
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
