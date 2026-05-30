import { defineStore } from "pinia";

import {
  getTotalUsers,
  getUserBreakdown,
  getMissingGuestFlagUsers,
} from "@/services/userAnalyticsService";

import { getTotalFolders, getTotalLinks, getFolderAudienceCount, getFolderInsightsCount, getLinkInsightsCount, getDeviceInfoCount, getNotificationsCount, } from "@/services/analyticsService";

export const useDashboardStore =
  defineStore("dashboard", {
    state: () => ({
      totalUsers: 0,
      totalFolders: 0, 
      totalLinks: 0,
      folderAudienceCount: 0,
      folderInsightsCount: 0,
      linkInsightsCount: 0,
      deviceInfoCount: 0,
      notificationsCount: 0,
      guestUsers: 0,
      registeredUsers: 0,

      loading: false,
    }),

    actions: {
      async loadOverview() {
        this.loading = true;

        try {
          const [
            totalUsers,
            breakdown,
            totalFolders,
            totalLinks,
            folderAudienceCount,
            folderInsightsCount,
            linkInsightsCount,
            deviceInfoCount,
            notificationsCount,
          ] = await Promise.all([
            getTotalUsers(),
            getUserBreakdown(),
            getTotalFolders(),
            getTotalLinks(),
            getFolderAudienceCount(),
            getFolderInsightsCount(),
            getLinkInsightsCount(),
            getDeviceInfoCount(),
            getNotificationsCount(),
          ]);

          this.totalUsers = totalUsers;
          this.totalFolders = totalFolders;
          this.totalLinks = totalLinks;
          this.folderAudienceCount = folderAudienceCount;
          this.folderInsightsCount = folderInsightsCount;
          this.linkInsightsCount = linkInsightsCount;
          this.deviceInfoCount = deviceInfoCount;
          this.notificationsCount = notificationsCount;

          this.guestUsers =
            breakdown.guests;

          this.registeredUsers =
            breakdown.registered;
        } finally {
          this.loading = false;
        }
      }
    },
  });