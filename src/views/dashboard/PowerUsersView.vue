<script setup>
import { onMounted } from 'vue'

import { usePowerUsersStore } from '@/stores/powerUsersStore'
import { useEngagementStore } from '@/stores/engagementStore'

import InsightsHeader from '@/components/common/InsightsHeader.vue'
import FolderVisitsChart from '@/components/charts/FolderVisitsChart.vue'

const powerUsersStore = usePowerUsersStore()
const engagementStore = useEngagementStore()

onMounted(() => {
  powerUsersStore.loadPowerUsers()
  engagementStore.loadEngagement()
})

function handleRefresh() {
  powerUsersStore.refresh()
  engagementStore.refresh()
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '—'
  return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function displayName(user) {
  return user.name || user.username || user.id
}
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="The users driving the most value in LinkBox."
      :loading="powerUsersStore.loading"
      @refresh="handleRefresh"
    />

    <v-row>
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-1">
              Most Active Users
            </div>
            <div class="text-caption text-medium-emphasis mb-2">
              By most recent activity
            </div>

            <v-skeleton-loader v-if="powerUsersStore.loading" type="table-row@5" />

            <v-table v-else density="comfortable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Last Active</th>
                  <th class="text-right">
                    Links
                  </th>
                  <th class="text-right">
                    Folders
                  </th>
                  <th>Plan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in powerUsersStore.mostActiveUsers" :key="user.id">
                  <td>
                    <div class="d-flex align-center ga-2 py-2">
                      <v-avatar size="32" color="surface-bright">
                        <v-img v-if="user.pic" :src="user.pic" cover />
                        <v-icon v-else color="primary" size="18">
                          mdi-account
                        </v-icon>
                      </v-avatar>

                      <div>
                        <div class="font-weight-bold text-body-2">
                          {{ displayName(user) }}
                        </div>
                        <div v-if="user.username" class="text-caption text-medium-emphasis">
                          @{{ user.username }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{{ formatDate(user.lastActivityAt) }}</td>
                  <td class="text-right">
                    {{ user.linksCount }}
                  </td>
                  <td class="text-right">
                    {{ user.foldersCount }}
                  </td>
                  <td>
                    <v-chip size="small" :color="user.isPro ? 'brand-orange' : undefined" variant="tonal">
                      {{ user.isPro ? 'Pro' : 'Free' }}
                    </v-chip>
                  </td>
                </tr>

                <tr v-if="!powerUsersStore.mostActiveUsers.length">
                  <td colspan="5" class="text-center text-medium-emphasis py-6">
                    No data yet — requires Firestore index users: isGuest + lastActivityAt.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-1">
              Top Pro Users
            </div>
            <div class="text-caption text-medium-emphasis mb-2">
              By most recent activity
            </div>

            <v-skeleton-loader v-if="powerUsersStore.loading" type="table-row@5" />

            <v-table v-else density="comfortable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Last Active</th>
                  <th class="text-right">
                    Links
                  </th>
                  <th class="text-right">
                    Folders
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in powerUsersStore.topProUsers" :key="user.id">
                  <td>
                    <div class="d-flex align-center ga-2 py-2">
                      <v-avatar size="32" color="surface-bright">
                        <v-img v-if="user.pic" :src="user.pic" cover />
                        <v-icon v-else color="brand-orange" size="18">
                          mdi-crown
                        </v-icon>
                      </v-avatar>

                      <div>
                        <div class="font-weight-bold text-body-2">
                          {{ displayName(user) }}
                        </div>
                        <div v-if="user.username" class="text-caption text-medium-emphasis">
                          @{{ user.username }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{{ formatDate(user.lastActivityAt) }}</td>
                  <td class="text-right">
                    {{ user.linksCount }}
                  </td>
                  <td class="text-right">
                    {{ user.foldersCount }}
                  </td>
                </tr>

                <tr v-if="!powerUsersStore.topProUsers.length">
                  <td colspan="4" class="text-center text-medium-emphasis py-6">
                    No Pro users yet — requires Firestore index users: isPro + lastActivityAt.
                  </td>
                </tr>
              </tbody>
            </v-table>
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
              :colors="['#6322CB']"
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
