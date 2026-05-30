import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
    getFolderAudienceByUserId,
} from '@/services/folderAudienceService'

export const useFoldersStore =
    defineStore(
        'folders',
        () => {

            const userFolderStats =
                ref({})

            const loadingUserFolderStats =
                ref({})

            async function loadUserFolderStats(
                userId,
                forceRefresh = false
            ) {
                if (
                    userFolderStats.value[
                    userId
                    ] &&
                    !forceRefresh
                ) {
                    return userFolderStats.value[
                        userId
                    ]
                }

                try {
                    loadingUserFolderStats.value[
                        userId
                    ] = true

                    const audience =
                        await getFolderAudienceByUserId(
                            userId
                        )

                    const stats = {
                        totalFolders:
                            audience.length,

                        ownedFolders:
                            audience.filter(
                                item =>
                                    item.role === 1
                            ).length,

                        collaboratorFolders:
                            audience.filter(
                                item =>
                                    item.role === 2
                            ).length,

                        viewerFolders:
                            audience.filter(
                                item =>
                                    item.role === 3
                            ).length,

                        favouriteFolders:
                            audience.filter(
                                item =>
                                    item.isFavourite
                            ).length,
                    }

                    userFolderStats.value[
                        userId
                    ] = stats

                    return stats
                }
                catch (error) {
                    console.error(error)

                    throw error
                }
                finally {
                    loadingUserFolderStats.value[
                        userId
                    ] = false
                }
            }

            async function refreshUserFolderStats(
                userId
            ) {
                return loadUserFolderStats(
                    userId,
                    true
                )
            }

            return {
                userFolderStats,
                loadingUserFolderStats,
                loadUserFolderStats,
                refreshUserFolderStats,
            }
        }
    )