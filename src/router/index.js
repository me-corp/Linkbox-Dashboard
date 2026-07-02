import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const routes = [
  {
    path: "/login",
    component: () => import("@/views/auth/LoginView.vue"),
  },
  {
    path: "/access-denied",
    component: () => import("@/views/AccessDeniedView.vue"),
  },
  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    children: [
      {
        path: "",
        meta: { title: "Overview", permission: "analytics:overview:view" },
        component: () => import("@/views/dashboard/DashboardView.vue"),
      },
      {
        path: "growth",
        meta: { title: "Growth", permission: "analytics:growth:view" },
        component: () => import("@/views/dashboard/GrowthView.vue"),
      },
      {
        path: "retention",
        meta: { title: "Retention", permission: "analytics:retention:view" },
        component: () => import("@/views/dashboard/RetentionView.vue"),
      },
      {
        path: "engagement",
        meta: { title: "Engagement", permission: "analytics:engagement:view" },
        component: () => import("@/views/dashboard/EngagementView.vue"),
      },
      {
        path: "power-users",
        meta: { title: "Power Users", permission: "analytics:power_users:view" },
        component: () => import("@/views/dashboard/PowerUsersView.vue"),
      },
      {
        path: "stale-users",
        meta: { title: "Stale Users", permissionPrefix: "stale_users:" },
        component: () => import("@/views/dashboard/StaleUsersView.vue"),
      },
      {
        path: "integrity",
        meta: { title: "Data Integrity", permissionPrefix: "data_integrity:" },
        component: () => import("@/views/dashboard/DataIntegrityView.vue"),
      },
      {
        path: "/users",
        meta: { title: "Users", permissionPrefix: "users:" },
        component: () => import("@/views/users/UsersView.vue"),
      },
      {
        path: "settings",
        meta: { title: "Settings", permission: "settings:view" },
        component: () => import("@/views/dashboard/SettingsView.vue"),
      },
      {
        path: "submissions",
        meta: { title: "Submissions", permissionPrefix: "submissions:" },
        component: () => import("@/views/dashboard/SubmissionsView.vue"),
      },
      {
        path: "team",
        meta: { title: "Team Settings", adminOnly: true },
        component: () => import("@/views/admin/TeamSettingsView.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  // Public routes — no auth required
  if (to.path === "/login") {
    if (authStore.isAuthenticated) return "/";
    return;
  }

  // Access-denied page — must be authenticated but no further checks
  if (to.path === "/access-denied") {
    if (!authStore.isAuthenticated) return "/login";
    return;
  }

  // All other routes require auth
  if (!authStore.isAuthenticated) return "/login";

  // Must exist in linkbox_team
  if (!authStore.teamMember) return "/access-denied";

  const { role, permissions = [] } = authStore.teamMember;
  const isAdmin = role === "admin";

  // Admin bypasses all permission checks
  if (isAdmin) return;

  // Admin-only routes
  if (to.meta.adminOnly) return "/access-denied";

  // Single permission check
  if (to.meta.permission && !permissions.includes(to.meta.permission)) {
    return "/access-denied";
  }

  // Prefix check — user needs at least one permission matching the prefix
  if (to.meta.permissionPrefix) {
    const prefix = to.meta.permissionPrefix;
    if (!permissions.some((p) => p.startsWith(prefix))) {
      return "/access-denied";
    }
  }
});

export default router;
