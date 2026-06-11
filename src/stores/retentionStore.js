import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
    getActiveUserCounts,
    getRetentionCohorts,
    getDormantUserCounts,
    getChurnReasons,
} from '@/services/userAnalyticsService'

export const useRetentionStore = defineStore('retention', () => {
    const activeCounts = ref({ dau: 0, wau: 0, mau: 0 })
    const cohorts = ref({ labels: [], newUsers: [], activeUsers: [] })
    const dormant = ref({ inactive30: 0, inactive60: 0, inactive90: 0 })
    const churnReasons = ref({ labels: [], counts: [] })

    const loading = ref(false)
    const loaded = ref(false)
    const error = ref(null)

    const stickiness = computed(() => {
        if (!activeCounts.value.mau) return 0
        return Math.round((activeCounts.value.dau / activeCounts.value.mau) * 1000) / 10
    })

    async function loadRetention(forceRefresh = false) {
        if (loaded.value && !forceRefresh) return

        try {
            loading.value = true
            error.value = null

            const [active, cohortData, dormantCounts, churn] = await Promise.all([
                getActiveUserCounts(),
                getRetentionCohorts(8),
                getDormantUserCounts(),
                getChurnReasons(),
            ])

            activeCounts.value = active
            cohorts.value = cohortData
            dormant.value = dormantCounts
            churnReasons.value = churn
            loaded.value = true
        } catch (err) {
            console.error('Error loading retention data:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    function refresh() {
        return loadRetention(true)
    }

    return {
        activeCounts,
        cohorts,
        dormant,
        churnReasons,
        loading,
        loaded,
        error,
        stickiness,
        loadRetention,
        refresh,
    }
})
