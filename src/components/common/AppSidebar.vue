<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/services/authService'

const router = useRouter()
const authStore = useAuthStore()

const rail = ref(
  localStorage.getItem('sidebarCollapsed') === 'true'
)

watch(rail, value => {
  localStorage.setItem('sidebarCollapsed', value)
})

const navGroups = [
  {
    items: [
      { title: 'Overview', icon: 'mdi-view-dashboard-outline', route: '/' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { title: 'Growth', icon: 'mdi-chart-line', route: '/growth' },
      { title: 'Retention', icon: 'mdi-fire', route: '/retention' },
      { title: 'Engagement', icon: 'mdi-lightning-bolt-outline', route: '/engagement' },
      { title: 'Power Users', icon: 'mdi-crown-outline', route: '/power-users' },
      { title: 'Stale Users', icon: 'mdi-account-clock-outline', route: '/stale-users' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { title: 'Users', icon: 'mdi-account-group-outline', route: '/users' },
      { title: 'Data Integrity', icon: 'mdi-database-check-outline', route: '/integrity' },
      { title: 'Submissions', icon: 'mdi-tray-full', route: '/submissions' },
      { title: 'Settings', icon: 'mdi-cog-outline', route: '/settings' },
    ],
  },
]

async function handleLogout() {
  await logout()
  authStore.setUser(null)
  router.push('/login')
}
</script>

<template>
  <v-navigation-drawer
    permanent
    :rail="rail"
    rail-width="72"
    width="252"
    border="0"
    class="app-sidebar"
  >
    <div class="sidebar-brand" :class="{ 'justify-center': rail }">
      <v-avatar size="36" rounded="lg" color="primary" class="brand-mark">
        <v-img src="@/assets/images/logo.png" cover />
      </v-avatar>

      <div v-if="!rail" class="brand-text">
        <div class="brand-name">LinkBox</div>
        <div class="brand-subtitle">Founder Dashboard</div>
      </div>

      <v-spacer v-if="!rail" />

      <v-btn
        v-if="!rail"
        icon="mdi-chevron-left"
        variant="text"
        density="comfortable"
        size="small"
        @click="rail = !rail"
      />
    </div>

    <v-btn
      v-if="rail"
      icon="mdi-chevron-right"
      variant="text"
      density="comfortable"
      size="small"
      class="rail-toggle"
      @click="rail = !rail"
    />

    <v-divider class="mb-2" />

    <v-list nav density="comfortable" class="sidebar-nav">
      <template v-for="(group, gIndex) in navGroups" :key="gIndex">
        <v-list-subheader v-if="group.label && !rail">
          {{ group.label }}
        </v-list-subheader>

        <v-list-item
          v-for="item in group.items"
          :key="item.route"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.route"
          rounded="lg"
          color="primary"
          class="sidebar-item mb-1"
        />

        <v-divider v-if="gIndex < navGroups.length - 1" class="my-2" />
      </template>
    </v-list>

    <template #append>
      <v-divider />

      <div class="sidebar-footer" :class="{ 'justify-center': rail }">
        <v-avatar size="36" color="surface-bright">
          <v-icon color="primary">mdi-account-circle</v-icon>
        </v-avatar>

        <div v-if="!rail" class="footer-text">
          <div class="footer-email text-truncate">
            {{ authStore.user?.email }}
          </div>
          <div class="footer-role">Administrator</div>
        </div>

        <v-spacer v-if="!rail" />

        <v-btn
          icon="mdi-logout-variant"
          variant="text"
          density="comfortable"
          size="small"
          color="error"
          @click="handleLogout"
        />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.app-sidebar {
  background: rgb(var(--v-theme-surface));
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  min-height: 64px;
}

.brand-mark {
  flex-shrink: 0;
}

.brand-text {
  overflow: hidden;
}

.brand-name {
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}

.brand-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-tertiary));
  white-space: nowrap;
}

.rail-toggle {
  margin: 4px auto 0;
}

.sidebar-nav {
  padding: 0 8px;
}

.sidebar-item :deep(.v-list-item-title) {
  font-weight: 600;
  font-size: 14px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
}

.footer-text {
  overflow: hidden;
}

.footer-email {
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.footer-role {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-tertiary));
}
</style>
