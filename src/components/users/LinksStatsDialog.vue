<script setup>
import { computed, watch, ref } from 'vue'
import { useLinksStore } from '@/stores/linksStore'

const props = defineProps({
    modelValue: Boolean,
    user: Object,
})

const emit = defineEmits(['update:modelValue'])

const linksStore = useLinksStore()
const showStats = ref(true) // Toggle between stats view and detailed list

// Load stats on dialog open
watch(
    () => [props.modelValue, props.user?.id],
    async ([isOpen, userId]) => {
        if (!isOpen || !userId) return

        try {
            await Promise.all([
                linksStore.loadUserLinkStats(userId),
                linksStore.loadUserLinks(userId),
            ])
        } catch (error) {
            console.error('Failed to load links:', error)
        }
    },
    { immediate: true }
)

const linkStats = computed(() => {
    if (!props.user?.id) return null
    return linksStore.userLinkStats[props.user.id] || null
})

const linksGroupedByFolder = computed(() => {
    if (!props.user?.id) return []
    return linksStore.userLinksSortedByFolder(props.user.id)
})

const isLoadingStats = computed(() => {
    if (!props.user?.id) return false
    return linksStore.loadingUserLinkStats[props.user.id]
})

const isLoadingLinks = computed(() => {
    if (!props.user?.id) return false
    return linksStore.loadingUserLinks[props.user.id]
})

async function refreshStats() {
    if (!props.user?.id) return
    try {
        await linksStore.refreshUserLinkStats(props.user.id)
        await linksStore.refreshUserLinks(props.user.id)
    } catch (error) {
        console.error('Failed to refresh links:', error)
    }
}

function formatDate(timestamp) {
    if (!timestamp) return '-'
    const date = timestamp.toDate?.() || new Date(timestamp)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function formatTime(timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate?.() || new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

function truncateUrl(url, maxLength = 60) {
    if (!url) return '-'
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
}
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        max-width="800"
        scrollable
    >
        <v-card>
            <!-- Header -->
            <v-card-title class="d-flex align-center justify-space-between pa-4">
                <div>
                    <div class="text-h6">User Links</div>
                    <div class="text-caption text-grey">{{ user?.name }} (@{{ user?.username }})</div>
                </div>
                <v-btn
                    icon
                    variant="text"
                    size="small"
                    :loading="isLoadingStats || isLoadingLinks"
                    @click="refreshStats"
                >
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </v-card-title>

            <v-divider />

            <!-- Toggle between Stats and List -->
            <v-toolbar density="compact" class="px-4">
                <v-btn-toggle
                    v-model="showStats"
                    class="d-flex"
                    divided
                    mandatory
                >
                    <v-btn value="stats" class="flex-grow-1">
                        <v-icon start>mdi-chart-box-outline</v-icon>
                        Statistics
                    </v-btn>
                    <v-btn value="list" class="flex-grow-1">
                        <v-icon start>mdi-format-list-bulleted</v-icon>
                        Links List
                    </v-btn>
                </v-btn-toggle>
            </v-toolbar>

            <v-divider />

            <!-- Stats View -->
            <v-card-text v-if="showStats === 'stats'" class="pa-4">
                <div v-if="isLoadingStats" class="text-center py-6">
                    <v-progress-circular indeterminate color="primary" />
                </div>

                <div v-else-if="linkStats">
                    <!-- Total Stats -->
                    <v-row class="mb-6">
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="outlined" class="text-center pa-4">
                                <div class="text-caption text-grey mb-2">Total Links</div>
                                <div class="text-h5 font-weight-bold">
                                    {{ linkStats.totalLinks }}
                                </div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="outlined" class="text-center pa-4">
                                <div class="text-caption text-grey mb-2">Today</div>
                                <div class="text-h5 font-weight-bold text-blue">
                                    {{ linkStats.dateStats.today }}
                                </div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="outlined" class="text-center pa-4">
                                <div class="text-caption text-grey mb-2">This Week</div>
                                <div class="text-h5 font-weight-bold text-green">
                                    {{ linkStats.dateStats.thisWeek }}
                                </div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="outlined" class="text-center pa-4">
                                <div class="text-caption text-grey mb-2">This Month</div>
                                <div class="text-h5 font-weight-bold text-orange">
                                    {{ linkStats.dateStats.thisMonth }}
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Folder Breakdown -->
                    <div class="mb-4">
                        <div class="text-subtitle-2 font-weight-bold mb-3">Links by Folder</div>
                        <v-list class="bordered">
                            <v-list-item
                                v-for="(folder, idx) in Object.values(linkStats.folderStats)"
                                :key="idx"
                                class="mb-2"
                            >
                                <v-list-item-title>
                                    <v-icon size="small" class="mr-2">mdi-folder</v-icon>
                                    {{ folder.folderName }}
                                </v-list-item-title>
                                <template v-slot:append>
                                    <v-chip
                                        color="primary"
                                        variant="tonal"
                                        size="small"
                                    >
                                        {{ folder.count }} link{{ folder.count !== 1 ? 's' : '' }}
                                    </v-chip>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>

                    <v-alert type="info" variant="tonal" icon="mdi-information" class="mt-4">
                        This data is aggregated for privacy and performance. For detailed link
                        information, view the Links List tab.
                    </v-alert>
                </div>

                <div v-else class="text-center py-6">
                    <v-icon size="large" class="text-grey mb-3">mdi-link-off</v-icon>
                    <div class="text-grey">No link data available</div>
                </div>
            </v-card-text>

            <!-- List View -->
            <v-card-text v-else class="pa-4">
                <div v-if="isLoadingLinks" class="text-center py-6">
                    <v-progress-circular indeterminate color="primary" />
                </div>

                <div v-else-if="linksGroupedByFolder.length > 0">
                    <div v-for="folderGroup in linksGroupedByFolder" :key="folderGroup.folderId">
                        <!-- Folder Header -->
                        <div class="mb-3 mt-4">
                            <v-chip
                                variant="outlined"
                                prepend-icon="mdi-folder"
                                class="font-weight-bold"
                            >
                                {{ folderGroup.folderName }}
                                <v-chip
                                    size="x-small"
                                    class="ml-2"
                                    color="primary"
                                    variant="tonal"
                                >
                                    {{ folderGroup.links.length }}
                                </v-chip>
                            </v-chip>
                        </div>

                        <!-- Links in Folder -->
                        <div class="bordered rounded pa-2 mb-4">
                            <div
                                v-for="link in folderGroup.links"
                                :key="link.id"
                                class="mb-3 pb-3"
                                :class="{ 'border-bottom': link !== folderGroup.links[folderGroup.links.length - 1] }"
                            >
                                <div class="d-flex gap-3">
                                    <!-- Image Thumbnail -->
                                    <div v-if="link.imageURL" class="flex-shrink-0">
                                        <v-img
                                            :src="link.imageURL"
                                            :width="56"
                                            :height="56"
                                            cover
                                            rounded="sm"
                                            class="bg-grey-lighten-3"
                                        >
                                            <template v-slot:error>
                                                <div class="d-flex align-center justify-center h-100">
                                                    <v-icon size="small" color="grey">mdi-image-broken</v-icon>
                                                </div>
                                            </template>
                                        </v-img>
                                    </div>

                                    <div class="flex-grow-1 min-width-0">
                                        <!-- Link Title + Status Badges -->
                                        <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                                            <div class="text-subtitle-2 font-weight-bold">
                                                {{ link.title || link.link || 'Untitled Link' }}
                                            </div>
                                            <v-chip
                                                v-if="link.IsDeleted"
                                                size="x-small"
                                                color="error"
                                                variant="tonal"
                                            >
                                                <v-icon size="x-small" start>mdi-delete-outline</v-icon>
                                                Deleted
                                            </v-chip>
                                            <v-chip
                                                v-if="link.IsHidden"
                                                size="x-small"
                                                color="warning"
                                                variant="tonal"
                                            >
                                                <v-icon size="x-small" start>mdi-eye-off-outline</v-icon>
                                                Hidden
                                            </v-chip>
                                        </div>

                                        <!-- Link URL -->
                                        <div class="text-caption text-grey mb-2">
                                            <v-icon size="x-small" class="mr-1">mdi-link</v-icon>
                                            <a
                                                :href="link.link"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="text-grey link-url"
                                            >{{ truncateUrl(link.link) }}</a>
                                        </div>

                                        <!-- Link Metadata -->
                                        <div class="d-flex flex-wrap gap-2 align-center mb-2">
                                            <v-chip size="x-small" variant="outlined" v-if="link.createdAt">
                                                <v-icon size="x-small" start>mdi-calendar</v-icon>
                                                {{ formatDate(link.createdAt) }}
                                            </v-chip>

                                            <v-chip size="x-small" variant="outlined" v-if="link.createdAt">
                                                <v-icon size="x-small" start>mdi-clock-outline</v-icon>
                                                {{ formatTime(link.createdAt) }}
                                            </v-chip>

                                            <v-chip
                                                v-if="link.imageURL && link.imageWidth && link.imageHeight"
                                                size="x-small"
                                                variant="outlined"
                                            >
                                                <v-icon size="x-small" start>mdi-image-size-select-actual</v-icon>
                                                {{ link.imageWidth }}×{{ link.imageHeight }}
                                            </v-chip>
                                        </div>

                                        <!-- Link Description Preview -->
                                        <div
                                            v-if="link.description"
                                            class="text-caption text-grey-lighten-1 pl-2 border-left border-grey"
                                        >
                                            {{ link.description.substring(0, 150) }}{{
                                                link.description.length > 150 ? '...' : ''
                                            }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-6">
                    <v-icon size="large" class="text-grey mb-3">mdi-link-off</v-icon>
                    <div class="text-grey">No links found for this user</div>
                </div>
            </v-card-text>

            <!-- Privacy Notice Footer -->
            <v-divider />
            <v-card-text class="pa-3 bg-blue-lighten-5">
                <div class="text-caption text-grey-darken-1">
                    <v-icon size="x-small" class="mr-1">mdi-shield-check-outline</v-icon>
                    <strong>Privacy Notice:</strong> This view displays aggregated link statistics and
                    metadata only. Individual link content and sensitive user data are protected.
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.border-bottom {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.border-left {
    border-left-width: 2px;
    border-left-style: solid;
}

.bordered {
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
}

.gap-2 {
    gap: 0.5rem;
}

.gap-3 {
    gap: 0.75rem;
}

.min-width-0 {
    min-width: 0;
}

.link-url {
    text-decoration: none;
}

.link-url:hover {
    text-decoration: underline;
}
</style>
