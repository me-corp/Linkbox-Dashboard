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
        getFolderAudienceIssues,
        getFolderAudienceSuggestedFix,
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
        getFoldersAudience,
        updateFolderAudienceFields,
        bulkUpdateFoldersAudience,
        calculateUserCounts,
        applyUserCounts,
    } from '@/services/dataIntegrityService'

    import {
        getLinksMissingPreview,
        fetchBothPreviews,
        applyLinkPreview,
        buildDisplayUpdates,
        runPreviewMigration,
    } from '@/services/linkPreviewMigrationService'

    import ConfirmUserUpdateDialog
        from '@/components/dialogs/ConfirmUserUpdateDialog.vue'
    import ConfirmFixDialog
        from '@/components/dialogs/ConfirmFixDialog.vue'
    import ConfirmBulkFixDialog
        from '@/components/dialogs/ConfirmBulkFixDialog.vue'
    import ConfirmCreateMappingDialog
        from '@/components/dialogs/ConfirmCreateMappingDialog.vue'
    import ConfirmPreviewDialog
        from '@/components/dialogs/ConfirmPreviewDialog.vue'
    import ConfirmBulkPreviewDialog
        from '@/components/dialogs/ConfirmBulkPreviewDialog.vue'
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

    // ---- Folders integrity ----

    const folders = ref([])
    const audienceFolderIds = ref(new Set())
    const foldersLoading = ref(false)
    const foldersLoaded = ref(false)

    async function loadFolders() {
        foldersLoading.value = true

        try {
            const [foldersData, audienceIds] = await Promise.all([
                getFolders(),
                getAudienceFolderIds(),
            ])

            folders.value = foldersData
            audienceFolderIds.value = audienceIds
            foldersLoaded.value = true
        } catch (error) {
            console.error(error)
        } finally {
            foldersLoading.value = false
        }
    }

    // ---- Links integrity ----

    const links = ref([])
    const linksLoading = ref(false)
    const linksLoaded = ref(false)

    async function loadLinks() {
        linksLoading.value = true

        try {
            links.value = await getLinks()
            linksLoaded.value = true
        } catch (error) {
            console.error(error)
        } finally {
            linksLoading.value = false
        }
    }

    // ---- Folder Audience integrity ----

    const foldersAudience = ref([])
    const audienceLoading = ref(false)
    const audienceLoaded = ref(false)

    async function loadFoldersAudience() {
        audienceLoading.value = true

        try {
            foldersAudience.value = await getFoldersAudience()
            audienceLoaded.value = true
        } catch (error) {
            console.error(error)
        } finally {
            audienceLoading.value = false
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

    // -- link issue filters --

    const activeLinkFilters = ref([])

    const linkIssueFilterOptions = computed(() => {
        const counts = new Map()

        linksWithIssues.value.forEach(item => {
            item.issues.forEach(issue => {
                const existing = counts.get(issue.key)

                if (existing) {
                    existing.count++
                } else {
                    counts.set(issue.key, { key: issue.key, label: issue.label, count: 1 })
                }
            })
        })

        return Array.from(counts.values())
    })

    const filteredLinksWithIssues = computed(() => {
        if (!activeLinkFilters.value.length) {
            return linksWithIssues.value
        }

        return linksWithIssues.value.filter(item =>
            item.issues.some(issue => activeLinkFilters.value.includes(issue.key))
        )
    })

    function toggleLinkFilter(key) {
        const index = activeLinkFilters.value.indexOf(key)

        if (index === -1) {
            activeLinkFilters.value.push(key)
        } else {
            activeLinkFilters.value.splice(index, 1)
        }
    }

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

    // -- folders_audience integrity --

    const foldersAudienceWithIssues = computed(() =>
        foldersAudience.value
            .map(audienceDoc => ({
                audienceDoc,
                issues: getFolderAudienceIssues(audienceDoc),
                suggestedFix: getFolderAudienceSuggestedFix(audienceDoc),
            }))
            .filter(item => item.issues.length > 0)
    )

    const audienceHeaders = [
        { title: 'Document ID', key: 'audienceDoc.id' },
        { title: 'Folder ID', key: 'audienceDoc.folderId' },
        { title: 'User ID', key: 'audienceDoc.userId' },
        { title: 'Issues', key: 'issues', sortable: false },
        { title: 'Suggested Fix', key: 'suggestedFix', sortable: false },
        { title: 'Actions', key: 'actions', sortable: false },
    ]

    const activeAudienceFilters = ref([])

    const audienceIssueFilterOptions = computed(() => {
        const counts = new Map()

        foldersAudienceWithIssues.value.forEach(item => {
            item.issues.forEach(issue => {
                const existing = counts.get(issue.key)

                if (existing) {
                    existing.count++
                } else {
                    counts.set(issue.key, { key: issue.key, label: issue.label, count: 1 })
                }
            })
        })

        return Array.from(counts.values())
    })

    const filteredFoldersAudienceWithIssues = computed(() => {
        if (!activeAudienceFilters.value.length) {
            return foldersAudienceWithIssues.value
        }

        return foldersAudienceWithIssues.value.filter(item =>
            item.issues.some(issue => activeAudienceFilters.value.includes(issue.key))
        )
    })

    function toggleAudienceFilter(key) {
        const index = activeAudienceFilters.value.indexOf(key)

        if (index === -1) {
            activeAudienceFilters.value.push(key)
        } else {
            activeAudienceFilters.value.splice(index, 1)
        }
    }

    // -- single folders_audience fix --

    const selectedAudienceItems = ref([])
    const showAudienceFixDialog = ref(false)
    const selectedAudienceItem = ref(null)
    const pendingAudienceUpdates = ref(null)

    function openAudienceFixDialog(item) {
        selectedAudienceItem.value = item
        pendingAudienceUpdates.value = item.suggestedFix
        showAudienceFixDialog.value = true
    }

    async function confirmAudienceFix() {
        const item = selectedAudienceItem.value
        const updates = pendingAudienceUpdates.value

        try {
            updating.value = true

            await updateFolderAudienceFields(item.audienceDoc.id, updates)

            await logAdminAction({
                action: 'apply_folder_audience_fix',
                performedBy: { email: 'harsha@linkbox.store' },
                audienceDocId: item.audienceDoc.id,
                changes: buildChanges(item.audienceDoc, updates),
            })

            Object.assign(item.audienceDoc, updates)

            showAudienceFixDialog.value = false
            selectedAudienceItem.value = null
            pendingAudienceUpdates.value = null
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }

    // -- bulk folders_audience fix --

    const showBulkAudienceDialog = ref(false)

    const selectedAudienceWithFix = computed(() =>
        selectedAudienceItems.value.filter(
            item => Object.keys(item.suggestedFix).length > 0
        )
    )

    const audienceFieldCounts = computed(() =>
        countFields(selectedAudienceWithFix.value)
    )

    async function confirmBulkAudienceFix() {
        const items = selectedAudienceWithFix.value

        try {
            updating.value = true

            await bulkUpdateFoldersAudience(
                items.map(item => ({
                    id: item.audienceDoc.id,
                    fields: item.suggestedFix,
                }))
            )

            await logAdminAction({
                action: 'bulk_apply_folder_audience_fixes',
                performedBy: { email: 'harsha@linkbox.store' },
                itemCount: items.length,
                fieldCounts: countFields(items),
                audienceDocIds: items.map(item => item.audienceDoc.id).slice(0, 200),
            })

            items.forEach(item => {
                Object.assign(item.audienceDoc, item.suggestedFix)
            })

            selectedAudienceItems.value = []
            showBulkAudienceDialog.value = false
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }

    // ---- Migration: recalculate user counters ----

    const migrationRunning = ref(false)
    const migrationResult = ref(null) // null | { processed, linkCounts, folderCounts, addedFolderCounts }

    async function runCounterMigration() {
        migrationRunning.value = true
        migrationResult.value = null

        try {
            const { linkCounts, folderCounts, addedFolderCounts } =
                await calculateUserCounts()

            const userIds = usersStore.users.map(u => u.id)

            const processed = await applyUserCounts(
                userIds,
                linkCounts,
                folderCounts,
                addedFolderCounts,
            )

            // Patch in-memory user objects so the stale-users view reflects
            // the corrected counts immediately without a full reload.
            usersStore.users.forEach(user => {
                user.linksCount = linkCounts[user.id] || 0
                user.foldersCount = folderCounts[user.id] || 0
                user.addedFoldersCount = addedFolderCounts[user.id] || 0
            })

            await logAdminAction({
                action: 'migration_recalculate_user_counters',
                performedBy: { email: 'harsha@linkbox.store' },
                usersUpdated: processed,
            })

            migrationResult.value = { processed }
        } catch (error) {
            console.error(error)
        } finally {
            migrationRunning.value = false
        }
    }

    // ---- Migration: backfill link previews ----

    const previewToken       = ref(import.meta.env.VITE_METADATA_API_TOKEN || '')
    const linkPreviewNetKey  = ref(import.meta.env.VITE_LINKPREVIEW_NET_KEY  || '')

    const previewMigrationRunning  = ref(false)
    const previewMigrationProgress = ref(null)
    const previewMigrationResult   = ref(null)
    const previewLinksCount        = ref(null)
    const previewLinksCountLoading = ref(false)

    async function loadPreviewLinksCount() {
        previewLinksCountLoading.value = true
        try {
            const links = await getLinksMissingPreview()
            previewLinksCount.value = links.length
        } catch (error) {
            console.error(error)
        } finally {
            previewLinksCountLoading.value = false
        }
    }

    async function startPreviewMigration() {
        if (!previewToken.value.trim()) return

        previewMigrationRunning.value  = true
        previewMigrationProgress.value = null
        previewMigrationResult.value   = null

        try {
            const result = await runPreviewMigration(
                previewToken.value.trim(),
                linkPreviewNetKey.value.trim(),
                progress => { previewMigrationProgress.value = { ...progress } }
            )

            previewMigrationResult.value = result

            await logAdminAction({
                action: 'migration_backfill_link_previews',
                performedBy: { email: 'harsha@linkbox.store' },
                ...result,
            })
        } catch (error) {
            console.error(error)
        } finally {
            previewMigrationRunning.value = false
        }
    }

    // ---- Link Previews integrity section ----

    const linkPreviewRows    = ref([])
    const linkPreviewLoading = ref(false)
    const linkPreviewLoaded  = ref(false)

    const linkPreviewHeaders = [
        { title: 'Title / URL',    key: 'title',         sortable: false },
        { title: 'Status',         key: 'previewStatus', sortable: false },
        { title: 'Actions',        key: 'actions',       sortable: false },
    ]

    async function loadLinkPreviews() {
        linkPreviewLoading.value = true
        try {
            linkPreviewRows.value = await getLinksMissingPreview()
            linkPreviewLoaded.value = true
        } catch (error) {
            console.error(error)
        } finally {
            linkPreviewLoading.value = false
        }
    }

    // ---- single preview fix ----

    const fetchingPreviewFor = ref(new Set())
    const showPreviewDialog  = ref(false)
    // { link, scraper, linkPreview, displayUpdates }
    const pendingPreviewItem = ref(null)

    async function fetchSinglePreview(link) {
        if (!previewToken.value.trim()) return

        fetchingPreviewFor.value = new Set([...fetchingPreviewFor.value, link.id])

        try {
            const url = (link.link || link.url || '').trim()
            const { scraper, linkPreview } = await fetchBothPreviews(
                url,
                previewToken.value.trim(),
                linkPreviewNetKey.value.trim(),
            )
            const displayUpdates = buildDisplayUpdates(link, scraper, linkPreview)
            pendingPreviewItem.value = { link, scraper, linkPreview, displayUpdates }
            showPreviewDialog.value  = true
        } catch (error) {
            console.error('Preview fetch failed:', error)
        } finally {
            const next = new Set(fetchingPreviewFor.value)
            next.delete(link.id)
            fetchingPreviewFor.value = next
        }
    }

    async function confirmSinglePreview() {
        const { link, scraper, linkPreview } = pendingPreviewItem.value

        try {
            updating.value = true

            const updates = await applyLinkPreview(link, scraper, linkPreview)

            await logAdminAction({
                action: 'apply_link_preview',
                performedBy: { email: 'harsha@linkbox.store' },
                linkId: link.id,
                previewTitle: (linkPreview?.title || scraper?.title) ?? '',
                previewUrl:   (scraper?.url || linkPreview?.url) ?? '',
            })

            linkPreviewRows.value = linkPreviewRows.value.filter(l => l.id !== link.id)
            Object.assign(link, updates)

            showPreviewDialog.value  = false
            pendingPreviewItem.value = null
        } catch (error) {
            console.error(error)
        } finally {
            updating.value = false
        }
    }

    // ---- bulk preview fix ----

    const selectedPreviewItems     = ref([])
    const showBulkPreviewDialog    = ref(false)
    const bulkPreviewFetching      = ref(false)
    const bulkPreviewFetchProgress = ref(null)
    // [{ link, scraper, linkPreview }]
    const bulkPreviewFetched       = ref([])

    async function fetchBulkPreviews() {
        if (!previewToken.value.trim() || !selectedPreviewItems.value.length) return

        bulkPreviewFetching.value      = true
        bulkPreviewFetchProgress.value = { done: 0, total: selectedPreviewItems.value.length }
        bulkPreviewFetched.value       = []

        for (const link of selectedPreviewItems.value) {
            const url = (link.link || link.url || '').trim()

            try {
                const { scraper, linkPreview } = await fetchBothPreviews(
                    url,
                    previewToken.value.trim(),
                    linkPreviewNetKey.value.trim(),
                )
                bulkPreviewFetched.value.push({ link, scraper, linkPreview })
            } catch {
                // Skip — link stays in the list for retry
            }

            bulkPreviewFetchProgress.value = {
                done:  bulkPreviewFetchProgress.value.done + 1,
                total: bulkPreviewFetchProgress.value.total,
            }
        }

        bulkPreviewFetching.value = false

        if (bulkPreviewFetched.value.length) {
            showBulkPreviewDialog.value = true
        }
    }

    async function confirmBulkPreview() {
        try {
            updating.value = true

            for (const { link, scraper, linkPreview } of bulkPreviewFetched.value) {
                const updates = await applyLinkPreview(link, scraper, linkPreview)
                Object.assign(link, updates)
                linkPreviewRows.value = linkPreviewRows.value.filter(l => l.id !== link.id)
            }

            await logAdminAction({
                action: 'bulk_apply_link_previews',
                performedBy: { email: 'harsha@linkbox.store' },
                count: bulkPreviewFetched.value.length,
                linkIds: bulkPreviewFetched.value.map(i => i.link.id).slice(0, 200),
            })

            selectedPreviewItems.value  = []
            bulkPreviewFetched.value    = []
            showBulkPreviewDialog.value = false
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

    <!-- ---- Folders ---- -->
    <div class="mt-8">
        <h1 class="mb-4">Folders</h1>

        <v-card class="mb-4">
            <v-card-text class="d-flex align-center ga-4 flex-wrap">
                <div>
                    <div class="text-subtitle-1 font-weight-bold">Folder Integrity Check</div>
                    <div class="text-caption text-medium-emphasis">
                        Checks for folders missing a folders_audience mapping and folders
                        missing the isFavourite, isHidden or isPublic flags.
                    </div>
                </div>
                <v-spacer />
                <v-btn color="primary" :loading="foldersLoading" @click="loadFolders">
                    {{ foldersLoaded ? 'Re-run Check' : 'Run Check' }}
                </v-btn>
            </v-card-text>
        </v-card>

        <template v-if="foldersLoaded">
            <v-alert type="warning" variant="tonal" class="mb-4">
                {{ foldersWithIssues.length }} of {{ folders.length }} folders have data issues
            </v-alert>

            <v-card v-if="selectedFoldersWithFix.length" class="mb-4">
                <v-card-text class="d-flex align-center ga-4">
                    <strong>{{ selectedFoldersWithFix.length }} selected</strong>
                    <v-btn color="primary" @click="showBulkFolderDialog = true">Apply Suggested Fixes</v-btn>
                    <v-btn variant="text" @click="selectedFolderItems = []">Clear</v-btn>
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
                class="elevation-1"
            >
                <template v-slot:[`item.issues`]="{ item }">
                    <div class="d-flex flex-wrap ga-1">
                        <v-chip v-for="issue in item.issues" :key="issue.key" color="error" size="small">
                            {{ issue.label }}
                        </v-chip>
                    </div>
                </template>

                <template v-slot:[`item.suggestedFix`]="{ item }">
                    <span v-if="!Object.keys(item.suggestedFix).length" class="text-medium-emphasis">—</span>
                    <div v-for="(value, key) in item.suggestedFix" :key="key">
                        <strong>{{ key }}</strong>: {{ value }}
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
        </template>
    </div>

    <!-- ---- Links ---- -->
    <div class="mt-8">
        <h1 class="mb-4">Links</h1>

        <v-card class="mb-4">
            <v-card-text class="d-flex align-center ga-4 flex-wrap">
                <div>
                    <div class="text-subtitle-1 font-weight-bold">Link Integrity Check</div>
                    <div class="text-caption text-medium-emphasis">
                        Checks for links missing the IsDeleted or IsHidden flags.
                    </div>
                </div>
                <v-spacer />
                <v-btn color="primary" :loading="linksLoading" @click="loadLinks">
                    {{ linksLoaded ? 'Re-run Check' : 'Run Check' }}
                </v-btn>
            </v-card-text>
        </v-card>

        <template v-if="linksLoaded">
            <v-alert type="warning" variant="tonal" class="mb-4">
                {{ linksWithIssues.length }} of {{ links.length }} links have data issues
            </v-alert>

            <div v-if="linkIssueFilterOptions.length" class="d-flex flex-wrap align-center ga-2 mb-4">
                <span class="text-caption text-medium-emphasis mr-1">Filter by issue:</span>
                <v-chip
                    v-for="option in linkIssueFilterOptions"
                    :key="option.key"
                    size="small"
                    :color="activeLinkFilters.includes(option.key) ? 'primary' : undefined"
                    :variant="activeLinkFilters.includes(option.key) ? 'flat' : 'outlined'"
                    @click="toggleLinkFilter(option.key)"
                >
                    {{ option.label }} ({{ option.count }})
                </v-chip>
                <v-chip
                    v-if="activeLinkFilters.length"
                    size="small"
                    variant="text"
                    @click="activeLinkFilters = []"
                >
                    Clear filters
                </v-chip>
            </div>

            <v-card v-if="selectedLinksWithFix.length" class="mb-4">
                <v-card-text class="d-flex align-center ga-4">
                    <strong>{{ selectedLinksWithFix.length }} selected</strong>
                    <v-btn color="primary" @click="showBulkLinkDialog = true">Apply Suggested Fixes</v-btn>
                    <v-btn variant="text" @click="selectedLinkItems = []">Clear</v-btn>
                </v-card-text>
            </v-card>

            <v-data-table
                v-model="selectedLinkItems"
                :headers="linkHeaders"
                :items="filteredLinksWithIssues"
                :item-value="item => item.link.id"
                show-select
                return-object
                :items-per-page="25"
                class="elevation-1"
            >
                <template v-slot:[`item.issues`]="{ item }">
                    <div class="d-flex flex-wrap ga-1">
                        <v-chip v-for="issue in item.issues" :key="issue.key" color="error" size="small">
                            {{ issue.label }}
                        </v-chip>
                    </div>
                </template>

                <template v-slot:[`item.suggestedFix`]="{ item }">
                    <span v-if="!Object.keys(item.suggestedFix).length" class="text-medium-emphasis">—</span>
                    <div v-for="(value, key) in item.suggestedFix" :key="key">
                        <strong>{{ key }}</strong>: {{ value }}
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

    <!-- ---- Folder Audience Mappings ---- -->
    <div class="mt-8">
        <h1 class="mb-4">Folder Audience Mappings</h1>

        <v-card class="mb-4">
            <v-card-text class="d-flex align-center ga-4 flex-wrap">
                <div>
                    <div class="text-subtitle-1 font-weight-bold">Folder Audience Integrity Check</div>
                    <div class="text-caption text-medium-emphasis">
                        Checks for folders_audience documents missing the isDeleted or isHidden flags,
                        which would exclude them from app queries.
                    </div>
                </div>
                <v-spacer />
                <v-btn color="primary" :loading="audienceLoading" @click="loadFoldersAudience">
                    {{ audienceLoaded ? 'Re-run Check' : 'Run Check' }}
                </v-btn>
            </v-card-text>
        </v-card>

        <template v-if="audienceLoaded">
            <v-alert type="warning" variant="tonal" class="mb-4">
                {{ foldersAudienceWithIssues.length }} of {{ foldersAudience.length }}
                folders_audience documents have data issues
            </v-alert>

            <div v-if="audienceIssueFilterOptions.length" class="d-flex flex-wrap align-center ga-2 mb-4">
                <span class="text-caption text-medium-emphasis mr-1">Filter by issue:</span>
                <v-chip
                    v-for="option in audienceIssueFilterOptions"
                    :key="option.key"
                    size="small"
                    :color="activeAudienceFilters.includes(option.key) ? 'primary' : undefined"
                    :variant="activeAudienceFilters.includes(option.key) ? 'flat' : 'outlined'"
                    @click="toggleAudienceFilter(option.key)"
                >
                    {{ option.label }} ({{ option.count }})
                </v-chip>
                <v-chip
                    v-if="activeAudienceFilters.length"
                    size="small"
                    variant="text"
                    @click="activeAudienceFilters = []"
                >
                    Clear filters
                </v-chip>
            </div>

            <v-card v-if="selectedAudienceWithFix.length" class="mb-4">
                <v-card-text class="d-flex align-center ga-4">
                    <strong>{{ selectedAudienceWithFix.length }} selected</strong>
                    <v-btn color="primary" @click="showBulkAudienceDialog = true">Apply Suggested Fixes</v-btn>
                    <v-btn variant="text" @click="selectedAudienceItems = []">Clear</v-btn>
                </v-card-text>
            </v-card>

            <v-data-table
                v-model="selectedAudienceItems"
                :headers="audienceHeaders"
                :items="filteredFoldersAudienceWithIssues"
                :item-value="item => item.audienceDoc.id"
                show-select
                return-object
                :items-per-page="25"
                class="elevation-1"
            >
                <template v-slot:[`item.issues`]="{ item }">
                    <div class="d-flex flex-wrap ga-1">
                        <v-chip v-for="issue in item.issues" :key="issue.key" color="error" size="small">
                            {{ issue.label }}
                        </v-chip>
                    </div>
                </template>

                <template v-slot:[`item.suggestedFix`]="{ item }">
                    <span v-if="!Object.keys(item.suggestedFix).length" class="text-medium-emphasis">—</span>
                    <div v-for="(value, key) in item.suggestedFix" :key="key">
                        <strong>{{ key }}</strong>: {{ value }}
                    </div>
                </template>

                <template v-slot:[`item.actions`]="{ item }">
                    <v-btn
                        v-if="Object.keys(item.suggestedFix).length"
                        color="primary"
                        size="small"
                        @click="openAudienceFixDialog(item)"
                    >
                        Apply Suggested
                    </v-btn>
                </template>
            </v-data-table>
        </template>
    </div>

    <!-- ---- Link Previews ---- -->
    <div class="mt-8">
        <h1 class="mb-4">Link Previews</h1>

        <v-card class="mb-4">
            <v-card-text class="d-flex align-center ga-4 flex-wrap">
                <div>
                    <div class="text-subtitle-1 font-weight-bold">Link Preview Check</div>
                    <div class="text-caption text-medium-emphasis">
                        Finds links without a fetched preview (<code>previewStatus ≠ fetched</code>).
                        Select rows and fetch previews individually or in bulk, then confirm before writing.
                    </div>
                </div>
                <v-spacer />
                <v-btn color="primary" :loading="linkPreviewLoading" @click="loadLinkPreviews">
                    {{ linkPreviewLoaded ? 'Re-run Check' : 'Run Check' }}
                </v-btn>
            </v-card-text>
        </v-card>

        <template v-if="linkPreviewLoaded">
            <!-- Token inputs — shared with the Migrations section below -->
            <div class="d-flex flex-wrap ga-3 mb-4">
                <v-text-field
                    v-model="previewToken"
                    label="Scrapper token (x-linkbox-token)"
                    placeholder="Same as LINKBOX_METADATA_TOKEN"
                    type="password"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 380px"
                />
                <v-text-field
                    v-model="linkPreviewNetKey"
                    label="linkpreview.net API key"
                    placeholder="X-Linkpreview-Api-Key value"
                    type="password"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 320px"
                />
            </div>

            <v-alert type="warning" variant="tonal" class="mb-4">
                <strong>{{ linkPreviewRows.length }}</strong> links are missing a preview
            </v-alert>

            <!-- Bulk action bar -->
            <v-card v-if="selectedPreviewItems.length" class="mb-4">
                <v-card-text class="d-flex align-center ga-4 flex-wrap">
                    <strong>{{ selectedPreviewItems.length }} selected</strong>

                    <v-btn
                        color="primary"
                        :loading="bulkPreviewFetching"
                        :disabled="!previewToken.trim()"
                        @click="fetchBulkPreviews"
                    >
                        Fetch Previews for Selected
                    </v-btn>

                    <v-btn variant="text" @click="selectedPreviewItems = []">Clear</v-btn>

                    <template v-if="bulkPreviewFetching && bulkPreviewFetchProgress">
                        <span class="text-caption text-medium-emphasis">
                            Fetching {{ bulkPreviewFetchProgress.done }} /
                            {{ bulkPreviewFetchProgress.total }}…
                        </span>
                        <v-progress-linear
                            :model-value="(bulkPreviewFetchProgress.done / bulkPreviewFetchProgress.total) * 100"
                            color="primary"
                            height="4"
                            rounded
                            style="max-width: 200px"
                        />
                    </template>
                </v-card-text>
            </v-card>

            <v-data-table
                v-model="selectedPreviewItems"
                :headers="linkPreviewHeaders"
                :items="linkPreviewRows"
                :item-value="row => row.id"
                show-select
                return-object
                :items-per-page="25"
                class="elevation-1"
            >
                <template v-slot:[`item.title`]="{ item }">
                    <div>
                        <div class="font-weight-medium text-body-2">
                            {{ item.title || '(no title)' }}
                        </div>
                        <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 320px">
                            {{ item.link || item.url }}
                        </div>
                    </div>
                </template>

                <template v-slot:[`item.previewStatus`]="{ item }">
                    <v-chip
                        size="small"
                        :color="item.previewStatus === 'failed' ? 'error'
                              : item.previewStatus === 'fetching' ? 'warning'
                              : 'grey'"
                        variant="tonal"
                    >
                        {{ item.previewStatus || 'none' }}
                    </v-chip>
                </template>

                <template v-slot:[`item.actions`]="{ item }">
                    <v-btn
                        color="primary"
                        size="small"
                        :loading="fetchingPreviewFor.has(item.id)"
                        :disabled="!previewToken.trim() || fetchingPreviewFor.has(item.id)"
                        @click="fetchSinglePreview(item)"
                    >
                        Fetch Preview
                    </v-btn>
                </template>
            </v-data-table>
        </template>
    </div>

    <!-- ---- Migrations ---- -->
    <div class="mt-8">
        <h1 class="mb-4">Migrations</h1>

        <v-card>
            <v-card-text class="d-flex align-center ga-4 flex-wrap">
                <div>
                    <div class="text-subtitle-1 font-weight-bold">
                        Recalculate User Counters
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        Counts each user's actual links, owned folders, and added folders directly
                        from Firestore, then writes the corrected values to
                        <code>linksCount</code>, <code>foldersCount</code>, and
                        <code>addedFoldersCount</code> on every user document.
                        Run this once to fix counters for users created before the triggers were deployed.
                        Requires users to be loaded first (Users section above).
                    </div>
                </div>

                <v-spacer />

                <v-btn
                    color="warning"
                    :loading="migrationRunning"
                    :disabled="!usersStore.users.length"
                    @click="runCounterMigration"
                >
                    Run Migration
                </v-btn>
            </v-card-text>

            <v-divider v-if="migrationResult" />

            <v-card-text v-if="migrationResult">
                <v-alert type="success" variant="tonal" density="comfortable">
                    Migration complete — updated counters for
                    <strong>{{ migrationResult.processed }}</strong> users.
                </v-alert>
            </v-card-text>
        </v-card>

        <!-- Link Preview Migration -->
        <v-card class="mt-4">
            <v-card-text class="d-flex align-center ga-4 flex-wrap">
                <div>
                    <div class="text-subtitle-1 font-weight-bold">
                        Backfill Link Previews
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        Fetches title, description, image, and favicon for every link that
                        doesn't have a preview yet (<code>previewStatus ≠ fetched</code>)
                        by calling the LinkBox scrapper API. Blocked domains (e.g. Flipkart)
                        are skipped. Rate-limited to ~120 req/min.
                    </div>
                </div>

                <v-spacer />

                <div class="d-flex align-center ga-2">
                    <v-btn
                        variant="outlined"
                        size="small"
                        :loading="previewLinksCountLoading"
                        @click="loadPreviewLinksCount"
                    >
                        Count links
                    </v-btn>

                    <v-chip v-if="previewLinksCount !== null" size="small" color="warning" variant="tonal">
                        {{ previewLinksCount }} links need previews
                    </v-chip>
                </div>
            </v-card-text>

            <v-divider />

            <v-card-text>
                <div class="text-caption text-medium-emphasis mb-3">
                    Uses the API token entered in the Link Previews section above.
                </div>

                <v-btn
                    color="warning"
                    :loading="previewMigrationRunning"
                    :disabled="!previewToken.trim()"
                    @click="startPreviewMigration"
                >
                    Run Migration
                </v-btn>
            </v-card-text>

            <template v-if="previewMigrationProgress || previewMigrationResult">
                <v-divider />

                <v-card-text>
                    <!-- Progress bar while running -->
                    <template v-if="previewMigrationRunning && previewMigrationProgress">
                        <div class="text-body-2 mb-2">
                            Processing {{ previewMigrationProgress.processed }} of
                            {{ previewMigrationProgress.total }} links…
                        </div>
                        <v-progress-linear
                            :model-value="previewMigrationProgress.total
                                ? (previewMigrationProgress.processed / previewMigrationProgress.total) * 100
                                : 0"
                            color="warning"
                            height="8"
                            rounded
                            class="mb-3"
                        />
                        <div class="d-flex ga-4 text-caption text-medium-emphasis">
                            <span>✓ {{ previewMigrationProgress.succeeded }} succeeded</span>
                            <span>✗ {{ previewMigrationProgress.failed }} failed</span>
                            <span>⊘ {{ previewMigrationProgress.skipped }} skipped</span>
                        </div>
                    </template>

                    <!-- Result after completion -->
                    <v-alert
                        v-if="previewMigrationResult"
                        type="success"
                        variant="tonal"
                        density="comfortable"
                    >
                        Migration complete — processed
                        <strong>{{ previewMigrationResult.total }}</strong> links:
                        <strong>{{ previewMigrationResult.succeeded }}</strong> fetched,
                        <strong>{{ previewMigrationResult.failed }}</strong> failed,
                        <strong>{{ previewMigrationResult.skipped }}</strong> skipped (blocked domains).
                    </v-alert>
                </v-card-text>
            </template>
        </v-card>
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

    <ConfirmFixDialog
        v-model="showAudienceFixDialog"
        title="Confirm Folder Audience Update"
        :item-label="selectedAudienceItem?.audienceDoc?.id"
        :item-sub-label="selectedAudienceItem?.audienceDoc?.folderId"
        :current="selectedAudienceItem?.audienceDoc"
        :updates="pendingAudienceUpdates"
        :loading="updating"
        @confirm="confirmAudienceFix"
    />

    <ConfirmBulkFixDialog
        v-model="showBulkAudienceDialog"
        title="Bulk Apply Folder Audience Fixes"
        item-label="folders_audience documents"
        :count="selectedAudienceWithFix.length"
        :field-counts="audienceFieldCounts"
        :loading="updating"
        @confirm="confirmBulkAudienceFix"
    />

    <ConfirmPreviewDialog
        v-model="showPreviewDialog"
        :link="pendingPreviewItem?.link"
        :scraper="pendingPreviewItem?.scraper"
        :link-preview="pendingPreviewItem?.linkPreview"
        :display-updates="pendingPreviewItem?.displayUpdates"
        :loading="updating"
        @confirm="confirmSinglePreview"
    />

    <ConfirmBulkPreviewDialog
        v-model="showBulkPreviewDialog"
        :items="bulkPreviewFetched"
        :loading="updating"
        @confirm="confirmBulkPreview"
    />
</template>