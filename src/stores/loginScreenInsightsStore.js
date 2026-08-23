import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
    getLoginScreenCounts,
    getRecentLoginScreenEvents,
} from '@/services/loginScreenInsightsService'

export const useLoginScreenInsightsStore = defineStore('loginScreenInsights', () => {
    const counts = ref({ opened: 0, guestCardOpened: 0, continuedAsGuest: 0, loggedInDirectly: 0 })
    const recentEvents = ref([])

    const loading = ref(false)
    const loaded = ref(false)
    const error = ref(null)

    const guestCardOpenRate = computed(() => {
        const total = counts.value.opened
        return total > 0 ? (counts.value.guestCardOpened / total) * 100 : 0
    })

    const directLoginRate = computed(() => {
        const total = counts.value.opened
        return total > 0 ? (counts.value.loggedInDirectly / total) * 100 : 0
    })

    async function loadLoginScreenInsights(forceRefresh = false) {
        if (loaded.value && !forceRefresh) return

        try {
            loading.value = true
            error.value = null

            const [countsResult, events] = await Promise.all([
                getLoginScreenCounts(),
                getRecentLoginScreenEvents(50),
            ])

            counts.value = countsResult
            recentEvents.value = events
            loaded.value = true
        } catch (err) {
            console.error('Error loading login screen insights:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    function refresh() {
        return loadLoginScreenInsights(true)
    }

    return {
        counts,
        recentEvents,
        loading,
        loaded,
        error,
        guestCardOpenRate,
        directLoginRate,
        loadLoginScreenInsights,
        refresh,
    }
})
