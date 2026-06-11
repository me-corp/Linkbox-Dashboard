import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
    getCreatorApplications,
    updateCreatorApplicationStatus,
    getPingMeWaitlist,
    getNewsletterSubscriptions,
    getFeedback,
    getHelpRequests,
} from '@/services/submissionsService'
import { getRecentAdminActivity } from '@/services/adminActivityService'
import { getUsersByIds } from '@/services/userService'

export const useSubmissionsStore = defineStore('submissions', () => {
    const creatorApplications = ref([])
    const waitlist = ref({ count: 0, recent: [] })
    const newsletter = ref({ count: 0, recent: [] })
    const feedback = ref([])
    const help = ref([])
    const activityLog = ref([])

    const loading = ref(false)
    const loaded = ref(false)
    const error = ref(null)

    async function loadSubmissions(forceRefresh = false) {
        if (loaded.value && !forceRefresh) return

        try {
            loading.value = true
            error.value = null

            const [
                applications,
                waitlistData,
                newsletterData,
                feedbackData,
                helpData,
                activity,
            ] = await Promise.all([
                getCreatorApplications(),
                getPingMeWaitlist(),
                getNewsletterSubscriptions(),
                getFeedback(),
                getHelpRequests(),
                getRecentAdminActivity(),
            ])

            const senderIds = [...feedbackData, ...helpData].map(item => item.by)
            const usersById = await getUsersByIds(senderIds)

            creatorApplications.value = applications
            waitlist.value = waitlistData
            newsletter.value = newsletterData
            feedback.value = feedbackData.map(item => ({ ...item, sender: usersById[item.by] || null }))
            help.value = helpData.map(item => ({ ...item, sender: usersById[item.by] || null }))
            activityLog.value = activity
            loaded.value = true
        } catch (err) {
            console.error('Error loading submissions:', err)
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function setCreatorApplicationStatus(application, status, adminUser) {
        await updateCreatorApplicationStatus(application, status, adminUser)

        const index = creatorApplications.value.findIndex(item => item.id === application.id)
        if (index !== -1) {
            creatorApplications.value[index] = {
                ...creatorApplications.value[index],
                status,
            }
        }

        activityLog.value = await getRecentAdminActivity()
    }

    function refresh() {
        return loadSubmissions(true)
    }

    return {
        creatorApplications,
        waitlist,
        newsletter,
        feedback,
        help,
        activityLog,
        loading,
        loaded,
        error,
        loadSubmissions,
        setCreatorApplicationStatus,
        refresh,
    }
})
