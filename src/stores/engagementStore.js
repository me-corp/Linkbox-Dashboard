import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
    getFolderEngagementAggregate,
    getFolderVisibilityCounts,
    getFavouriteFoldersCount,
    getTopFoldersByVisits,
    getNotificationReadStats,
} from '@/services/engagementService'

import { useDashboardStore } from '@/stores/dashboardStore'

export const useEngagementStore = defineStore('engagement', () => {
    const folderEngagement = ref({ totalVisits: 0, avgVisits: 0 })
    const visibility = ref({ public: 0, private: 0 })
    const favouriteFoldersCount = ref(0)
    const topFolders = ref([])
    const notificationReadStats = ref({ read: 0, unread: 0 })

    const loading = ref(false)
    const loaded = ref(false)
    const error = ref(null)

    const dashboardStore = useDashboardStore()

    const avgLinksPerUser = computed(() => {
        const totalUsers = dashboardStore.totalUsers
        return totalUsers > 0 ? dashboardStore.totalLinks / totalUsers : 0
    })

    const avgFoldersPerUser = computed(() => {
        const totalUsers = dashboardStore.totalUsers
        return totalUsers > 0 ? dashboardStore.totalFolders / totalUsers : 0
    })

    async function loadEngagement(forceRefresh = false) {
        if (loaded.value && !forceRefresh) return

        try {
            loading.value = true
            error.value = null

            const [aggregate, visibilityCounts, favourites, top, notifStats] = await Promise.all([
                getFolderEngagementAggregate(),
                getFolderVisibilityCounts(),
                getFavouriteFoldersCount(),
                getTopFoldersByVisits(10),
                getNotificationReadStats(),
                dashboardStore.loadOverview(),
            ])

            folderEngagement.value = aggregate
            visibility.value = visibilityCounts
            favouriteFoldersCount.value = favourites
            topFolders.value = top
            notificationReadStats.value = notifStats
            loaded.value = true
        } catch (err) {
            console.error('Error loading engagement data:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    function refresh() {
        return loadEngagement(true)
    }

    return {
        folderEngagement,
        visibility,
        favouriteFoldersCount,
        topFolders,
        notificationReadStats,
        loading,
        loaded,
        error,
        avgLinksPerUser,
        avgFoldersPerUser,
        loadEngagement,
        refresh,
    }
})
