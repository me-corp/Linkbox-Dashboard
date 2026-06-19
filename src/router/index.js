import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const routes = [
  {
    path: "/login",
    component: () =>
      import("@/views/auth/LoginView.vue"),
  },
  {
    path: "/",
    component: () =>
      import("@/layouts/AppLayout.vue"),
    children: [
      {
        path: "",
        meta: { title: "Overview" },
        component: () =>
          import("@/views/dashboard/DashboardView.vue"),
      },
      {
        path: "growth",
        meta: { title: "Growth" },
        component: () =>
          import("@/views/dashboard/GrowthView.vue"),
      },
      {
        path: "retention",
        meta: { title: "Retention" },
        component: () =>
          import("@/views/dashboard/RetentionView.vue"),
      },
      {
        path: "engagement",
        meta: { title: "Engagement" },
        component: () =>
          import("@/views/dashboard/EngagementView.vue"),
      },
      {
        path: "power-users",
        meta: { title: "Power Users" },
        component: () =>
          import("@/views/dashboard/PowerUsersView.vue"),
      },
      {
        path: 'stale-users',
        meta: { title: "Stale Users" },
        component: () =>
          import('@/views/dashboard/StaleUsersView.vue'),
      },
      {
        path: 'integrity',
        meta: { title: "Data Integrity" },
        component: () =>
          import(
            '@/views/dashboard/DataIntegrityView.vue'
          ),
      },
      {
        path: '/users',
        meta: { title: "Users" },
        component: () =>
          import(
            '@/views/users/UsersView.vue'
          ),
      },
      {
        path: 'settings',
        meta: { title: "Settings" },
        component: () =>
          import(
            '@/views/dashboard/SettingsView.vue'
          ),
      },
      {
        path: 'submissions',
        meta: { title: "Submissions" },
        component: () =>
          import(
            '@/views/dashboard/SubmissionsView.vue'
          ),
      }
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (
    to.path !== "/login" &&
    !authStore.isAuthenticated
  ) {
    return "/login";
  }

  if (
    to.path === "/login" &&
    authStore.isAuthenticated
  ) {
    return "/";
  }
});


export default router;