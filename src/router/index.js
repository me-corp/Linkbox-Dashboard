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
        component: () =>
          import("@/views/dashboard/DashboardView.vue"),
      },
      {
        path: "growth",
        component: () =>
          import("@/views/dashboard/GrowthView.vue"),
      },
      {
        path: "retention",
        component: () =>
          import("@/views/dashboard/RetentionView.vue"),
      },
      {
        path: "engagement",
        component: () =>
          import("@/views/dashboard/EngagementView.vue"),
      },
      {
        path: "power-users",
        component: () =>
          import("@/views/dashboard/PowerUsersView.vue"),
      },
      {
        path: 'integrity',
        component: () =>
          import(
            '@/views/dashboard/DataIntegrityView.vue'
          ),
      },
      {
        path: '/users',
        component: () =>
          import(
            '@/views/users/UsersView.vue'
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