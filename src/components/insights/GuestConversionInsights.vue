<script setup>
import { onMounted, computed } from 'vue'

import { useGuestConversionStore } from '@/stores/guestConversionStore'

import StatsCard from '@/components/common/StatsCard.vue'
import LinkOpensChart from '@/components/charts/LinkOpensChart.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'

const store = useGuestConversionStore()

onMounted(() => {
  store.loadGuestConversion()
})

const headers = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Guest UID', key: 'guestUid', sortable: false },
  { title: 'Hard Block', key: 'hardBlock', sortable: false },
  { title: 'Time on Prompt', key: 'msSinceShown', sortable: false },
  { title: 'When', key: 'createdAt', sortable: false },
]

const typeChipColor = {
  shown: 'primary',
  dismissed: 'brand-orange',
  converted: 'success',
  backed_out: 'error',
}

const typeLabel = {
  shown: 'Shown',
  dismissed: 'Dismissed',
  converted: 'Converted',
  backed_out: 'Backed Out',
}

function formatMs(ms) {
  if (!ms && ms !== 0) return '—'
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remSeconds}s`
}

function formatDateTime(timestamp) {
  if (!timestamp?.toDate) return '—'
  return timestamp.toDate().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

const funnelSeries = computed(() => [
  store.counts.converted,
  store.counts.backedOut,
  store.counts.dismissed,
])
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Prompt Shown"
          :value="store.counts.shown.toLocaleString()"
          icon="mdi-eye-outline"
          color="primary"
          :loading="store.loading"
          tooltip="Total impressions of the guest-conversion prompt, including re-prompts in hard-block mode."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Converted"
          :value="store.counts.converted.toLocaleString()"
          icon="mdi-account-check-outline"
          color="success"
          :loading="store.loading"
          :subtitle="`${store.conversionRate.toFixed(1)}% of shown`"
          tooltip="Guests who logged in after seeing the prompt (either via a new number or merging into an existing account)."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Backed Out"
          :value="store.counts.backedOut.toLocaleString()"
          icon="mdi-account-remove-outline"
          color="error"
          :loading="store.loading"
          tooltip="Tapped Login, then returned without completing it — still a guest."
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatsCard
          title="Dismissed"
          :value="store.counts.dismissed.toLocaleString()"
          icon="mdi-close-circle-outline"
          color="brand-orange"
          :loading="store.loading"
          tooltip="Tapped 'Maybe later' — only possible in soft (non-hard-block) mode."
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              Outcome Breakdown
              <InfoTooltip text="How every shown prompt eventually resolved: converted, backed out, or dismissed." />
            </div>

            <v-skeleton-loader v-if="store.loading" type="image" height="240" />

            <LinkOpensChart
              v-else
              :labels="['Converted', 'Backed Out', 'Dismissed']"
              :series="funnelSeries"
              :colors="['#00925A', '#F47874', '#FEA736']"
              total-label="Outcomes"
              :height="240"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text class="d-flex flex-column align-center justify-center text-center" style="min-height: 240px;">
            <v-avatar color="success" variant="tonal" size="56" rounded="lg" class="mb-4">
              <v-icon color="success" size="28">mdi-timer-check-outline</v-icon>
            </v-avatar>

            <div class="text-h4 font-weight-black">
              {{ formatMs(store.timing.convertedAvgMs) }}
            </div>

            <div class="text-body-2 text-medium-emphasis mt-1">
              Avg time to convert
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text class="d-flex flex-column align-center justify-center text-center" style="min-height: 240px;">
            <v-avatar color="error" variant="tonal" size="56" rounded="lg" class="mb-4">
              <v-icon color="error" size="28">mdi-timer-alert-outline</v-icon>
            </v-avatar>

            <div class="text-h4 font-weight-black">
              {{ formatMs(store.timing.backedOutAvgMs) }}
            </div>

            <div class="text-body-2 text-medium-emphasis mt-1">
              Avg time before backing out
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              Recent Events
              <InfoTooltip text="The 50 most recent funnel events, newest first. One document per occurrence in guest_conversion_events." />
            </div>

            <v-data-table
              :headers="headers"
              :items="store.recentEvents"
              :items-per-page="25"
              :loading="store.loading"
              class="elevation-1"
            >
              <template v-slot:[`item.type`]="{ item }">
                <v-chip :color="typeChipColor[item.type]" size="small" variant="tonal">
                  {{ typeLabel[item.type] || item.type }}
                </v-chip>
              </template>

              <template v-slot:[`item.guestUid`]="{ item }">
                <span class="text-caption font-mono">{{ item.guestUid }}</span>
              </template>

              <template v-slot:[`item.hardBlock`]="{ item }">
                <v-chip :color="item.hardBlock ? 'error' : undefined" size="small" variant="tonal">
                  {{ item.hardBlock ? 'Hard' : 'Soft' }}
                </v-chip>
              </template>

              <template v-slot:[`item.msSinceShown`]="{ item }">
                {{ formatMs(item.msSinceShown) }}
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
