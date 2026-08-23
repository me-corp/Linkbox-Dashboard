<script setup>
import { computed, onMounted, ref } from 'vue'
import { Timestamp } from 'firebase/firestore'

import { useConfigStore } from '@/stores/configStore'
import { useAuthStore } from '@/stores/authStore'

import InsightsHeader from '@/components/common/InsightsHeader.vue'

const configStore = useConfigStore()
const authStore = useAuthStore()

const form = ref(null)
const baseline = ref(null)
const snackbar = ref(false)
const showMaintenanceConfirm = ref(false)

const featureToggles = [
  { key: 'showBuildNumber', label: 'Show Build Number', hint: 'Display the app build/version number to users.' },
  { key: 'showDevicesLoggedIn', label: 'Show Devices Logged In', hint: 'Let users see which devices are signed into their account.' },
  { key: 'showNotifications', label: 'Show Notifications', hint: 'Enable the in-app notifications panel.' },
  { key: 'showTipsAndTricks', label: 'Show Tips & Tricks', hint: 'Surface onboarding tips and tricks.' },
  { key: 'showRateMeUpdate', label: "Show 'Rate Us' Prompt", hint: 'Periodically ask users to rate the app.' },
  { key: 'showPingMeUpdate', label: "Show 'PingMe' Update", hint: 'Promote the PingMe feature/waitlist to users.' },
  { key: 'showMoreAppsUpdate', label: "Show 'More Apps' Update", hint: 'Cross-promote other AppsByMe apps.' },
  { key: 'guestLoginEnabled', label: 'Guest Login Enabled', hint: 'Show the "Continue as guest" option on the login screen.' },
  { key: 'promptGuestConversion', label: 'Prompt Guest Conversion', hint: 'Nudge already-active guests to log in, on every app open.' },
]

function toDatetimeLocal(timestamp) {
  if (!timestamp?.toDate) return ''

  const date = timestamp.toDate()
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)

  return local.toISOString().slice(0, 16)
}

function fromDatetimeLocal(value) {
  if (!value) return null
  return Timestamp.fromDate(new Date(value))
}

function buildForm(config) {
  return {
    underMaintenance: config.underMaintenance ?? false,
    underMaintenanceUntil: toDatetimeLocal(config.underMaintenanceUntil),

    freeProFor60DaysCampaign: config.freeProFor60DaysCampaign ?? false,
    freeProFor60DaysCampaignExpiry: toDatetimeLocal(config.freeProFor60DaysCampaignExpiry),

    showBuildNumber: config.showBuildNumber ?? false,
    showDevicesLoggedIn: config.showDevicesLoggedIn ?? false,
    showNotifications: config.showNotifications ?? false,
    showTipsAndTricks: config.showTipsAndTricks ?? false,
    showRateMeUpdate: config.showRateMeUpdate ?? false,
    showPingMeUpdate: config.showPingMeUpdate ?? false,
    showMoreAppsUpdate: config.showMoreAppsUpdate ?? false,

    guestLoginEnabled: config.guestLoginEnabled ?? true,
    promptGuestConversion: config.promptGuestConversion ?? false,
    forceGuestConversionHardBlock: config.forceGuestConversionHardBlock ?? false,
  }
}

function syncFormFromStore() {
  const built = buildForm(configStore.config)
  form.value = { ...built }
  baseline.value = { ...built }
}

onMounted(async () => {
  await configStore.loadConfig()
  syncFormFromStore()
})

async function handleRefresh() {
  await configStore.refresh()
  syncFormFromStore()
}

const dirty = computed(() => {
  if (!form.value || !baseline.value) return false
  return Object.keys(form.value).some(key => form.value[key] !== baseline.value[key])
})

function buildUpdates() {
  const updates = {}

  Object.keys(form.value).forEach(key => {
    if (form.value[key] === baseline.value[key]) return

    if (key === 'underMaintenanceUntil' || key === 'freeProFor60DaysCampaignExpiry') {
      updates[key] = fromDatetimeLocal(form.value[key])
    } else {
      updates[key] = form.value[key]
    }
  })

  return updates
}

function discardChanges() {
  form.value = { ...baseline.value }
}

async function performSave() {
  const updates = buildUpdates()
  if (!Object.keys(updates).length) return

  await configStore.saveConfig(updates, { email: authStore.user?.email })
  baseline.value = { ...form.value }
  showMaintenanceConfirm.value = false
  snackbar.value = true
}

function handleSaveClick() {
  const updates = buildUpdates()

  if (updates.underMaintenance === true) {
    showMaintenanceConfirm.value = true
    return
  }

  performSave()
}
</script>

<template>
  <div>
    <InsightsHeader
      subtitle="App configuration — changes apply to the live app immediately."
      :loading="configStore.loading"
      @refresh="handleRefresh"
    />

    <v-skeleton-loader v-if="configStore.loading && !configStore.loaded" type="article, article, article" />

    <template v-else-if="form">
      <v-row>
        <v-col cols="12" md="6">
          <v-card height="100%">
            <v-card-text>
              <div class="text-subtitle-1 font-weight-bold mb-1">
                Maintenance Mode
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                Shows a maintenance screen to all users instead of the app.
              </div>

              <v-switch
                v-model="form.underMaintenance"
                color="warning"
                label="Under maintenance"
                inset
                hide-details
              />

              <v-text-field
                v-if="form.underMaintenance"
                v-model="form.underMaintenanceUntil"
                type="datetime-local"
                label="Maintenance ends at"
                class="mt-4"
                hide-details
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card height="100%">
            <v-card-text>
              <div class="text-subtitle-1 font-weight-bold mb-1">
                Promotions
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                Run the "Free Pro for 60 Days" signup campaign.
              </div>

              <v-switch
                v-model="form.freeProFor60DaysCampaign"
                color="primary"
                label="Free Pro for 60 Days campaign active"
                inset
                hide-details
              />

              <v-text-field
                v-if="form.freeProFor60DaysCampaign"
                v-model="form.freeProFor60DaysCampaignExpiry"
                type="datetime-local"
                label="Campaign ends at"
                class="mt-4"
                hide-details
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-card>
            <v-card-text>
              <div class="text-subtitle-1 font-weight-bold mb-1">
                App Feature Toggles
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                Control optional UI surfaces shown inside the LinkBox app.
              </div>

              <v-row>
                <v-col v-for="toggle in featureToggles" :key="toggle.key" cols="12" sm="6" md="4">
                  <v-switch
                    v-model="form[toggle.key]"
                    color="primary"
                    :label="toggle.label"
                    :hint="toggle.hint"
                    persistent-hint
                    inset
                  />
                </v-col>

                <v-col v-if="form.promptGuestConversion" cols="12" sm="6" md="4">
                  <v-switch
                    v-model="form.forceGuestConversionHardBlock"
                    color="error"
                    label="Hard Block Guests"
                    hint="Make the guest-conversion prompt non-dismissible instead of a soft nudge."
                    persistent-hint
                    inset
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-card>
            <v-card-text class="d-flex align-center justify-end ga-2">
              <span v-if="dirty" class="text-caption text-medium-emphasis mr-auto">
                You have unsaved changes.
              </span>

              <v-btn variant="text" :disabled="!dirty || configStore.saving" @click="discardChanges">
                Discard
              </v-btn>

              <v-btn color="primary" :disabled="!dirty" :loading="configStore.saving" @click="handleSaveClick">
                Save Changes
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Maintenance mode confirmation -->
    <v-dialog v-model="showMaintenanceConfirm" max-width="480">
      <v-card>
        <v-card-title class="bg-warning text-white">
          Enable Maintenance Mode?
        </v-card-title>

        <v-card-text class="pt-4">
          <v-alert type="warning" variant="tonal" class="mb-4">
            This will show a maintenance screen to <strong>all users</strong> on the live app.
          </v-alert>
          Make sure this is intentional before continuing.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="configStore.saving" @click="showMaintenanceConfirm = false">
            Cancel
          </v-btn>
          <v-btn color="warning" :loading="configStore.saving" @click="performSave">
            Enable Maintenance Mode
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      Configuration saved.
    </v-snackbar>
  </div>
</template>
