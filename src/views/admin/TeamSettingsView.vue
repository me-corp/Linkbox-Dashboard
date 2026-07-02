<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import {
  fetchAllTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
} from '@/services/teamService'
import { PERMISSION_GROUPS } from '@/constants/permissions'

const authStore = useAuthStore()

// ── State ──────────────────────────────────────────────────────────────────
const members      = ref([])
const loading      = ref(false)
const saveLoading  = ref(false)
const removeLoading = ref(false)

// Dialog state
const showAddEdit  = ref(false)
const showRemove   = ref(false)
const editTarget   = ref(null)   // null = adding new member
const removeTarget = ref(null)

const form = ref({
  email:       '',
  password:    '',
  role:        'member',
  permissions: [],
})
const showPassword = ref(false)
const formError    = ref('')
const successMsg   = ref('')

// ── Table headers ──────────────────────────────────────────────────────────
const headers = [
  { title: 'Email',       key: 'email',      sortable: true },
  { title: 'Role',        key: 'role',       sortable: true, width: '100px' },
  { title: 'Permissions', key: 'permCount',  sortable: false },
  { title: 'Added',       key: 'addedAt',    sortable: true },
  { title: '',            key: 'actions',    sortable: false, align: 'end', width: '100px' },
]

// ── Load ───────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    members.value = await fetchAllTeamMembers()
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function permCount(member) {
  if (member.role === 'admin') return 'All'
  return member.permissions?.length ?? 0
}

const isEditing = computed(() => !!editTarget.value)

// ── Permission selection helpers ───────────────────────────────────────────
function groupCheckedCount(group) {
  return group.items.filter(i => form.value.permissions.includes(i.perm)).length
}

function isGroupAllChecked(group) {
  return group.items.every(i => form.value.permissions.includes(i.perm))
}

function toggleGroup(group) {
  const all = group.items.map(i => i.perm)
  if (isGroupAllChecked(group)) {
    form.value.permissions = form.value.permissions.filter(p => !all.includes(p))
  } else {
    form.value.permissions = [...new Set([...form.value.permissions, ...all])]
  }
}

// ── Open dialogs ───────────────────────────────────────────────────────────
function openAdd() {
  editTarget.value = null
  form.value = { email: '', password: '', role: 'member', permissions: [] }
  formError.value = ''
  showPassword.value = false
  showAddEdit.value = true
}

function openEdit(member) {
  editTarget.value = member
  form.value = {
    email:       member.email,
    password:    '',
    role:        member.role,
    permissions: [...(member.permissions ?? [])],
  }
  formError.value = ''
  showAddEdit.value = true
}

function openRemove(member) {
  removeTarget.value = member
  showRemove.value = true
}

// ── Save ───────────────────────────────────────────────────────────────────
async function handleSave() {
  formError.value = ''

  if (!isEditing.value) {
    if (!form.value.email.trim()) { formError.value = 'Email is required.'; return }
    if (!form.value.password.trim()) { formError.value = 'Password is required.'; return }
    if (form.value.password.length < 6) { formError.value = 'Password must be at least 6 characters.'; return }
  }

  saveLoading.value = true
  try {
    if (isEditing.value) {
      await updateTeamMember(editTarget.value.id, {
        role:        form.value.role,
        permissions: form.value.permissions,
      })
      successMsg.value = 'Member updated.'
    } else {
      await addTeamMember({
        email:       form.value.email.trim().toLowerCase(),
        password:    form.value.password,
        role:        form.value.role,
        permissions: form.value.permissions,
        addedBy:     authStore.user?.uid,
      })
      successMsg.value = 'Member added successfully.'
    }

    showAddEdit.value = false
    await load()

    setTimeout(() => { successMsg.value = '' }, 4000)
  } catch (err) {
    formError.value = err.message || 'Something went wrong.'
  } finally {
    saveLoading.value = false
  }
}

// ── Remove ─────────────────────────────────────────────────────────────────
async function handleRemove() {
  removeLoading.value = true
  try {
    await removeTeamMember(removeTarget.value.id)
    showRemove.value = false
    await load()
  } finally {
    removeLoading.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Team Settings</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Manage who has access to the dashboard and what they can see.
        </p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAdd">
        Add Member
      </v-btn>
    </div>

    <v-alert
      v-if="successMsg"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-4"
      closable
      @click:close="successMsg = ''"
    >
      {{ successMsg }}
    </v-alert>

    <!-- Members table -->
    <v-card variant="outlined" rounded="lg">
      <v-data-table
        :headers="headers"
        :items="members"
        :loading="loading"
        :items-per-page="25"
        hover
      >
        <template #item.role="{ item }">
          <v-chip
            :color="item.role === 'admin' ? 'primary' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ item.role === 'admin' ? 'Admin' : 'Member' }}
          </v-chip>
        </template>

        <template #item.permCount="{ item }">
          <span v-if="item.role === 'admin'" class="text-medium-emphasis text-caption">
            All permissions
          </span>
          <v-chip v-else size="small" variant="tonal">
            {{ item.permissions?.length ?? 0 }} permissions
          </v-chip>
        </template>

        <template #item.addedAt="{ item }">
          <span class="text-caption text-medium-emphasis">
            {{ formatDate(item.addedAt) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1 justify-end">
            <v-btn
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click="openEdit(item)"
            />
            <v-btn
              icon="mdi-trash-can-outline"
              size="small"
              variant="text"
              color="error"
              :disabled="item.email === authStore.user?.email"
              @click="openRemove(item)"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add / Edit dialog -->
    <v-dialog v-model="showAddEdit" max-width="640" scrollable>
      <v-card>
        <v-card-title class="pa-5 pb-2">
          {{ isEditing ? 'Edit Member' : 'Add Team Member' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ formError }}
          </v-alert>

          <!-- Email (readonly when editing) -->
          <v-text-field
            v-model="form.email"
            label="Email"
            prepend-inner-icon="mdi-email-outline"
            :readonly="isEditing"
            :hint="isEditing ? 'Email cannot be changed.' : ''"
            persistent-hint
            class="mb-3"
          />

          <!-- Password (add only) -->
          <v-text-field
            v-if="!isEditing"
            v-model="form.password"
            label="Temporary Password"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            hint="They can change it after signing in."
            persistent-hint
            class="mb-4"
            @click:append-inner="showPassword = !showPassword"
          />

          <!-- Role -->
          <div class="text-subtitle-2 font-weight-bold mb-2 mt-2">Role</div>
          <v-btn-toggle
            v-model="form.role"
            mandatory
            density="compact"
            rounded="lg"
            class="mb-5"
          >
            <v-btn value="member" size="small">Member</v-btn>
            <v-btn value="admin" size="small" color="primary">Admin</v-btn>
          </v-btn-toggle>

          <v-alert
            v-if="form.role === 'admin'"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            Admins have full access to all sections and can manage team members.
          </v-alert>

          <!-- Permissions (member only) -->
          <template v-if="form.role === 'member'">
            <div class="text-subtitle-2 font-weight-bold mb-3">Permissions</div>

            <v-expansion-panels variant="accordion" class="permission-panels">
              <v-expansion-panel
                v-for="group in PERMISSION_GROUPS"
                :key="group.key"
                rounded="lg"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center ga-3 w-100">
                    <span class="font-weight-medium">{{ group.label }}</span>
                    <v-spacer />
                    <v-chip size="x-small" variant="tonal">
                      {{ groupCheckedCount(group) }} / {{ group.items.length }}
                    </v-chip>
                    <v-checkbox-btn
                      :model-value="isGroupAllChecked(group)"
                      :indeterminate="groupCheckedCount(group) > 0 && !isGroupAllChecked(group)"
                      density="compact"
                      color="primary"
                      @click.stop="toggleGroup(group)"
                    />
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <div class="permission-list">
                    <v-checkbox
                      v-for="item in group.items"
                      :key="item.perm"
                      v-model="form.permissions"
                      :value="item.perm"
                      :label="item.label"
                      density="compact"
                      hide-details
                      color="primary"
                    />
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </template>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn :disabled="saveLoading" @click="showAddEdit = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saveLoading"
            @click="handleSave"
          >
            {{ isEditing ? 'Save Changes' : 'Add Member' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove confirmation dialog -->
    <v-dialog v-model="showRemove" max-width="400">
      <v-card>
        <v-card-title class="pa-5 pb-2">Remove Member</v-card-title>
        <v-card-text class="pa-5 pt-2">
          Remove <strong>{{ removeTarget?.email }}</strong> from the team?
          They will lose dashboard access on next sign-in.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn :disabled="removeLoading" @click="showRemove = false">Cancel</v-btn>
          <v-btn color="error" :loading="removeLoading" @click="handleRemove">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.permission-panels {
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  overflow: hidden;
}

.permission-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 16px;
  padding: 4px 0;
}

@media (max-width: 480px) {
  .permission-list {
    grid-template-columns: 1fr;
  }
}
</style>
