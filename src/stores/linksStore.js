/**
 * Links Store
 * Manages caching and state for user links
 * Production-grade store with proper error handling and loading states
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
    getUserLinks,
    getUserLinksCount,
    getUserLinkStatsByFolder,
} from '@/services/linksService'

export const useLinksStore = defineStore('links', () => {
    // State
    const userLinksCount = ref({}) // { userId: count }
    const userLinks = ref({}) // { userId: [...links] }
    const userLinkStats = ref({}) // { userId: { totalLinks, folderStats, dateStats } }
    
    const loadingUserLinksCount = ref({})
    const loadingUserLinks = ref({})
    const loadingUserLinkStats = ref({})

    const error = ref({}) // { userId: errorMessage }

    /**
     * Load count of links for a user - optimized for performance
     */
    async function loadUserLinksCount(userId, forceRefresh = false) {
        if (userLinksCount.value[userId] !== undefined && !forceRefresh) {
            return userLinksCount.value[userId]
        }

        try {
            loadingUserLinksCount.value[userId] = true
            error.value[userId] = null

            const count = await getUserLinksCount(userId)
            userLinksCount.value[userId] = count
            return count
        } catch (err) {
            console.error(`Error loading links count for user ${userId}:`, err)
            error.value[userId] = err.message
            throw err
        } finally {
            loadingUserLinksCount.value[userId] = false
        }
    }

    /**
     * Load all links for a user
     */
    async function loadUserLinks(userId, forceRefresh = false) {
        if (userLinks.value[userId] && !forceRefresh) {
            return userLinks.value[userId]
        }

        try {
            loadingUserLinks.value[userId] = true
            error.value[userId] = null

            const links = await getUserLinks(userId)
            userLinks.value[userId] = links
            return links
        } catch (err) {
            console.error(`Error loading links for user ${userId}:`, err)
            error.value[userId] = err.message
            throw err
        } finally {
            loadingUserLinks.value[userId] = false
        }
    }

    /**
     * Load link statistics grouped by folder
     */
    async function loadUserLinkStats(userId, forceRefresh = false) {
        if (userLinkStats.value[userId] && !forceRefresh) {
            return userLinkStats.value[userId]
        }

        try {
            loadingUserLinkStats.value[userId] = true
            error.value[userId] = null

            const stats = await getUserLinkStatsByFolder(userId)
            userLinkStats.value[userId] = stats
            return stats
        } catch (err) {
            console.error(`Error loading link stats for user ${userId}:`, err)
            error.value[userId] = err.message
            throw err
        } finally {
            loadingUserLinkStats.value[userId] = false
        }
    }

    /**
     * Refresh link count
     */
    async function refreshUserLinksCount(userId) {
        return loadUserLinksCount(userId, true)
    }

    /**
     * Refresh all links
     */
    async function refreshUserLinks(userId) {
        return loadUserLinks(userId, true)
    }

    /**
     * Refresh link statistics
     */
    async function refreshUserLinkStats(userId) {
        return loadUserLinkStats(userId, true)
    }

    /**
     * Clear cache for a user (when user is deleted or data needs reset)
     */
    function clearUserCache(userId) {
        delete userLinksCount.value[userId]
        delete userLinks.value[userId]
        delete userLinkStats.value[userId]
        delete loadingUserLinksCount.value[userId]
        delete loadingUserLinks.value[userId]
        delete loadingUserLinkStats.value[userId]
        delete error.value[userId]
    }

    /**
     * Computed property to get links sorted by folder and date
     */
    const userLinksSortedByFolder = computed(() => {
        return (userId) => {
            const links = userLinks.value[userId] || []
            const grouped = {}

            links.forEach(link => {
                const folderId = link.folderId || 'Uncategorized'
                if (!grouped[folderId]) {
                    grouped[folderId] = {
                        folderId,
                        folderName: link.folderName || folderId,
                        links: [],
                    }
                }
                grouped[folderId].links.push(link)
            })

            return Object.values(grouped)
        }
    })

    return {
        // State
        userLinksCount,
        userLinks,
        userLinkStats,
        loadingUserLinksCount,
        loadingUserLinks,
        loadingUserLinkStats,
        error,

        // Actions
        loadUserLinksCount,
        loadUserLinks,
        loadUserLinkStats,
        refreshUserLinksCount,
        refreshUserLinks,
        refreshUserLinkStats,
        clearUserCache,

        // Computed
        userLinksSortedByFolder,
    }
})
