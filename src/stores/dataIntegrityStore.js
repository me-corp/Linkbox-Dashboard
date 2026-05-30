import { defineStore } from 'pinia'

import {
    getUsersMissingGuestFlag,
    updateUserGuestFlag,
} from '@/services/dataIntegrityService'

export const useDataIntegrityStore =
    defineStore('dataIntegrity', {
        state: () => ({
            users: [],
            loading: false,
        }),

        actions: {
            async load() {
                this.loading = true

                try {
                    this.users =
                        await getUsersMissingGuestFlag()
                } finally {
                    this.loading = false
                }
            },
            async markGuest(userId) {
                await updateUserGuestFlag(
                    userId,
                    true
                )

                this.users = this.users.filter(
                    user => user.id !== userId
                )
            },

            async markRegistered(userId) {
                await updateUserGuestFlag(
                    userId,
                    false
                )

                this.users = this.users.filter(
                    user => user.id !== userId
                )
            },
        },
    })