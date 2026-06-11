<script setup>
import { onMounted } from 'vue'

import { useDashboardStore } from '@/stores/dashboardStore'
import { useEngagementStore } from '@/stores/engagementStore'

import StatsCard from '@/components/common/StatsCard.vue'
import InsightsHeader from '@/components/common/InsightsHeader.vue'
import LinkOpensChart from '@/components/charts/LinkOpensChart.vue'
import FolderVisitsChart from '@/components/charts/FolderVisitsChart.vue'

const dashboardStore = useDashboardStore()
const engagementStore = useEngagementStore()

onMounted(() => {
  engagementStore.loadEngagement()
})

function handleRefresh() {
  engagementStore.refresh()
}
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="How users interact with their folders, links, and notifications."
      :loading="engagementStore.loading"
      :last-updated="dashboardStore.lastUpdated"
      @refresh="handleRefresh"
    />

    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Avg Links / User"
          :value="engagementStore.avgLinksPerUser.toFixed(1)"
          icon="mdi-link-variant"
          color="primary"
          :loading="engagementStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Avg Folders / User"
          :value="engagementStore.avgFoldersPerUser.toFixed(1)"
          icon="mdi-folder-outline"
          color="brand-blue"
          :loading="engagementStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Total Folder Visits"
          :value="engagementStore.folderEngagement.totalVisits.toLocaleString()"
          icon="mdi-eye-outline"
          color="brand-purple"
          :loading="engagementStore.loading"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Avg Visits / Folder"
          :value="engagementStore.folderEngagement.avgVisits.toFixed(1)"
          icon="mdi-chart-line"
          color="success"
          :loading="engagementStore.loading"
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Folder Visibility
            </div>

            <v-skeleton-loader v-if="engagementStore.loading" type="image" height="240" />

            <LinkOpensChart
              v-else
              :labels="['Private', 'Public']"
              :series="[engagementStore.visibility.private, engagementStore.visibility.public]"
              :colors="['#43ACC5', '#0DADA8']"
              total-label="Folders"
              :height="240"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text class="d-flex flex-column align-center justify-center text-center" style="min-height: 240px;">
            <v-avatar color="brand-orange" variant="tonal" size="56" rounded="lg" class="mb-4">
              <v-icon color="brand-orange" size="28">
                mdi-star
              </v-icon>
            </v-avatar>

            <div class="text-h4 font-weight-black">
              {{ engagementStore.favouriteFoldersCount.toLocaleString() }}
            </div>

            <div class="text-body-2 text-medium-emphasis mt-1">
              Folders marked as favourite
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Notification Read Rate
            </div>

            <v-skeleton-loader v-if="engagementStore.loading" type="image" height="240" />

            <LinkOpensChart
              v-else
              :labels="['Read', 'Unread']"
              :series="[engagementStore.notificationReadStats.read, engagementStore.notificationReadStats.unread]"
              :colors="['#00925A', '#F47874']"
              total-label="Notifications"
              :height="240"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4">
              Top Folders by Visits
            </div>

            <v-skeleton-loader v-if="engagementStore.loading" type="image" height="320" />

            <FolderVisitsChart
              v-else-if="engagementStore.topFolders.length"
              :categories="engagementStore.topFolders.map(f => f.title || 'Untitled')"
              :series="[{ name: 'Visits', data: engagementStore.topFolders.map(f => f.visits || 0) }]"
              :height="320"
            />

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No folder visit data yet. (Requires Firestore index folders: isDeleted + visits.)
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
