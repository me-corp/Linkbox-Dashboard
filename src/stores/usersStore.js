import { defineStore } from 'pinia'

import {
  getUsers,
  updateUserWithAudit,
} from '@/services/userService'

import {
  getUserIssues,
  getSuggestedFix,
} from '@/services/dataQualityService'

export const useUsersStore =
  defineStore('users', {
    state: () => ({
      users: [],
      loading: false,
      loaded: false,
    }),

    getters: {
      usersWithIssues(state) {
        return state.users.filter(
          user =>
            getUserIssues(user)
              .length > 0
        )
      },
      dataIssuesCount() {
        return this.usersWithIssues.length
      },
      activeUsers30Days(state) {
        const cutoff =
          new Date()

        cutoff.setDate(
          cutoff.getDate() - 30
        )

        return state.users.filter(
          user => {
            if (
              !user.lastActivityAt
            ) {
              return false
            }

            return (
              user.lastActivityAt.toDate() >=
              cutoff
            )
          }
        ).length
      },
      dashboardMetrics(state) {
        const now = new Date()

        const last7Days = new Date(now)
        last7Days.setDate(
          last7Days.getDate() - 7
        )

        const last30Days = new Date(now)
        last30Days.setDate(
          last30Days.getDate() - 30
        )

        return {
          active7Days: state.users.filter(
            user =>
              user.lastActivityAt &&
              user.lastActivityAt.toDate() >=
                last7Days
          ).length,
          active30Days: state.users.filter(
            user =>
              user.lastActivityAt &&
              user.lastActivityAt.toDate() >=
                last30Days
          ).length,
          activeUsersToday: state.users.filter(
            user => {
              if (
                !user.lastActivityAt
              ) {
                return false
              }

              const lastActivityDate =
                user.lastActivityAt.toDate()

              return (
                lastActivityDate.getDate() ===
                  now.getDate() &&
                lastActivityDate.getMonth() ===
                  now.getMonth() &&
                lastActivityDate.getFullYear() ===
                  now.getFullYear()
              )
            }
          ).length,
          guests: state.users.filter(
            user => user.isGuest
          ).length,
          registered: state.users.filter(
            user => !user.isGuest
          ).length,
          proUsers: state.users.filter(
            user => user.isPro
          ).length,
        }
      }
    },
    actions: {
      async loadUsers() {
        if (this.loaded) return

        this.loading = true

        try {
          this.users =
            await getUsers()

          this.loaded = true
        } finally {
          this.loading = false
        }
      },

      async updateUserWithAudit(
        userId,
        updates,
        adminUser
      ) {
        const index =
          this.users.findIndex(
            user =>
              user.id === userId
          )

        if (index === -1) {
          return
        }

        const user =
          this.users[index]

        await updateUserWithAudit(
          user,
          updates,
          adminUser
        )

        this.users[index] = {
          ...user,
          ...updates,
        }
      }
    },
  })