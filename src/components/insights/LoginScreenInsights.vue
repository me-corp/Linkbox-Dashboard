<script setup>
import { onMounted, computed } from 'vue'

import { useLoginScreenInsightsStore } from '@/stores/loginScreenInsightsStore'

import StatsCard from '@/components/common/StatsCard.vue'
import LinkOpensChart from '@/components/charts/LinkOpensChart.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'

const store = useLoginScreenInsightsStore()

onMounted(() => {
  store.loadLoginScreenInsights()
})

const headers = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Result UID', key: 'resultUid', sortable: false },
  { title: 'When', key: 'createdAt', sortable: false },
]

const typeChipColor = {
  opened: 'primary',
  guest_card_opened: 'brand-orange',
  continued_as_guest: 'brand-purple',
  logged_in_directly: 'success',
}

const typeLabel = {
  opened: 'Opened',
  guest_card_opened: 'Guest Card Opened',
  continued_as_guest: 'Continued as Guest',
  logged_in_directly: 'Logged In Directly',
}

function formatDateTime(timestamp) {
  if (!timestamp?.toDate) return '—'
  return timestamp.toDate().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

const breakdownSeries = computed(() => [
  store.counts.loggedInDirectly,
  store.counts.continuedAsGuest,
])
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Login Screen Opened"
          :value="store.counts.opened.toLocaleString()"
          icon="mdi-eye-outline"
          color="primary"
          :loading="store.loading"
          tooltip="Opens by users who weren't already a guest — excludes the guest-conversion prompt's own navigation to this screen."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Guest Card Opened"
          :value="store.counts.guestCardOpened.toLocaleString()"
          icon="mdi-account-question-outline"
          color="brand-orange"
          :loading="store.loading"
          :subtitle="`${store.guestCardOpenRate.toFixed(1)}% of opens`"
          tooltip="Tapped the collapsed 'Not ready to share your number?' card to expand it."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Continued as Guest"
          :value="store.counts.continuedAsGuest.toLocaleString()"
          icon="mdi-account-arrow-right-outline"
          color="brand-purple"
          :loading="store.loading"
          tooltip="Completed guest sign-in from the expanded card."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Logged In Directly"
          :value="store.counts.loggedInDirectly.toLocaleString()"
          icon="mdi-login-variant"
          color="success"
          :loading="store.loading"
          :subtitle="`${store.directLoginRate.toFixed(1)}% of opens`"
          tooltip="Completed phone + OTP login without ever going through guest mode."
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              Direct Login vs Guest
              <InfoTooltip text="Of everyone who reached a completed sign-in from this screen, how many logged in directly vs went through guest mode first." />
            </div>

            <v-skeleton-loader v-if="store.loading" type="image" height="240" />

            <LinkOpensChart
              v-else
              :labels="['Logged In Directly', 'Continued as Guest']"
              :series="breakdownSeries"
              :colors="['#00925A', '#8E6FF7']"
              total-label="Sign-ins"
              :height="240"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              Recent Events
              <InfoTooltip text="The 50 most recent funnel events, newest first. One document per occurrence in login_screen_events." />
            </div>

            <v-data-table
              :headers="headers"
              :items="store.recentEvents"
              :items-per-page="10"
              :loading="store.loading"
              density="compact"
              class="elevation-1"
            >
              <template v-slot:[`item.type`]="{ item }">
                <v-chip :color="typeChipColor[item.type]" size="small" variant="tonal">
                  {{ typeLabel[item.type] || item.type }}
                </v-chip>
              </template>

              <template v-slot:[`item.resultUid`]="{ item }">
                <span class="text-caption font-mono">{{ item.resultUid || '—' }}</span>
              </template>

              <template v-slot:[`item.createdAt`]="{ item }">
                {{ formatDateTime(item.createdAt) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: 'Roboto Mono', monospace;
}
</style>
