<script setup>
    import {
        computed,
        ref,
        onMounted,
    } from 'vue'

    import { useUsersStore }
        from '@/stores/usersStore'

    import UserDetailsDrawer
        from '@/components/users/UserDetailsDrawer.vue'

    const usersStore =
        useUsersStore()

    const search = ref('')

    const guestFilter =
        ref(null)

    const proFilter =
        ref(null)

    const selectedUser =
        ref(null)

    const showDrawer =
        ref(false)

    const lastActivityFilter =
        ref('all')

    const lastActivityDate =
        ref(null)

    onMounted(async () => {
        await usersStore.loadUsers()
    })

    const filteredUsers =
        computed(() => {
            return usersStore.users.filter(
                user => {
                    const searchText =
                        search.value.toLowerCase()

                    const matchesSearch =
                        !search.value ||
                        user.name
                            ?.toLowerCase()
                            .includes(searchText) ||
                        user.username
                            ?.toLowerCase()
                            .includes(searchText) ||
                        user.phone
                            ?.includes(search.value)

                    if (!matchesSearch) {
                        return false
                    }

                    const activityDate =
                        user.lastActivityAt
                            ?.toDate?.()

                    if (
                        lastActivityFilter.value ===
                        'has_activity' &&
                        !activityDate
                    ) {
                        return false
                    }

                    if (
                        lastActivityFilter.value ===
                        'no_activity' &&
                        activityDate
                    ) {
                        return false
                    }

                    if (
                        lastActivityFilter.value ===
                        'after' &&
                        lastActivityDate.value
                    ) {
                        if (!activityDate) {
                            return false
                        }

                        const filterDate =
                            new Date(
                                lastActivityDate.value
                            )

                        if (
                            activityDate < filterDate
                        ) {
                            return false
                        }
                    }

                    if (
                        lastActivityFilter.value ===
                        'before' &&
                        lastActivityDate.value
                    ) {
                        if (!activityDate) {
                            return false
                        }

                        const filterDate =
                            new Date(
                                lastActivityDate.value
                            )

                        if (
                            activityDate > filterDate
                        ) {
                            return false
                        }
                    }

                    if (
                        guestFilter.value !== null &&
                        user.isGuest !==
                        guestFilter.value
                    ) {
                        return false
                    }

                    if (
                        proFilter.value !== null &&
                        user.isPro !==
                        proFilter.value
                    ) {
                        return false
                    }

                    return true
                }
            )
        })

    function viewUser(user) {
        selectedUser.value =
            user

        showDrawer.value =
            true
    }
    const headers = [
        {
            title: 'Avatar',
            key: 'avatar',
            sortable: false,
        },
        {
            title: 'Name',
            key: 'name',
        },
        {
            title: 'Username',
            key: 'username',
        },
        {
            title: 'Phone',
            key: 'phone',
        },
        {
            title: 'Guest',
            key: 'isGuest',
        },
        {
            title: 'Pro',
            key: 'isPro',
        },
        {
            title: 'Last Activity',
            key: 'lastActivityAt',
        },
        {
            title: '',
            key: 'actions',
            sortable: false,
        },
    ]
</script>
<template>
    <v-row class="mb-4">

        <v-col cols="12" md="3">

            <v-select v-model="guestFilter" label="Guest Filter" :items="[
                {
                    title: 'All',
                    value: null,
                },
                {
                    title: 'Guests',
                    value: true,
                },
                {
                    title: 'Registered',
                    value: false,
                },
            ]" />

        </v-col>

        <v-col cols="12" md="3">

            <v-select v-model="proFilter" label="Pro Filter" :items="[
                {
                    title: 'All',
                    value: null,
                },
                {
                    title: 'Pro',
                    value: true,
                },
                {
                    title: 'Non Pro',
                    value: false,
                },
            ]" />

        </v-col>
        <v-col cols="12" md="3">
            <v-select v-model="lastActivityFilter" label="Last Activity" :items="[
                {
                    title: 'All',
                    value: 'all',
                },
                {
                    title: 'Has Activity',
                    value: 'has_activity',
                },
                {
                    title: 'No Activity',
                    value: 'no_activity',
                },
                {
                    title: 'Active After Date',
                    value: 'after',
                },
                {
                    title: 'Active Before Date',
                    value: 'before',
                },
            ]" />
        </v-col>

        <v-col v-if="
            lastActivityFilter === 'after' ||
            lastActivityFilter === 'before'
        " cols="12" md="3">
            <v-text-field v-model="lastActivityDate" label="Date" type="date" />
        </v-col>

    </v-row>
    <v-alert type="info" variant="tonal" class="mb-4">
        Showing
        {{ filteredUsers.length }}
        of
        {{ usersStore.users.length }}
        users
    </v-alert>
    <v-text-field v-model="search" label="Search users" prepend-inner-icon="mdi-magnify" clearable class="mb-4" />
    <v-data-table :headers="headers" :items="filteredUsers" :items-per-page="25" class="elevation-1">
        <template v-slot:[`item.avatar`]="{ item }"> <v-avatar size="40">
                <v-img :src="item.pic" />
            </v-avatar>
        </template>

        <template v-slot:[`item.isGuest`]="{ item }">
            <v-chip :color="item.isGuest
                ? 'warning'
                : 'success'
                " size="small">
                {{
                    item.isGuest
                        ? 'Guest'
                        : 'Registered'
                }}
            </v-chip>
        </template>

        <template v-slot:[`item.isPro`]="{ item }">
            <v-chip :color="item.isPro
                ? 'primary'
                : 'grey'
                " size="small">
                {{
                    item.isPro
                        ? 'Pro'
                        : 'Free'
                }}
            </v-chip>
        </template>

        <template v-slot:[`item.phone`]="{ item }">
            {{ item.phone || '-' }}
        </template>

        <template v-slot:[`item.lastActivityAt`]="{ item }">
            {{
                item.lastActivityAt
                    ? item.lastActivityAt
                        .toDate()
                        .toLocaleDateString()
                    : '-'
            }}
        </template>

        <template v-slot:[`item.actions`]="{ item }">
            <v-btn icon variant="text" @click="viewUser(item)">
                <v-icon>
                    mdi-eye
                </v-icon>
            </v-btn>
        </template>
    </v-data-table>
    <UserDetailsDrawer v-model="showDrawer" :user="selectedUser" />
</template>