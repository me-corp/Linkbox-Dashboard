<script setup>
  import { onMounted } from 'vue'

  import { useDashboardStore }
    from '@/stores/dashboardStore'

  import {useUsersStore} from '@/stores/usersStore'

  import StatsCard
    from '@/components/common/StatsCard.vue'

  const dashboardStore =
    useDashboardStore()
  
  const usersStore =
    useUsersStore()

  onMounted(() => {
    Promise.all([
      dashboardStore.loadOverview(),
      usersStore.loadUsers(),
    ])
  })
</script>

<template>
  <div>
    <h1 class="mb-4">
      Overview
    </h1>
    <v-divider class="my-4" />
    <h2 class="mb-4">
      Users
    </h2>
    <v-row>
      <v-col cols="12" md="3">
        <StatsCard title="Total Users" :value="dashboardStore.totalUsers" icon="mdi-account-group" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Guest Users" :value="dashboardStore.guestUsers" icon="mdi-account-clock" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Registered Users" :value="dashboardStore.registeredUsers" icon="mdi-account-check" />
      </v-col>


      <v-col cols="12" md="3">
        <StatsCard title="Pro Users" :value="usersStore.dashboardMetrics.proUsers
          " icon="mdi-account-heart" />
      </v-col>
    </v-row>
    <v-divider class="my-4" />
    <h2 class="mb-4">
      Content
    </h2>
    <v-row>
      <v-col cols="12" md="3">
        <StatsCard title="Total Folders" :value="dashboardStore.totalFolders" icon="mdi-folder" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Total Links" :value="dashboardStore.totalLinks" icon="mdi-link" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Folder Audience" :value="dashboardStore.folderAudienceCount" icon="mdi-account-group" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Folder Insights" :value="dashboardStore.folderInsightsCount" icon="mdi-chart-bar" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Link Insights" :value="dashboardStore.linkInsightsCount" icon="mdi-link-variant" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Device Info" :value="dashboardStore.deviceInfoCount" icon="mdi-tablet" />
      </v-col>

      <v-col cols="12" md="3">
        <StatsCard title="Notifications" :value="dashboardStore.notificationsCount" icon="mdi-bell" />
      </v-col>
    </v-row>
    <v-divider class="my-4" />
    <h2 class="mb-4">
      User Activity
    </h2>
    <v-row>
      <v-col cols="12" md="4">
        <StatsCard title="DAU (Daily Active Users)" :value="usersStore.dashboardMetrics.activeUsersToday
          " icon="mdi-account-heart" />
      </v-col>

      <v-col cols="12" md="4">
        <StatsCard title="WAU (Weekly Active Users  )" :value="usersStore.dashboardMetrics.active7Days
          " icon="mdi-account-heart" />
      </v-col>

      <v-col cols="12" md="4">
        <StatsCard title="MAU (Monthly Active Users)" :value="usersStore.dashboardMetrics.active30Days
          " icon="mdi-account-heart" />
      </v-col>
    </v-row>
    <v-divider class="my-4" />
    <h2 class="mb-4">
      Operations
    </h2>
    <v-row>
      <v-col cols="12" md="6">
        <StatsCard title="Data Issues" :value="usersStore.dataIssuesCount
          " icon="mdi-alert-circle" />
      </v-col>

    </v-row>
    <v-divider class="my-4" />
  </div>
</template>