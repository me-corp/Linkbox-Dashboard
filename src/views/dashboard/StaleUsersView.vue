<script setup>
import { computed, onMounted, ref } from 'vue'

import { useUsersStore } from '@/stores/usersStore'
import UserDetailsDrawer from '@/components/users/UserDetailsDrawer.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import { getUserMaxVersions } from '@/services/dataIntegrityService'

const usersStore = useUsersStore()

// ---- version data ----

const userVersions   = ref({}) // userId → max appVersion string
const versionsLoading = ref(false)
const versionsLoaded  = ref(false)

async function loadVersions() {
    versionsLoading.value = true
    try {
        userVersions.value = await getUserMaxVersions()
        versionsLoaded.value = true
    } catch (e) {
        console.error(e)
    } finally {
        versionsLoading.value = false
    }
}

onMounted(() => {
    usersStore.loadUsers()
    loadVersions()
})

// ---- filters ----

const inactiveDays = ref(30)
const inactiveDayOptions = [
    { label: '7 days',   value: 7   },
    { label: '14 days',  value: 14  },
    { label: '30 days',  value: 30  },
    { label: '60 days',  value: 60  },
    { label: '90 days',  value: 90  },
    { label: '6 months', value: 180 },
]

const filterZeroLinks    = ref(false)
const filterZeroFolders  = ref(false)
const filterUserType     = ref('all') // 'all' | 'guest' | 'registered'

// Version filter
// minVersion: empty string = no lower bound
// versionFilterMode:
//   'all'      – no version filtering
//   'below'    – only show users whose max version is BELOW minVersion
//                (i.e. likely stale because activity wasn't tracked yet)
//   'above'    – only show users whose max version is AT OR ABOVE minVersion
//   'unknown'  – only show users with no devices_info record at all
const versionFilterMode = ref('all')
const minVersion        = ref('')
const includeUnknownVersion = ref(true)

// ---- semver compare (same logic as service) ----

function compareSemver(a, b) {
    const pa = (a || '0').split('.').map(Number)
    const pb = (b || '0').split('.').map(Number)
    for (let i = 0; i < 3; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0)
        if (diff !== 0) return diff
    }
    return 0
}

// ---- computed results ----

const staleUsers = computed(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - inactiveDays.value)

    return usersStore.users.filter(user => {
        // 1. Must be inactive for the selected period
        const lastActivity = user.lastActivityAt?.toDate?.()
        const isInactive = !lastActivity || lastActivity < cutoff
        if (!isInactive) return false

        // 2. Content filters
        if (filterZeroLinks.value   && (user.linksCount   ?? 0) > 0) return false
        if (filterZeroFolders.value && (user.foldersCount ?? 0) > 0) return false

        // 3. User type
        if (filterUserType.value === 'guest'      && user.isGuest !== true)  return false
        if (filterUserType.value === 'registered' && user.isGuest !== false) return false

        // 4. Version filter (only applied when versions are loaded)
        if (versionsLoaded.value && versionFilterMode.value !== 'all') {
            const userVer = userVersions.value[user.id]
            const hasVersion = !!userVer
            const threshold  = minVersion.value.trim()

            if (versionFilterMode.value === 'unknown') {
                if (hasVersion) return false
            } else if (versionFilterMode.value === 'below') {
                // User has no version → treat as unknown
                if (!hasVersion) return includeUnknownVersion.value
                if (!threshold)  return true // no threshold set, pass all known
                return compareSemver(userVer, threshold) < 0
            } else if (versionFilterMode.value === 'above') {
                if (!hasVersion) return includeUnknownVersion.value
                if (!threshold)  return true
                return compareSemver(userVer, threshold) >= 0
            }
        } else if (versionsLoaded.value && versionFilterMode.value === 'all') {
            // Even in "all" mode, respect the unknown-version toggle
            const userVer = userVersions.value[user.id]
            if (!userVer && !includeUnknownVersion.value) return false
        }

        return true
    })
})

const stalePct = computed(() => {
    if (!usersStore.users.length) return 0
    return ((staleUsers.value.length / usersStore.users.length) * 100).toFixed(1)
})

// ---- breakdown stats ----

const zeroLinksCount   = computed(() => staleUsers.value.filter(u => (u.linksCount   ?? 0) === 0).length)
const zeroFoldersCount = computed(() => staleUsers.value.filter(u => (u.foldersCount ?? 0) === 0).length)
const neverActiveCount = computed(() => staleUsers.value.filter(u => !u.lastActivityAt).length)
const unknownVersionCount = computed(() =>
    staleUsers.value.filter(u => !userVersions.value[u.id]).length
)

// ---- table ----

const headers = [
    { title: 'User',           key: 'name',              sortable: false },
    { title: 'Type',           key: 'isGuest',           sortable: false },
    { title: 'App Version',    key: 'appVersion',        sortable: false },
    { title: 'Last Active',    key: 'lastActivityAt'                     },
    { title: 'Links',          key: 'linksCount'                         },
    { title: 'Folders',        key: 'foldersCount'                       },
    { title: 'Added Folders',  key: 'addedFoldersCount'                  },
    { title: 'Joined',         key: 'createdAt'                          },
    { title: '',               key: 'view',              sortable: false },
]

// ---- drawer ----

const showDrawer   = ref(false)
const selectedUser = ref(null)

function viewUser(user) {
    selectedUser.value = user
    showDrawer.value   = true
}

// ---- helpers ----

function formatDate(timestamp) {
    if (!timestamp?.toDate) return '—'
    return timestamp.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    })
}

function displayName(user) {
    return user.name || user.username || user.id
}
</script>

<template>
    <div>
        <div class="mb-2">
            <h1>Stale Users</h1>
            <div class="text-body-2 text-medium-emphasis mt-1">
                Users who have been inactive for the selected period.
                Link, folder, and added-folder counts are read directly from the user document.
            </div>
        </div>

        <!-- Filters -->
        <v-card class="mb-4 mt-4">
            <v-card-text class="d-flex flex-wrap ga-6">

                <!-- Inactivity period -->
                <div>
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
                        INACTIVE FOR MORE THAN
                    </div>
                    <v-btn-toggle
                        v-model="inactiveDays"
                        mandatory
                        color="primary"
                        variant="outlined"
                        density="comfortable"
                    >
                        <v-btn
                            v-for="opt in inactiveDayOptions"
                            :key="opt.value"
                            :value="opt.value"
                            size="small"
                        >
                            {{ opt.label }}
                        </v-btn>
                    </v-btn-toggle>
                </div>

                <v-divider vertical class="d-none d-sm-flex" />

                <!-- Content -->
                <div>
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
                        CONTENT
                    </div>
                    <div class="d-flex ga-2">
                        <v-checkbox
                            v-model="filterZeroLinks"
                            label="0 links"
                            hide-details
                            density="comfortable"
                        />
                        <v-checkbox
                            v-model="filterZeroFolders"
                            label="0 folders"
                            hide-details
                            density="comfortable"
                        />
                    </div>
                </div>

                <v-divider vertical class="d-none d-sm-flex" />

                <!-- User type -->
                <div>
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
                        USER TYPE
                    </div>
                    <v-btn-toggle
                        v-model="filterUserType"
                        mandatory
                        color="primary"
                        variant="outlined"
                        density="comfortable"
                    >
                        <v-btn value="all"        size="small">All</v-btn>
                        <v-btn value="guest"      size="small">Guest</v-btn>
                        <v-btn value="registered" size="small">Registered</v-btn>
                    </v-btn-toggle>
                </div>

                <v-divider vertical class="d-none d-sm-flex" />

                <!-- Version filter -->
                <div>
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center">
                        APP VERSION
                        <InfoTooltip text="Sourced from devices_info collection. Each user's highest recorded appVersion across all their devices is used. Users with no devices_info document have 'Unknown' version." />
                        <v-progress-circular
                            v-if="versionsLoading"
                            size="12"
                            width="2"
                            indeterminate
                            class="ml-2"
                        />
                    </div>

                    <div class="d-flex flex-wrap ga-2 align-center">
                        <v-btn-toggle
                            v-model="versionFilterMode"
                            mandatory
                            color="primary"
                            variant="outlined"
                            density="comfortable"
                        >
                            <v-btn value="all"     size="small">All</v-btn>
                            <v-btn value="below"   size="small">Below</v-btn>
                            <v-btn value="above"   size="small">Above / equal</v-btn>
                            <v-btn value="unknown" size="small">Unknown only</v-btn>
                        </v-btn-toggle>

                        <v-text-field
                            v-if="versionFilterMode === 'below' || versionFilterMode === 'above'"
                            v-model="minVersion"
                            placeholder="e.g. 1.2.0"
                            density="compact"
                            variant="outlined"
                            hide-details
                            style="max-width: 120px"
                        />
                    </div>

                    <div
                        v-if="(versionFilterMode === 'below' || versionFilterMode === 'above') && versionsLoaded"
                        class="mt-2"
                    >
                        <v-checkbox
                            v-model="includeUnknownVersion"
                            label="Include users with no version recorded"
                            hide-details
                            density="comfortable"
                        />
                    </div>
                </div>

            </v-card-text>
        </v-card>

        <!-- Results -->
        <template v-if="!usersStore.loading">

            <v-alert type="warning" variant="tonal" class="mb-4">
                <strong>{{ staleUsers.length }}</strong> stale users
                ({{ stalePct }}% of {{ usersStore.users.length }} total)
                inactive for more than {{ inactiveDays }} days
            </v-alert>

            <v-row class="mb-4">
                <v-col cols="12" sm="3">
                    <v-card variant="tonal" color="warning">
                        <v-card-text class="text-center">
                            <div class="text-h5 font-weight-black">{{ neverActiveCount }}</div>
                            <div class="text-caption d-flex align-center justify-center">
                                Never active
                                <InfoTooltip text="Users with no lastActivityAt field — signed up but never triggered an activity event." />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" sm="3">
                    <v-card variant="tonal" color="error">
                        <v-card-text class="text-center">
                            <div class="text-h5 font-weight-black">{{ unknownVersionCount }}</div>
                            <div class="text-caption d-flex align-center justify-center">
                                Unknown version
                                <InfoTooltip text="Stale users with no devices_info record — likely on an old version that didn't track activity or never logged in after install." />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" sm="3">
                    <v-card variant="tonal" color="error">
                        <v-card-text class="text-center">
                            <div class="text-h5 font-weight-black">{{ zeroLinksCount }}</div>
                            <div class="text-caption d-flex align-center justify-center">
                                0 links
                                <InfoTooltip text="Users where the linksCount field on their user document is 0 or missing." />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" sm="3">
                    <v-card variant="tonal" color="error">
                        <v-card-text class="text-center">
                            <div class="text-h5 font-weight-black">{{ zeroFoldersCount }}</div>
                            <div class="text-caption d-flex align-center justify-center">
                                0 folders
                                <InfoTooltip text="Users where the foldersCount field on their user document is 0 or missing." />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Table -->
            <v-data-table
                :headers="headers"
                :items="staleUsers"
                :items-per-page="50"
                class="elevation-1"
            >
                <template v-slot:[`item.name`]="{ item }">
                    <div class="d-flex align-center ga-2 py-2">
                        <v-avatar size="32" color="surface-bright">
                            <v-img v-if="item.pic" :src="item.pic" cover />
                            <v-icon v-else color="primary" size="18">mdi-account</v-icon>
                        </v-avatar>
                        <div>
                            <div class="font-weight-bold text-body-2">{{ displayName(item) }}</div>
                            <div v-if="item.username" class="text-caption text-medium-emphasis">
                                @{{ item.username }}
                            </div>
                        </div>
                    </div>
                </template>

                <template v-slot:[`item.isGuest`]="{ item }">
                    <v-chip
                        size="small"
                        :color="item.isGuest ? undefined : 'primary'"
                        variant="tonal"
                    >
                        {{ item.isGuest ? 'Guest' : 'Registered' }}
                    </v-chip>
                </template>

                <template v-slot:[`item.appVersion`]="{ item }">
                    <v-chip
                        size="small"
                        :color="userVersions[item.id] ? undefined : 'warning'"
                        variant="tonal"
                    >
                        {{ userVersions[item.id] || 'Unknown' }}
                    </v-chip>
                </template>

                <template v-slot:[`item.lastActivityAt`]="{ item }">
                    <span :class="{ 'text-error font-weight-bold': !item.lastActivityAt }">
                        {{ item.lastActivityAt ? formatDate(item.lastActivityAt) : 'Never' }}
                    </span>
                </template>

                <template v-slot:[`item.linksCount`]="{ item }">
                    <v-chip
                        size="small"
                        :color="(item.linksCount ?? 0) === 0 ? 'error' : undefined"
                        variant="tonal"
                    >
                        {{ item.linksCount ?? 0 }}
                    </v-chip>
                </template>

                <template v-slot:[`item.foldersCount`]="{ item }">
                    <v-chip
                        size="small"
                        :color="(item.foldersCount ?? 0) === 0 ? 'error' : undefined"
                        variant="tonal"
                    >
                        {{ item.foldersCount ?? 0 }}
                    </v-chip>
                </template>

                <template v-slot:[`item.addedFoldersCount`]="{ item }">
                    {{ item.addedFoldersCount ?? 0 }}
                </template>

                <template v-slot:[`item.createdAt`]="{ item }">
                    {{ formatDate(item.createdAt) }}
                </template>

                <template v-slot:[`item.view`]="{ item }">
                    <v-btn icon variant="text" @click="viewUser(item)">
                        <v-icon>mdi-eye</v-icon>
                    </v-btn>
                </template>
            </v-data-table>
        </template>

        <v-skeleton-loader v-else type="table" />
    </div>

    <UserDetailsDrawer v-model="showDrawer" :user="selectedUser" />
</template>
