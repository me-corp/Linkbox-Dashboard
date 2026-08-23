import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
    getGuestConversionCounts,
    getGuestConversionTiming,
    getRecentGuestConversionEvents,
} from '@/services/guestConversionService'

export const useGuestConversionStore = defineStore('guestConversion', () => {
    const counts = ref({ shown: 0, dismissed: 0, converted: 0, backedOut: 0 })
    const timing = ref({ convertedAvgMs: 0, backedOutAvgMs: 0 })
    const recentEvents = ref([])

    const loading = ref(false)
    const loaded = ref(false)
    const error = ref(null)

    const conversionRate = computed(() => {
        const total = counts.value.shown
        return total > 0 ? (counts.value.converted / total) * 100 : 0
    })

    async function loadGuestConversion(forceRefresh = false) {
        if (loaded.value && !forceRefresh) return

        try {
            loading.value = true
            error.value = null

            const [countsResult, timingResult, events] = await Promise.all([
                getGuestConversionCounts(),
                getGuestConversionTiming(),
                getRecentGuestConversionEvents(50),
            ])

            counts.value = countsResult
            timing.value = timingResult
            recentEvents.value = events
            loaded.value = true
        } catch (err) {
            console.error('Error loading guest conversion insights:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    function refresh() {
        return loadGuestConversion(true)
    }

    return {
        counts,
        timing,
        recentEvents,
        loading,
        loaded,
        error,
        conversionRate,
        loadGuestConversion,
        refresh,
    }
})
