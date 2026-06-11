import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
    getMostActiveUsers,
    getTopProUsers,
    enrichUsersWithCounts,
} from '@/services/powerUsersService'

export const usePowerUsersStore = defineStore('powerUsers', () => {
    const mostActiveUsers = ref([])
    const topProUsers = ref([])

    const loading = ref(false)
    const loaded = ref(false)
    const error = ref(null)

    async function loadPowerUsers(forceRefresh = false) {
        if (loaded.value && !forceRefresh) return

        try {
            loading.value = true
            error.value = null

            const [active, pro] = await Promise.all([
                getMostActiveUsers(10),
                getTopProUsers(10),
            ])

            const [enrichedActive, enrichedPro] = await Promise.all([
                enrichUsersWithCounts(active),
                enrichUsersWithCounts(pro),
            ])

            mostActiveUsers.value = enrichedActive
            topProUsers.value = enrichedPro
            loaded.value = true
        } catch (err) {
            console.error('Error loading power users:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    function refresh() {
        return loadPowerUsers(true)
    }

    return {
        mostActiveUsers,
        topProUsers,
        loading,
        loaded,
        error,
        loadPowerUsers,
        refresh,
    }
})
