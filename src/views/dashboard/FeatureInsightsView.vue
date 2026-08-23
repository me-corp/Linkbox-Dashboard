<script setup>
import { ref } from 'vue'

import { usePermissions } from '@/composables/usePermissions'
import { useGuestConversionStore } from '@/stores/guestConversionStore'
import { useLoginScreenInsightsStore } from '@/stores/loginScreenInsightsStore'

import InsightsHeader from '@/components/common/InsightsHeader.vue'
import GuestConversionInsights from '@/components/insights/GuestConversionInsights.vue'
import LoginScreenInsights from '@/components/insights/LoginScreenInsights.vue'

const { hasPermission } = usePermissions()
const guestConversionStore = useGuestConversionStore()
const loginScreenInsightsStore = useLoginScreenInsightsStore()

// One tab per insight panel — add a new panel component + v-tab/v-window-item
// pair here as more feature insights get added, gated on its own permission.
const tab = ref('guestConversion')

function handleRefresh() {
  if (tab.value === 'guestConversion') guestConversionStore.refresh()
  if (tab.value === 'loginScreen') loginScreenInsightsStore.refresh()
}
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="Smaller, feature-specific insights that don't warrant their own analytics page."
      @refresh="handleRefresh"
    />

    <v-card>
      <v-tabs v-model="tab" color="primary" show-arrows>
        <v-tab v-if="hasPermission('insights:guest_conversion:view')" value="guestConversion">
          Guest Conversion
        </v-tab>
        <v-tab v-if="hasPermission('insights:login_screen:view')" value="loginScreen">
          Login Screen
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="guestConversion">
            <GuestConversionInsights />
          </v-window-item>
          <v-window-item value="loginScreen">
            <LoginScreenInsights />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>
