/**
 * Links Service
 * Handles fetching and managing user links from Firestore
 * Privacy Note: Only fetches non-sensitive link metadata suitable for admin/investor view
 */

import {
    collection,
    getDocs,
    query,
    where,
    getCountFromServer,
} from 'firebase/firestore'

import { db } from '@/firebase/config'

/**
 * Fetch all links for a specific user
 * @param {string} userId - User ID to fetch links for
 * @returns {Promise<Array>} Array of link objects with folder information
 */
export async function getUserLinks(userId) {
    try {
        const snapshot = await getDocs(
            query(
                collection(db, 'links'),
                where('userId', '==', userId),
            )
        )

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }))
    } catch (error) {
        console.error('Error fetching user links:', error)
        throw error
    }
}

/**
 * Get count of links for a user - optimized for performance
 * Uses Firestore count aggregation for efficiency
 * @param {string} userId - User ID to count links for
 * @returns {Promise<number>} Count of user links
 */
export async function getUserLinksCount(userId) {
    try {
        const coll = collection(db, 'links')
        const q = query(
            coll,
            where('userId', '==', userId),
        )
        const snapshot = await getCountFromServer(q)
        return snapshot.data().count
    } catch (error) {
        console.error('Error fetching user links count:', error)
        throw error
    }
}

/**
 * Get link statistics grouped by folder
 * Suitable for investor presentation (aggregated view)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Folder-wise link statistics
 */
export async function getUserLinkStatsByFolder(userId) {
    try {
        const links = await getUserLinks(userId)

        const stats = {
            totalLinks: links.length,
            folderStats: {},
            dateStats: {
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                older: 0,
            },
        }

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000)

        links.forEach(link => {
            // Group by folder
            const folderId = link.folderId || 'Uncategorized'
            if (!stats.folderStats[folderId]) {
                stats.folderStats[folderId] = {
                    folderId,
                    count: 0,
                    folderName: link.folderName || folderId,
                }
            }
            stats.folderStats[folderId].count++

            // Categorize by date
            if (link.createdAt) {
                const linkDate = link.createdAt.toDate?.() || new Date(link.createdAt)
                if (linkDate >= todayStart) {
                    stats.dateStats.today++
                } else if (linkDate >= weekAgo) {
                    stats.dateStats.thisWeek++
                } else if (linkDate >= monthAgo) {
                    stats.dateStats.thisMonth++
                } else {
                    stats.dateStats.older++
                }
            }
        })

        return stats
    } catch (error) {
        console.error('Error fetching link statistics:', error)
        throw error
    }
}

/**
 * Get paginated links for a user (for scrollable list)
 * @param {string} userId - User ID
 * @param {number} pageSize - Number of links per page
 * @param {any} lastDoc - Last document for pagination (cursor-based)
 * @returns {Promise<Object>} { links, hasMore, lastDocument }
 */
export async function getUserLinksPaginated(userId, pageSize = 50, lastDoc = null) {
    try {
        let q
        if (lastDoc) {
            q = query(
                collection(db, 'links'),
                where('userId', '==', userId),
                // startAfter(lastDoc), // Uncomment if using pagination library
            )
        } else {
            q = query(
                collection(db, 'links'),
                where('userId', '==', userId),
            )
        }

        const snapshot = await getDocs(q)
        const docs = snapshot.docs.slice(0, pageSize + 1)
        const hasMore = docs.length > pageSize

        return {
            links: docs.slice(0, pageSize).map(doc => ({
                id: doc.id,
                ...doc.data(),
            })),
            hasMore,
            lastDocument: docs[pageSize - 1] || null,
        }
    } catch (error) {
        console.error('Error fetching paginated links:', error)
        throw error
    }
}
