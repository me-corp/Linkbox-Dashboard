<script setup>
import { ref, watch } from 'vue'

const rail = ref(
  localStorage.getItem(
    'sidebarCollapsed'
  ) === 'true'
)

watch(rail, value => {
  localStorage.setItem(
    'sidebarCollapsed',
    value
  )
})

const items = [
  {
    title: 'Overview',
    icon: 'mdi-view-dashboard',
    route: '/',
  },
  {
    title: 'Growth',
    icon: 'mdi-chart-line',
    route: '/growth',
  },
  {
    title: 'Retention',
    icon: 'mdi-fire',
    route: '/retention',
  },
  {
    title: 'Engagement',
    icon: 'mdi-lightning-bolt',
    route: '/engagement',
  },
  {
    title: 'Power Users',
    icon: 'mdi-crown',
    route: '/power-users',
  },
  {
    title: 'Data Integrity',
    icon: 'mdi-database-check',
    route: '/integrity',
  },
  {
    title: 'Users',
    icon: 'mdi-account-group',
    route: '/users',
  }
]
</script>

<template>
  <v-navigation-drawer
    permanent
    :rail="rail"
  >
    <v-list nav>

      <v-list-item>

        <template #prepend>
          <v-btn
            icon
            variant="text"
            @click="
              rail = !rail
            "
          >
            <v-icon>
              {{
                rail
                  ? 'mdi-chevron-right'
                  : 'mdi-chevron-left'
              }}
            </v-icon>
          </v-btn>
        </template>

        <v-list-item-title
          v-if="!rail"
        >
          LinkBox Dashboard
        </v-list-item-title>

      </v-list-item>

      <v-divider />

      <v-list-item
        v-for="item in items"
        :key="item.route"
        :prepend-icon="item.icon"
        :title="item.title"
        :to="item.route"
      />

    </v-list>
  </v-navigation-drawer>
</template>