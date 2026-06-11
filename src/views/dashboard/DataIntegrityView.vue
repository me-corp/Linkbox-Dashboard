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
        getFolderIssues,
        getFolderSuggestedFix,
        getLinkIssues,
        getLinkSuggestedFix,
    } from '@/services/dataQualityService'

    import {
        getFolders,
        getLinks,
        getAudienceFolderIds,
        updateFolderFields,
        updateLinkFields,
        createFolderAudienceMapping,
        bulkUpdateFolders,
        bulkUpdateLinks,
    } from '@/services/dataIntegrityService'

    import ConfirmUserUpdateDialog
        from '@/components/dialogs/ConfirmUserUpdateDialog.vue'
    import ConfirmFixDialog
        from '@/components/dialogs/ConfirmFixDialog.vue'
    import ConfirmBulkFixDialog
        from '@/components/dialogs/ConfirmBulkFixDialog.vue'
    import ConfirmCreateMappingDialog
        from '@/components/dialogs/ConfirmCreateMappingDialog.vue'
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

    // ---- Folders & Links integrity ----

    const folders = ref([])
    const links = ref([])
    const audienceFolderIds = ref(new Set())

    const foldersLinksLoading = ref(false)
    const foldersLinksLoaded = ref(false)

    async function loadFoldersAndLinks() {
        foldersLinksLoading.value = true

        try {
            const [
                foldersData,
                linksData,
                audienceIds,
            ] = await Promise.all([
                getFolders(),
                getLinks(),
                getAudienceFolderIds(),
            ])

            folders.value = foldersData
            links.value = linksData
            audienceFolderIds.value = audienceIds

            foldersLinksLoaded.value = true
        } catch (error) {
            console.error(error)
        } finally {
            foldersLinksLoading.value = false
        }
    }

    const foldersWithIssues = computed(() =>
        folders.value
            .map(folder => ({
                folder,
                issues: getFolderIssues(folder, audienceFolderIds.value),
                suggestedFix: getFolderSuggestedFix(folder),
            }))
            .filter(item => item.issues.length > 0)
    )

    const linksWithIssues = computed(() =>
        links.value
            .map(link => ({
                link,
                issues: getLinkIssues(link),
                suggestedFix: getLinkSuggestedFix(link),
            }))
            .filter(item => item.issues.length > 0)
    )

    const folderHeaders = [
        { title: 'Title', key: 'folder.title' },
        { title: 'Folder ID', key: 'folder.id' },
        { title: 'User ID', key: 'folder.userId' },
        { title: 'Issues', key: 'issues', sortable: false },
        { title: 'Suggested Fix', key: 'suggestedFix', sortable: false },
        { title: 'Actions', key: 'actions', sortable: false },
    ]

    const linkHeaders = [
        { title: 'Title', key: 'link.title' },
        { title: 'Link ID', key: 'link.id' },
        { title: 'User ID', key: 'link.userId' },
        { title: 'Issues', key: 'issues', sortable: false },
        { title: 'Suggested Fix', key: 'suggestedFix', sortable: false },
        { title: 'Actions', key: 'actions', sortable: false },
    ]

    function buildChanges(current, updates) {
        const changes = {}

        Object.entries(updates).forEach(([key, newValue]) => {
            changes[key] = {
                oldValue: key === 'id' ? current.storedId ?? null : current[key] ?? null,
                newValue,
            }
        })

        return changes
    }

    // keeps the in-memory storedId in sync once the id field has been
    // written back to the document, so the issue clears without a re-run
    function syncStoredId(item, updates) {
        if ('id' in updates) {
            item.storedId = updates.id
        }
    }

    // -- single folder fix --

    const selectedFolderItems = ref([])
    const showFolderFixDialog = ref(false)
    const selectedFolderItem = ref(null)
    const pendingFolderUpdates = ref(null)

    function openFolderFixDialog(item) {
        selectedFolderItem.value = item
        pendingFolderUpdates.value = item.suggestedFix
        showFolderFixDialog.value = true
    }

    async function confirmFolderFix() {
        const item = selectedFolderItem.value
        const updates = pendingFolderUpdates.value

        try {
            updating.value = true

            await updateFolderFields(item.folder.id, updates)

            await logAdminAction({
                action: 'apply_folder_fix',
                performedBy: { email: 'harsha@linkbox.store' },
                folderId: item.folder.id,
                changes: buildChanges(item.folder, updates),
            })

            Object.assign(item.folder, updates)
            syncStoredId(item.folder, updates)

            showFolderFixDialog.value = false
            selectedFolderItem.value = null
            pendingFolderUpdates.value = null
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }

    // -- bulk folder fix --

    const showBulkFolderDialog = ref(false)

    const selectedFoldersWithFix = computed(() =>
        selectedFolderItems.value.filter(
            item => Object.keys(item.suggestedFix).length > 0
        )
    )

    const folderFieldCounts = computed(() =>
        countFields(selectedFoldersWithFix.value)
    )

    function countFields(items) {
        const counts = {}

        items.forEach(item => {
            Object.keys(item.suggestedFix).forEach(field => {
                counts[field] = (counts[field] || 0) + 1
            })
        })

        return counts
    }

    async function confirmBulkFolderFix() {
        const items = selectedFoldersWithFix.value

        try {
            updating.value = true

            await bulkUpdateFolders(
                items.map(item => ({
                    id: item.folder.id,
                    fields: item.suggestedFix,
                }))
            )

            await logAdminAction({
                action: 'bulk_apply_folder_fixes',
                performedBy: { email: 'harsha@linkbox.store' },
                itemCount: items.length,
                fieldCounts: countFields(items),
                folderIds: items.map(item => item.folder.id).slice(0, 200),
            })

            items.forEach(item => {
                Object.assign(item.folder, item.suggestedFix)
                syncStoredId(item.folder, item.suggestedFix)
            })

            selectedFolderItems.value = []
            showBulkFolderDialog.value = false
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }

    // -- create missing audience mapping --

    const showMappingDialog = ref(false)
    const mappingFolderItem = ref(null)

    function openCreateMappingDialog(item) {
        mappingFolderItem.value = item
        showMappingDialog.value = true
    }

    async function confirmCreateMapping() {
        const folder = mappingFolderItem.value.folder

        try {
            updating.value = true

            await createFolderAudienceMapping(folder)

            await logAdminAction({
                action: 'create_folder_audience_mapping',
                performedBy: { email: 'harsha@linkbox.store' },
                folderId: folder.id,
                userId: folder.userId,
            })

            audienceFolderIds.value.add(folder.id)

            showMappingDialog.value = false
            mappingFolderItem.value = null
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }

    // -- single link fix --

    const selectedLinkItems = ref([])
    const showLinkFixDialog = ref(false)
    const selectedLinkItem = ref(null)
    const pendingLinkUpdates = ref(null)

    function openLinkFixDialog(item) {
        selectedLinkItem.value = item
        pendingLinkUpdates.value = item.suggestedFix
        showLinkFixDialog.value = true
    }

    async function confirmLinkFix() {
        const item = selectedLinkItem.value
        const updates = pendingLinkUpdates.value

        try {
            updating.value = true

            await updateLinkFields(item.link.id, updates)

            await logAdminAction({
                action: 'apply_link_fix',
                performedBy: { email: 'harsha@linkbox.store' },
                linkId: item.link.id,
                changes: buildChanges(item.link, updates),
            })

            Object.assign(item.link, updates)
            syncStoredId(item.link, updates)

            showLinkFixDialog.value = false
            selectedLinkItem.value = null
            pendingLinkUpdates.value = null
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }

    // -- bulk link fix --

    const showBulkLinkDialog = ref(false)

    const selectedLinksWithFix = computed(() =>
        selectedLinkItems.value.filter(
            item => Object.keys(item.suggestedFix).length > 0
        )
    )

    const linkFieldCounts = computed(() =>
        countFields(selectedLinksWithFix.value)
    )

    async function confirmBulkLinkFix() {
        const items = selectedLinksWithFix.value

        try {
            updating.value = true

            await bulkUpdateLinks(
                items.map(item => ({
                    id: item.link.id,
                    fields: item.suggestedFix,
                }))
            )

            await logAdminAction({
                action: 'bulk_apply_link_fixes',
                performedBy: { email: 'harsha@linkbox.store' },
                itemCount: items.length,
                fieldCounts: countFields(items),
                linkIds: items.map(item => item.link.id).slice(0, 200),
            })

            items.forEach(item => {
                Object.assign(item.link, item.suggestedFix)
                syncStoredId(item.link, item.suggestedFix)
            })

            selectedLinkItems.value = []
            showBulkLinkDialog.value = false
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }
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

    <div class="mt-8">
        <h1 class="mb-4">
            Folders &amp; Links
        </h1>

        <v-card class="mb-4">
            <v-card-text class="d-flex align-center ga-4 flex-wrap">
                <div>
                    <div class="text-subtitle-1 font-weight-bold">
                        Folder &amp; Link Integrity Check
                    </div>

                    <div class="text-caption text-medium-emphasis">
                        Checks for folders missing a folders_audience mapping
                        (unreachable from the app), and folders / links missing
                        the isFavourite, isHidden or isPublic flags.
                    </div>
                </div>

                <v-spacer />

                <v-btn color="primary" :loading="foldersLinksLoading" @click="loadFoldersAndLinks">
                    {{ foldersLinksLoaded ? 'Re-run Check' : 'Run Check' }}
                </v-btn>
            </v-card-text>
        </v-card>

        <template v-if="foldersLinksLoaded">
            <h2 class="mb-4">
                Folders
            </h2>

            <v-alert type="warning" variant="tonal" class="mb-4">
                {{ foldersWithIssues.length }}
                of
                {{ folders.length }}
                folders have data issues
            </v-alert>

            <v-card v-if="selectedFoldersWithFix.length" class="mb-4">
                <v-card-text class="d-flex align-center ga-4">
                    <strong>
                        {{ selectedFoldersWithFix.length }}
                        selected
                    </strong>

                    <v-btn color="primary" @click="showBulkFolderDialog = true">
                        Apply Suggested Fixes
                    </v-btn>

                    <v-btn variant="text" @click="selectedFolderItems = []">
                        Clear
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-data-table
                v-model="selectedFolderItems"
                :headers="folderHeaders"
                :items="foldersWithIssues"
                :item-value="item => item.folder.id"
                show-select
                return-object
                :items-per-page="25"
                class="elevation-1 mb-8"
            >
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
                    <span v-if="!Object.keys(item.suggestedFix).length" class="text-medium-emphasis">
                        —
                    </span>

                    <div
                        v-for="(value, key) in item.suggestedFix"
                        :key="key"
                    >
                        <strong>{{ key }}</strong>:
                        {{ value }}
                    </div>
                </template>

                <template v-slot:[`item.actions`]="{ item }">
                    <div class="d-flex ga-2 flex-wrap">
                        <v-btn
                            v-if="Object.keys(item.suggestedFix).length"
                            color="primary"
                            size="small"
                            @click="openFolderFixDialog(item)"
                        >
                            Apply Suggested
                        </v-btn>

                        <v-btn
                            v-if="!audienceFolderIds.has(item.folder.id)"
                            color="warning"
                            size="small"
                            @click="openCreateMappingDialog(item)"
                        >
                            Create Mapping
                        </v-btn>
                    </div>
                </template>
            </v-data-table>

            <h2 class="mb-4">
                Links
            </h2>

            <v-alert type="warning" variant="tonal" class="mb-4">
                {{ linksWithIssues.length }}
                of
                {{ links.length }}
                links have data issues
            </v-alert>

            <v-card v-if="selectedLinksWithFix.length" class="mb-4">
                <v-card-text class="d-flex align-center ga-4">
                    <strong>
                        {{ selectedLinksWithFix.length }}
                        selected
                    </strong>

                    <v-btn color="primary" @click="showBulkLinkDialog = true">
                        Apply Suggested Fixes
                    </v-btn>

                    <v-btn variant="text" @click="selectedLinkItems = []">
                        Clear
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-data-table
                v-model="selectedLinkItems"
                :headers="linkHeaders"
                :items="linksWithIssues"
                :item-value="item => item.link.id"
                show-select
                return-object
                :items-per-page="25"
                class="elevation-1"
            >
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
                    <span v-if="!Object.keys(item.suggestedFix).length" class="text-medium-emphasis">
                        —
                    </span>

                    <div
                        v-for="(value, key) in item.suggestedFix"
                        :key="key"
                    >
                        <strong>{{ key }}</strong>:
                        {{ value }}
                    </div>
                </template>

                <template v-slot:[`item.actions`]="{ item }">
                    <v-btn
                        v-if="Object.keys(item.suggestedFix).length"
                        color="primary"
                        size="small"
                        @click="openLinkFixDialog(item)"
                    >
                        Apply Suggested
                    </v-btn>
                </template>
            </v-data-table>
        </template>
    </div>

    <ConfirmUserUpdateDialog v-model="showDialog" :user="selectedItem?.user
        " :updates="pendingUpdates
    " :loading="updating" @confirm="confirmFix" />
    <UserDetailsDrawer v-model="showUserDrawer" :user="selectedUser" />
    <ConfirmBulkUserUpdateDialog v-model="showBulkDialog" :items="selectedItems" :loading="updating"
        @confirm="confirmBulkFix" />

    <ConfirmFixDialog
        v-model="showFolderFixDialog"
        title="Confirm Folder Update"
        :item-label="selectedFolderItem?.folder?.title || selectedFolderItem?.folder?.id"
        :item-sub-label="selectedFolderItem?.folder?.id"
        :current="selectedFolderItem?.folder"
        :updates="pendingFolderUpdates"
        :loading="updating"
        @confirm="confirmFolderFix"
    />

    <ConfirmBulkFixDialog
        v-model="showBulkFolderDialog"
        title="Bulk Apply Folder Fixes"
        item-label="folders"
        :count="selectedFoldersWithFix.length"
        :field-counts="folderFieldCounts"
        :loading="updating"
        @confirm="confirmBulkFolderFix"
    />

    <ConfirmCreateMappingDialog
        v-model="showMappingDialog"
        :folder="mappingFolderItem?.folder"
        :loading="updating"
        @confirm="confirmCreateMapping"
    />

    <ConfirmFixDialog
        v-model="showLinkFixDialog"
        title="Confirm Link Update"
        :item-label="selectedLinkItem?.link?.title || selectedLinkItem?.link?.id"
        :item-sub-label="selectedLinkItem?.link?.id"
        :current="selectedLinkItem?.link"
        :updates="pendingLinkUpdates"
        :loading="updating"
        @confirm="confirmLinkFix"
    />

    <ConfirmBulkFixDialog
        v-model="showBulkLinkDialog"
        title="Bulk Apply Link Fixes"
        item-label="links"
        :count="selectedLinksWithFix.length"
        :field-counts="linkFieldCounts"
        :loading="updating"
        @confirm="confirmBulkLinkFix"
    />
</template>