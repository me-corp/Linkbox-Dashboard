import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) =>
      !!state.user,
  },

  actions: {
    setUser(user) {
      this.user = user
        ? { uid: user.uid, email: user.email }
        : null;

      this.initialized = true;
    },
  },
});
