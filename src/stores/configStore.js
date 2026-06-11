import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getAppConfig, updateAppConfig } from '@/services/configService'

export const useConfigStore = defineStore('config', () => {
    const config = ref({})

    const loading = ref(false)
    const loaded = ref(false)
    const saving = ref(false)
    const lastUpdated = ref(null)
    const error = ref(null)

    async function loadConfig(forceRefresh = false) {
        if (loaded.value && !forceRefresh) return

        try {
            loading.value = true
            error.value = null

            config.value = await getAppConfig()
            loaded.value = true
        } catch (err) {
            console.error('Error loading app config:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function saveConfig(updates, adminUser) {
        try {
            saving.value = true
            error.value = null

            await updateAppConfig(updates, config.value, adminUser)

            config.value = { ...config.value, ...updates }
            lastUpdated.value = new Date()
        } catch (err) {
            console.error('Error saving app config:', err)
            error.value = err.message
            throw err
        } finally {
            saving.value = false
        }
    }

    function refresh() {
        return loadConfig(true)
    }

    return {
        config,
        loading,
        loaded,
        saving,
        lastUpdated,
        error,
        loadConfig,
        saveConfig,
        refresh,
    }
})
