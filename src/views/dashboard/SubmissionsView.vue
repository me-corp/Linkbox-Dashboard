<script setup>
import { computed, onMounted, ref } from 'vue'

import { useSubmissionsStore } from '@/stores/submissionsStore'
import { useAuthStore } from '@/stores/authStore'

import InsightsHeader from '@/components/common/InsightsHeader.vue'
import StatsCard from '@/components/common/StatsCard.vue'

const submissionsStore = useSubmissionsStore()
const authStore = useAuthStore()

const tab = ref('applications')
const statusFilter = ref('all')
const updatingId = ref(null)

onMounted(() => {
  submissionsStore.loadSubmissions()
})

function handleRefresh() {
  submissionsStore.refresh()
}

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const pendingCount = computed(() =>
  submissionsStore.creatorApplications.filter(app => (app.status || 'pending') === 'pending').length
)

const filteredApplications = computed(() => {
  if (statusFilter.value === 'all') return submissionsStore.creatorApplications
  return submissionsStore.creatorApplications.filter(app => (app.status || 'pending') === statusFilter.value)
})

const applicationHeaders = [
  { title: 'Applicant', key: 'applicant', sortable: false },
  { title: 'Niche', key: 'niche', sortable: false },
  { title: 'Followers', key: 'followers', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Submitted', key: 'submittedAt', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const activityHeaders = [
  { title: 'When', key: 'createdAt', sortable: false },
  { title: 'Action', key: 'action', sortable: false },
  { title: 'By', key: 'performedBy', sortable: false },
  { title: 'Changes', key: 'changes', sortable: false },
]

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '—'
  return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(timestamp) {
  if (!timestamp?.toDate) return '—'
  return timestamp.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatChangeValue(value) {
  if (value === null || value === undefined) return '—'
  if (value?.toDate) return formatDateTime(value)
  return String(value)
}

function formatChanges(changes) {
  if (!changes) return '—'
  return Object.entries(changes)
    .map(([key, change]) => `${key}: ${formatChangeValue(change?.oldValue)} → ${formatChangeValue(change?.newValue)}`)
    .join(', ')
}

function senderLabel(item) {
  const sender = item.sender
  if (sender) {
    if (sender.name && sender.username) return `${sender.name} (@${sender.username})`
    return sender.name || sender.username || sender.id
  }
  return item.by ? `Unknown user (${item.by.slice(0, 8)}…)` : 'Unknown user'
}

async function setStatus(application, status) {
  try {
    updatingId.value = application.id
    await submissionsStore.setCreatorApplicationStatus(application, status, { email: authStore.user?.email })
  } catch (err) {
    console.error('Failed to update creator application status:', err)
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="Creator applications, waitlists, feedback and admin activity in one place."
      :loading="submissionsStore.loading"
      @refresh="handleRefresh"
    />

    <v-card>
      <v-tabs v-model="tab" color="primary" show-arrows>
        <v-tab value="applications">
          Creator Applications
          <v-chip v-if="pendingCount" size="x-small" color="warning" variant="tonal" class="ml-2">
            {{ pendingCount }} pending
          </v-chip>
        </v-tab>
        <v-tab value="waitlist">PingMe Waitlist</v-tab>
        <v-tab value="newsletter">Newsletter</v-tab>
        <v-tab value="feedback">Feedback</v-tab>
        <v-tab value="help">Help Requests</v-tab>
        <v-tab value="activity">Activity Log</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-skeleton-loader v-if="submissionsStore.loading && !submissionsStore.loaded" type="table" />

        <v-window v-else v-model="tab">
          <!-- Creator Applications -->
          <v-window-item value="applications">
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-chip
                v-for="filter in statusFilters"
                :key="filter.value"
                :color="statusFilter === filter.value ? 'primary' : undefined"
                :variant="statusFilter === filter.value ? 'flat' : 'outlined'"
                size="small"
                @click="statusFilter = filter.value"
              >
                {{ filter.label }}
              </v-chip>
            </div>

            <v-data-table
              v-if="filteredApplications.length"
              :headers="applicationHeaders"
              :items="filteredApplications"
              :items-per-page="10"
              density="comfortable"
            >
              <template #[`item.applicant`]="{ item }">
                <div class="font-weight-bold text-body-2">
                  {{ item.creatorName || item.fullName || '—' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.email }}
                </div>
              </template>

              <template #[`item.followers`]="{ item }">
                {{ item.followers || '—' }}
              </template>

              <template #[`item.status`]="{ item }">
                <v-chip
                  size="small"
                  :color="statusColors[item.status || 'pending']"
                  variant="tonal"
                >
                  {{ item.status || 'pending' }}
                </v-chip>
              </template>

              <template #[`item.submittedAt`]="{ item }">
                {{ formatDate(item.submittedAt) }}
              </template>

              <template #[`item.actions`]="{ item }">
                <div v-if="(item.status || 'pending') === 'pending'" class="d-flex ga-2">
                  <v-btn
                    color="success"
                    size="small"
                    variant="tonal"
                    :loading="updatingId === item.id"
                    @click="setStatus(item, 'approved')"
                  >
                    Approve
                  </v-btn>
                  <v-btn
                    color="error"
                    size="small"
                    variant="tonal"
                    :loading="updatingId === item.id"
                    @click="setStatus(item, 'rejected')"
                  >
                    Reject
                  </v-btn>
                </div>
                <span v-else class="text-caption text-medium-emphasis">
                  Reviewed {{ formatDate(item.reviewedAt) }}
                </span>
              </template>
            </v-data-table>

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No creator applications {{ statusFilter === 'all' ? 'yet' : `with status "${statusFilter}"` }}.
            </v-alert>
          </v-window-item>

          <!-- PingMe Waitlist -->
          <v-window-item value="waitlist">
            <v-row class="mb-4">
              <v-col cols="12" sm="6" md="4">
                <StatsCard
                  title="Total Signups"
                  :value="submissionsStore.waitlist.count"
                  icon="mdi-bell-ring-outline"
                  color="brand-blue"
                />
              </v-col>
            </v-row>

            <v-table v-if="submissionsStore.waitlist.recent.length" density="comfortable">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in submissionsStore.waitlist.recent" :key="entry.id">
                  <td>{{ entry.email || '—' }}</td>
                  <td>{{ formatDate(entry.createdAt) }}</td>
                </tr>
              </tbody>
            </v-table>

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No PingMe waitlist signups yet.
            </v-alert>
          </v-window-item>

          <!-- Newsletter -->
          <v-window-item value="newsletter">
            <v-row class="mb-4">
              <v-col cols="12" sm="6" md="4">
                <StatsCard
                  title="Total Subscribers"
                  :value="submissionsStore.newsletter.count"
                  icon="mdi-email-newsletter"
                  color="primary"
                />
              </v-col>
            </v-row>

            <v-table v-if="submissionsStore.newsletter.recent.length" density="comfortable">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Subscribed</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in submissionsStore.newsletter.recent" :key="entry.id">
                  <td>{{ entry.email || '—' }}</td>
                  <td>{{ entry.source || '—' }}</td>
                  <td>{{ formatDate(entry.subscribedAt) }}</td>
                </tr>
              </tbody>
            </v-table>

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No newsletter subscribers yet.
            </v-alert>
          </v-window-item>

          <!-- Feedback -->
          <v-window-item value="feedback">
            <div v-if="submissionsStore.feedback.length" class="d-flex flex-column ga-3">
              <v-card v-for="item in submissionsStore.feedback" :key="item.id" variant="outlined">
                <v-card-text>
                  <div class="d-flex justify-space-between align-start mb-2">
                    <div class="d-flex align-center ga-2">
                      <v-avatar size="28" color="surface-bright">
                        <v-img v-if="item.sender?.pic" :src="item.sender.pic" cover />
                        <v-icon v-else color="primary" size="16">mdi-account</v-icon>
                      </v-avatar>
                      <div>
                        <div class="font-weight-bold text-body-2">
                          {{ item.title || 'Untitled' }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ senderLabel(item) }}
                        </div>
                      </div>
                    </div>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatDateTime(item.time) }}
                    </span>
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ item.description }}
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No feedback submissions yet.
            </v-alert>
          </v-window-item>

          <!-- Help Requests -->
          <v-window-item value="help">
            <div v-if="submissionsStore.help.length" class="d-flex flex-column ga-3">
              <v-card v-for="item in submissionsStore.help" :key="item.id" variant="outlined">
                <v-card-text>
                  <div class="d-flex justify-space-between align-start mb-2">
                    <div class="d-flex align-center ga-2">
                      <v-avatar size="28" color="surface-bright">
                        <v-img v-if="item.sender?.pic" :src="item.sender.pic" cover />
                        <v-icon v-else color="primary" size="16">mdi-account</v-icon>
                      </v-avatar>
                      <div>
                        <div class="font-weight-bold text-body-2">
                          {{ item.title || 'Untitled' }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ senderLabel(item) }}<template v-if="item.email"> · {{ item.email }}</template>
                        </div>
                      </div>
                    </div>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatDateTime(item.time) }}
                    </span>
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ item.description }}
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No help requests yet.
            </v-alert>
          </v-window-item>

          <!-- Activity Log -->
          <v-window-item value="activity">
            <v-data-table
              v-if="submissionsStore.activityLog.length"
              :headers="activityHeaders"
              :items="submissionsStore.activityLog"
              :items-per-page="10"
              density="comfortable"
            >
              <template #[`item.createdAt`]="{ item }">
                {{ formatDateTime(item.createdAt) }}
              </template>

              <template #[`item.action`]="{ item }">
                <v-chip size="small" variant="tonal" color="primary">
                  {{ item.action }}
                </v-chip>
              </template>

              <template #[`item.performedBy`]="{ item }">
                {{ item.performedBy?.email || '—' }}
              </template>

              <template #[`item.changes`]="{ item }">
                <span class="text-caption">{{ formatChanges(item.changes) }}</span>
              </template>
            </v-data-table>

            <v-alert v-else type="info" variant="tonal" density="comfortable">
              No admin activity recorded yet.
            </v-alert>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>
