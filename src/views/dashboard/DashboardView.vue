<script setup>
import { onMounted } from 'vue'

import { useDashboardStore } from '@/stores/dashboardStore'
import { useGrowthStore } from '@/stores/growthStore'

import StatsCard from '@/components/common/StatsCard.vue'
import InsightsHeader from '@/components/common/InsightsHeader.vue'
import UserGrowthChart from '@/components/charts/UserGrowthChart.vue'

const dashboardStore = useDashboardStore()
const growthStore = useGrowthStore()

onMounted(() => {
  dashboardStore.loadOverview()
})

function handleRefresh() {
  dashboardStore.refresh()
}
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="A snapshot of LinkBox's growth, engagement, and platform health."
      :loading="dashboardStore.loading"
      :last-updated="dashboardStore.lastUpdated"
      @refresh="handleRefresh"
    />

    <div class="section-title">
      Users &amp; Content
    </div>
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Total Users"
          :value="dashboardStore.totalUsers.toLocaleString()"
          icon="mdi-account-group"
          color="primary"
          :trend="dashboardStore.userGrowthPct"
          trend-label="vs last week"
          :loading="dashboardStore.loading"
          tooltip="All user documents in Firestore — guests and registered accounts combined."
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
          tooltip="Users with an active Pro subscription (isPro = true). The percentage shown is Pro ÷ Total Users."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Total Folders"
          :value="dashboardStore.totalFolders.toLocaleString()"
          icon="mdi-folder-outline"
          color="brand-blue"
          :loading="dashboardStore.loading"
          tooltip="All folder documents ever created in Firestore, including deleted folders."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Total Links"
          :value="dashboardStore.totalLinks.toLocaleString()"
          icon="mdi-link-variant"
          color="brand-purple"
          :loading="dashboardStore.loading"
          tooltip="All link documents ever saved in Firestore, including deleted links."
        />
      </v-col>
    </v-row>

    <div class="section-title mt-6">
      Activity
    </div>
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Daily Active Users"
          :value="dashboardStore.dau.toLocaleString()"
          icon="mdi-account-clock-outline"
          color="primary"
          subtitle="Active today"
          :loading="dashboardStore.loading"
          tooltip="Users whose lastActivityAt timestamp falls within the last 24 hours."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Weekly Active Users"
          :value="dashboardStore.wau.toLocaleString()"
          icon="mdi-calendar-week"
          color="brand-blue"
          subtitle="Last 7 days"
          :loading="dashboardStore.loading"
          tooltip="Users whose lastActivityAt timestamp falls within the last 7 days."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Monthly Active Users"
          :value="dashboardStore.mau.toLocaleString()"
          icon="mdi-calendar-month"
          color="brand-purple"
          subtitle="Last 30 days"
          :loading="dashboardStore.loading"
          tooltip="Users whose lastActivityAt timestamp falls within the last 30 days."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Stickiness"
          :value="`${dashboardStore.stickiness}%`"
          icon="mdi-magnet"
          color="success"
          subtitle="DAU / MAU"
          :loading="dashboardStore.loading"
          tooltip="DAU ÷ MAU × 100. How often monthly users return on any given day. Consumer apps typically aim for 20%+."
        />
      </v-col>
    </v-row>

    <div class="section-title mt-6">
      Growth
    </div>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="d-flex flex-wrap align-center justify-space-between mb-2 ga-2">
              <div>
                <div class="text-subtitle-1 font-weight-bold">
                  User Growth (last 8 weeks)
                </div>
                <div class="text-caption text-medium-emphasis">
                  +{{ dashboardStore.newUsersThisWeek }} new users this week
                  ({{ dashboardStore.newUsersLastWeek }} last week)
                </div>
              </div>

              <v-btn variant="text" color="primary" to="/growth" append-icon="mdi-arrow-right" size="small">
                View Growth
              </v-btn>
            </div>

            <v-skeleton-loader v-if="dashboardStore.loading" type="image" height="120" />

            <UserGrowthChart
              v-else
              :categories="growthStore.userGrowthSeries.labels"
              :series="[{ name: 'Total Users', data: growthStore.userGrowthSeries.cumulative }]"
              compact
              :height="120"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div class="section-title mt-6">
      Platform Health
    </div>
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Folder Views"
          :value="dashboardStore.folderInsightsCount.toLocaleString()"
          icon="mdi-eye-outline"
          color="brand-blue"
          :loading="dashboardStore.loading"
          tooltip="Total folder_insights events recorded — each represents one folder being opened by a user."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Link Clicks"
          :value="dashboardStore.linkInsightsCount.toLocaleString()"
          icon="mdi-cursor-default-click-outline"
          color="primary"
          :loading="dashboardStore.loading"
          tooltip="Total link_insights click events recorded across all users and folders."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Shared Folders"
          :value="dashboardStore.folderAudienceCount.toLocaleString()"
          icon="mdi-account-multiple-outline"
          color="brand-purple"
          :loading="dashboardStore.loading"
          tooltip="Total folders_audience documents — each represents one user having access to one folder (owner or shared)."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Notifications Sent"
          :value="dashboardStore.notificationsCount.toLocaleString()"
          icon="mdi-bell-outline"
          color="brand-orange"
          :loading="dashboardStore.loading"
          tooltip="Total notification documents ever created in Firestore — includes all push notifications sent to any user."
        />
      </v-col>
    </v-row>
  </div>
</template>
