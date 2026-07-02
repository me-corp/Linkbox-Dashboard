import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user:        null,
    teamMember:  null,   // { id, email, role, permissions[] } from linkbox_team
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin:         (state) => state.teamMember?.role === 'admin',
    hasTeamAccess:   (state) => !!state.teamMember,
  },

  actions: {
    setUser(user) {
      this.user = user
        ? { uid: user.uid, email: user.email }
        : null

      if (!user) {
        this.teamMember  = null
        this.initialized = true
      }
    },

    setTeamMember(member) {
      this.teamMember  = member
      this.initialized = true
    },
  },
});
