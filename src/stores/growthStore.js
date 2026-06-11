import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getUserGrowthSeries } from '@/services/userAnalyticsService'
import { getDeviceBreakdown } from '@/services/analyticsService'

export const useGrowthStore = defineStore('growth', () => {
    const userGrowthSeries = ref({ labels: [], cumulative: [], newUsers: [] })
    const deviceBreakdown = ref({ labels: [], counts: [] })

    const loading = ref(false)
    const loaded = ref(false)
    const error = ref(null)

    async function loadUserGrowthSeries(weeks = 8, forceRefresh = false) {
        if (loaded.value && !forceRefresh) {
            return userGrowthSeries.value
        }

        try {
            loading.value = true
            error.value = null

            const [series, devices] = await Promise.all([
                getUserGrowthSeries(weeks),
                getDeviceBreakdown(),
            ])

            userGrowthSeries.value = series
            deviceBreakdown.value = devices
            loaded.value = true

            return userGrowthSeries.value
        } catch (err) {
            console.error('Error loading user growth series:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    function refresh() {
        return loadUserGrowthSeries(8, true)
    }

    return {
        userGrowthSeries,
        deviceBreakdown,
        loading,
        loaded,
        error,
        loadUserGrowthSeries,
        refresh,
    }
})
