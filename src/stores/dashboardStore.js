import { defineStore } from "pinia";

import {
  getUserBreakdown,
  getActiveUserCounts,
  getProUsersCount,
} from "@/services/userAnalyticsService";

import {
  getTotalFolders,
  getTotalLinks,
  getFolderAudienceCount,
  getFolderInsightsCount,
  getLinkInsightsCount,
  getDeviceInfoCount,
  getNotificationsCount,
} from "@/services/analyticsService";

import { useGrowthStore } from "@/stores/growthStore";

export const useDashboardStore =
  defineStore("dashboard", {
    state: () => ({
      guestUsers: 0,
      registeredUsers: 0,
      proUsers: 0,

      totalFolders: 0,
      totalLinks: 0,
      folderAudienceCount: 0,
      folderInsightsCount: 0,
      linkInsightsCount: 0,
      deviceInfoCount: 0,
      notificationsCount: 0,

      dau: 0,
      wau: 0,
      mau: 0,

      newUsersThisWeek: 0,
      newUsersLastWeek: 0,

      lastUpdated: null,

      loading: false,
      loaded: false,
    }),

    getters: {
      totalUsers: state => state.guestUsers + state.registeredUsers,

      userGrowthPct(state) {
        if (!state.newUsersLastWeek) {
          return state.newUsersThisWeek > 0 ? 100 : 0;
        }

        return Math.round(
          ((state.newUsersThisWeek - state.newUsersLastWeek) / state.newUsersLastWeek) * 1000
        ) / 10;
      },

      proConversionPct(state) {
        const total = state.guestUsers + state.registeredUsers;

        if (!total) return 0;

        return Math.round((state.proUsers / total) * 1000) / 10;
      },

      stickiness(state) {
        if (!state.mau) return 0;

        return Math.round((state.dau / state.mau) * 1000) / 10;
      },
    },

    actions: {
      async loadOverview(forceRefresh = false) {
        if (this.loaded && !forceRefresh) return;

        this.loading = true;

        try {
          const growthStore = useGrowthStore();

          const [
            breakdown,
            totalFolders,
            totalLinks,
            folderAudienceCount,
            folderInsightsCount,
            linkInsightsCount,
            deviceInfoCount,
            notificationsCount,
            activeCounts,
            proUsers,
            growthSeries,
          ] = await Promise.all([
            getUserBreakdown(),
            getTotalFolders(),
            getTotalLinks(),
            getFolderAudienceCount(),
            getFolderInsightsCount(),
            getLinkInsightsCount(),
            getDeviceInfoCount(),
            getNotificationsCount(),
            getActiveUserCounts(),
            getProUsersCount(),
            growthStore.loadUserGrowthSeries(8, forceRefresh),
          ]);

          this.guestUsers = breakdown.guests;
          this.registeredUsers = breakdown.registered;
          this.proUsers = proUsers;

          this.totalFolders = totalFolders;
          this.totalLinks = totalLinks;
          this.folderAudienceCount = folderAudienceCount;
          this.folderInsightsCount = folderInsightsCount;
          this.linkInsightsCount = linkInsightsCount;
          this.deviceInfoCount = deviceInfoCount;
          this.notificationsCount = notificationsCount;

          this.dau = activeCounts.dau;
          this.wau = activeCounts.wau;
          this.mau = activeCounts.mau;

          const weeklyNew = growthSeries.newUsers || [];
          this.newUsersThisWeek = weeklyNew[weeklyNew.length - 1] || 0;
          this.newUsersLastWeek = weeklyNew[weeklyNew.length - 2] || 0;

          this.lastUpdated = new Date();
          this.loaded = true;
        } finally {
          this.loading = false;
        }
      },

      refresh() {
        return this.loadOverview(true);
      },
    },
  });
