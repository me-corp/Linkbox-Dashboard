<script setup>
    import {
        computed,
        onMounted,
        ref
    } from 'vue'

    import { useUsersStore } from '@/stores/usersStore'
    import UserDetailsDrawer from '@/components/users/UserDetailsDrawer.vue'
    import ConfirmBulkUserUpdateDialog
from '@/components/dialogs/ConfirmBulkUserUpdateDialog.vue'
    import {
        bulkApplySuggestedFixes,
    } from '@/services/userService'

    import {
        logAdminAction,
    } from '@/services/adminActivityService'
    import {
        getUserIssues,
        getSuggestedFix,
    } from '@/services/dataQualityService'

    import ConfirmUserUpdateDialog
        from '@/components/dialogs/ConfirmUserUpdateDialog.vue'
    // selectedItems in the table for bulk actions
    const selectedItems = ref([])

    // users store to fetch and update users
    const usersStore = useUsersStore()

    // boolean to track if an update operation is in progress
    const updating = ref(false)

    // dialog visibility and selected user for details drawer
    const showDialog = ref(false)

    // dialog visibility for bulk update confirmation
    const showBulkDialog =
  ref(false)

    // toggle selection of a user in the table
    function openBulkDialog() {
        showBulkDialog.value =
            true
    }

    // toggle selection of a user in the table
    function toggleSelection(item) {
        const index =
            selectedItems.value.findIndex(
                x =>
                    x.user.id ===
                    item.user.id
            )

        if (index === -1) {
            selectedItems.value.push(item)
        }
        else {
            selectedItems.value.splice(
                index,
                1
            )
        }
    }

    // toggle select all users with issues
    function toggleSelectAll() {
    const pageItems =
        currentPageItems.value

    const allSelected =
        pageItems.every(item =>
            selectedItems.value.some(
                selected =>
                    selected.user.id ===
                    item.user.id
            )
        )

    if (allSelected) {
        selectedItems.value =
            selectedItems.value.filter(
                selected =>
                    !pageItems.some(
                        pageItem =>
                            pageItem.user.id ===
                            selected.user.id
                    )
            )

        return
    }

    pageItems.forEach(item => {
        const exists =
            selectedItems.value.some(
                selected =>
                    selected.user.id ===
                    item.user.id
            )

        if (!exists) {
            selectedItems.value.push(item)
        }
    })
}

    // selected item to update and pending updates for confirmation
    const selectedItem = ref(null)

    // drawer visibility and selected user for details view
    const showUserDrawer =
        ref(false)

    // selected user for details drawer
    const selectedUser =
        ref(null)

    // pending updates to be applied after confirmation
    const pendingUpdates = ref(null)

    // load users on component mount
    onMounted(async () => {
        await usersStore.loadUsers()
    })

    // compute users with issues and their suggested fixes
    const usersWithIssues = computed(() =>
        usersStore.users
            .map(user => ({
                user,
                issues: getUserIssues(user),
                suggestedFix: getSuggestedFix(user),
            }))
            .filter(item =>
                item.issues.length > 0
            )
    )

    // open update dialog with specific updates to apply
    function openUpdateDialog(
        item,
        updates
    ) {
        selectedItem.value = item

        pendingUpdates.value =
            updates

        showDialog.value = true
    }

    // apply suggested fix for a user
    function applySuggestedFix(
        item
    ) {
        openUpdateDialog(
            item,
            item.suggestedFix
        )
    }

    // mark user as guest with confirmation
    function markGuest(item) {
        openUpdateDialog(
            item,
            {
                isGuest: true,
            }
        )
    }

    // mark user as registered with confirmation
    function markRegistered(
        item
    ) {
        openUpdateDialog(
            item,
            {
                isGuest: false,
            }
        )
    }

    // confirm and apply the pending updates to the user
    async function confirmFix() {
        try {
            updating.value = true

            await usersStore.updateUserWithAudit(
                selectedItem.value.user.id,

                pendingUpdates.value,

                {
                    email:
                        'harsha@linkbox.store',
                }
            )
            await new Promise(resolve =>
                setTimeout(resolve, 500)
            )

            showDialog.value =
                false

            selectedItem.value =
                null

            pendingUpdates.value =
                null
        }
        catch (error) {
            console.error(error)
        }
        finally {
            updating.value = false
        }
    }

    // view user details in the drawer
    function viewUser(user) {
        selectedUser.value =
            user

        showUserDrawer.value =
            true
    }

    async function confirmBulkFix() {
        try {
            updating.value = true

            await bulkApplySuggestedFixes(
                selectedItems.value
            )

            await logAdminAction({
                action:
                    'bulk_apply_suggested',

                performedBy: {
                    email:
                        'harsha@linkbox.store',
                },

                userCount:
                    selectedItems.value.length,

                changes:
                    selectedItems.value.map(
                        item => {
                            const changes = {}

                            Object.keys(
                                item.suggestedFix
                            ).forEach(key => {
                                changes[key] = {
                                    oldValue:
                                        item.user[key] ??
                                        null,

                                    newValue:
                                        item.suggestedFix[key],
                                }
                            })

                            return {
                                userId:
                                    item.user.id,

                                username:
                                    item.user.username,

                                changes,
                            }
                        }
                    )
            })

            selectedItems.value.forEach(
                item => {
                    const index =
                        usersStore.users.findIndex(
                            user =>
                                user.id ===
                                item.user.id
                        )

                    if (index !== -1) {
                        usersStore.users[index] = {
                            ...usersStore.users[index],
                            ...item.suggestedFix,
                        }
                    }
                }
            )
            selectedItems.value =
                []

            showBulkDialog.value =
                false
        } catch (error) {
            console.error(error)
        }
        finally {
            updating.value = false
        }
    }
    const headers = [
        {
            title: '',
            key: 'select',
            sortable: false,
        },
        {
            title: 'Name',
            key: 'user.name',
        },
        {
            title: 'Username',
            key: 'user.username',
        },
        {
            title: 'Issues',
            key: 'issues',
            sortable: false,
        },
        {
            title: 'Suggested Fix',
            key: 'suggestedFix',
            sortable: false,
        },
        {
            title: 'Actions',
            key: 'actions',
            sortable: false,
        },
        {
            title: 'View',
            key: 'view',
            sortable: false,
        },
    ]
    const page = ref(1)
    const itemsPerPage = 25
    const currentPageItems = computed(() => {
    const start =
        (page.value - 1) *
        itemsPerPage

    return usersWithIssues.value.slice(
        start,
        start + itemsPerPage
    )
})
</script>

<template>
    <div>
        <h1 class="mb-4">
            Data Integrity
        </h1>

        <v-alert type="warning" variant="tonal" class="mb-4">
            {{ usersWithIssues.length }}
            users have data issues
        </v-alert>
        <v-card v-if="
            selectedItems.length
        " class="mb-4">
            <v-card-text class="
      d-flex
      align-center
      ga-4
    ">

                <strong>
                    {{
                        selectedItems.length
                    }}
                    selected
                </strong>

                <v-btn color="primary" @click="
                    openBulkDialog()
                    ">
                    Apply Suggested Fixes
                </v-btn>

                <v-btn variant="text" @click="
                    selectedItems = []
                    ">
                    Clear
                </v-btn>

            </v-card-text>
        </v-card>
        <v-data-table
    :headers="headers"
    :items="usersWithIssues"
    v-model:page="page"
    return-object
    :items-per-page="itemsPerPage"
    class="elevation-1"
>
            <template v-slot:[`header.select`]>
                <v-checkbox :model-value="selectedItems.length ===
                    usersWithIssues.length
                    " hide-details @update:model-value="
            toggleSelectAll
        " />
            </template>
       
    <template v-slot:[`item.select`]="{ item }">
        <v-checkbox
            :model-value="
                selectedItems.some(
                    x =>
                        x.user.id ===
                        item.user.id
                )
            "
            hide-details
            @update:model-value="
                toggleSelection(item)
            "
        />
    </template>

    <template v-slot:[`item.issues`]="{ item }">
        <div class="d-flex flex-wrap ga-1">
            <v-chip
                v-for="issue in item.issues"
                :key="issue.key"
                color="error"
                size="small"
            >
                {{ issue.label }}
            </v-chip>
        </div>
    </template>

    <template v-slot:[`item.suggestedFix`]="{ item }">
        <div
            v-for="(value, key) in item.suggestedFix"
            :key="key"
        >
            <strong>{{ key }}</strong>:
            {{ value }}
        </div>
    </template>

    <template v-slot:[`item.actions`]="{ item }">
        <div class="d-flex ga-2">
            <v-btn
                color="primary"
                size="small"
                @click="
                    applySuggestedFix(
                        item
                    )
                "
            >
                Apply Suggested
            </v-btn>

            <v-btn
                color="warning"
                size="small"
                @click="
                    markGuest(item)
                "
            >
                Guest
            </v-btn>

            <v-btn
                color="success"
                size="small"
                @click="
                    markRegistered(
                        item
                    )
                "
            >
                Registered
            </v-btn>
        </div>
    </template>

    <template v-slot:[`item.view`]="{ item }">
        <v-btn
            icon
            variant="text"
            @click="
                viewUser(
                    item.user
                )
            "
        >
            <v-icon>
                mdi-eye
            </v-icon>
        </v-btn>
    </template>
</v-data-table>
    </div>
    <ConfirmUserUpdateDialog v-model="showDialog" :user="selectedItem?.user
        " :updates="pendingUpdates
    " :loading="updating" @confirm="confirmFix" />
    <UserDetailsDrawer v-model="showUserDrawer" :user="selectedUser" />
    <ConfirmBulkUserUpdateDialog v-model="showBulkDialog" :items="selectedItems" :loading="updating"
        @confirm="confirmBulkFix" />
</template>