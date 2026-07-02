import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

export function usePermissions() {
  const authStore = useAuthStore()

  const isAdmin = computed(() => authStore.teamMember?.role === 'admin')

  const teamPermissions = computed(() => authStore.teamMember?.permissions ?? [])

  function hasPermission(perm) {
    if (isAdmin.value) return true
    return teamPermissions.value.includes(perm)
  }

  // Returns true if the user has at least one permission starting with the given prefix.
  // e.g. hasAnyWithPrefix('data_integrity:') → true if they have data_integrity:folders:view
  function hasAnyWithPrefix(prefix) {
    if (isAdmin.value) return true
    return teamPermissions.value.some(p => p.startsWith(prefix))
  }

  // Returns true if the user has at least one of the listed permissions.
  function canAny(...perms) {
    return perms.some(p => hasPermission(p))
  }

  return {
    isAdmin,
    hasPermission,
    hasAnyWithPrefix,
    canAny,
  }
}
