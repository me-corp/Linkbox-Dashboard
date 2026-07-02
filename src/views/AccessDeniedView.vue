<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/services/authService'

const router   = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await logout()
  authStore.setUser(null)
  router.push('/login')
}
</script>

<template>
  <v-container fluid class="fill-height access-denied-page">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" class="text-center">
        <v-avatar size="72" color="error" variant="tonal" class="mb-6">
          <v-icon icon="mdi-shield-lock-outline" size="36" />
        </v-avatar>

        <h1 class="text-h4 font-weight-bold mb-3">
          Access Denied
        </h1>

        <p class="text-body-1 text-medium-emphasis mb-8">
          You don't have permission to view this page.
          Contact an admin to request access.
        </p>

        <div class="d-flex justify-center ga-3">
          <v-btn
            variant="tonal"
            prepend-icon="mdi-arrow-left"
            @click="router.back()"
          >
            Go Back
          </v-btn>

          <v-btn
            color="error"
            variant="tonal"
            prepend-icon="mdi-logout-variant"
            @click="handleLogout"
          >
            Sign Out
          </v-btn>
        </div>

        <p class="text-caption text-medium-emphasis mt-8">
          Signed in as <strong>{{ authStore.user?.email }}</strong>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.access-denied-page {
  background: rgb(var(--v-theme-background));
  min-height: 100vh;
}
</style>
