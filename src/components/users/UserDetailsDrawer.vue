<script setup>
    import {
        computed,
        watch,
        ref,
    } from 'vue'

    import {
        useFoldersStore,
    } from '@/stores/foldersStore'

    import {
        useLinksStore,
    } from '@/stores/linksStore'

    import LinksStatsDialog
        from '@/components/users/LinksStatsDialog.vue'

    const props = defineProps({
        modelValue: Boolean,
        user: Object,
    })

    const foldersStore =
        useFoldersStore()

    const linksStore =
        useLinksStore()

    const emit = defineEmits([
        'update:modelValue',
    ])

    const showLinksDialog =
        ref(false)
    function formatValue(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return 'NULL'
        }

        if (
            typeof value === 'object'
        ) {
            return JSON.stringify(
                value,
                null,
                2
            )
        }

        return value
    }

    const folderStats =
        computed(() => {
            if (!props.user?.id) {
                return null
            }

            return (
                foldersStore
                    .userFolderStats[
                props.user.id
                ] || null
            )
        })

    const linksCount =
        computed(() => {
            if (!props.user?.id) {
                return null
            }

            return (
                linksStore
                    .userLinksCount[
                props.user.id
                ] || 0
            )
        })

    const linkStats =
        computed(() => {
            if (!props.user?.id) {
                return null
            }

            return (
                linksStore
                    .userLinkStats[
                props.user.id
                ] || null
            )
        })

    const isLoadingLinks =
        computed(() => {
            if (!props.user?.id) {
                return false
            }

            return (
                linksStore
                    .loadingUserLinksCount[
                props.user.id
                ] || false
            )
        })

    watch(
        () => [
            props.modelValue,
            props.user?.id,
        ],
        async ([isOpen, userId]) => {
            if (
                !isOpen ||
                !userId
            ) {
                return
            }

            await Promise.all([
                foldersStore
                    .loadUserFolderStats(
                        userId
                    ),
                linksStore
                    .loadUserLinksCount(
                        userId
                    ),
            ])
        },
        {
            immediate: true,
        }
    )
    async function refreshFolderStats() {
        if (!props.user?.id) {
            return
        }

        await foldersStore
            .refreshUserFolderStats(
                props.user.id
            )
    }
</script>

<template>
    <v-navigation-drawer location="right" temporary width="500" :model-value="modelValue" @update:model-value="
        emit(
            'update:modelValue',
            $event
        )
        ">
        <template v-if="user">

            <v-container>

                <div class="text-center mb-4">

                    <v-avatar size="100">
                        <v-img :src="user.pic" />
                    </v-avatar>

                    <h2 class="mt-3">
                        {{ user.name }}
                    </h2>

                    <div class="text-grey">
                        @{{ user.username }}
                    </div>

                </div>
                <v-card class="mt-4 mb-4" variant="outlined">
                    <v-card-title class="
            d-flex
            align-center
            justify-space-between
        ">
                        Folder Statistics

                        <v-btn icon variant="text" size="small" :loading="foldersStore
                            .loadingUserFolderStats[
                            user.id
                        ]
                            " @click="
                            refreshFolderStats
                        ">
                            <v-icon>
                                mdi-refresh
                            </v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-card-text>
                        <template v-if="
                            foldersStore
                                .loadingUserFolderStats?.[
                            user.id
                            ]
                        ">
                            Loading...
                        </template>

                        <template v-if="folderStats">
                            <v-row>
                                <v-col cols="6">
                                    <div class="
                            text-caption
                            text-grey
                        ">
                                        Total
                                    </div>

                                    <div>
                                        {{
                                            folderStats
                                                .totalFolders
                                        }}
                                    </div>
                                </v-col>

                                <v-col cols="6">
                                    <div class="
                            text-caption
                            text-grey
                        ">
                                        Owned
                                    </div>

                                    <div>
                                        {{
                                            folderStats
                                                .ownedFolders
                                        }}
                                    </div>
                                </v-col>

                                <v-col cols="6">
                                    <div class="
                            text-caption
                            text-grey
                        ">
                                        Collaborator
                                    </div>

                                    <div>
                                        {{
                                            folderStats
                                                .collaboratorFolders
                                        }}
                                    </div>
                                </v-col>

                                <v-col cols="6">
                                    <div class="
                            text-caption
                            text-grey
                        ">
                                        Viewer
                                    </div>

                                    <div>
                                        {{
                                            folderStats
                                                .viewerFolders
                                        }}
                                    </div>
                                </v-col>

                                <v-col cols="6">
                                    <div class="
                            text-caption
                            text-grey
                        ">
                                        Favourite
                                    </div>

                                    <div>
                                        {{
                                            folderStats
                                                .favouriteFolders
                                        }}
                                    </div>
                                </v-col>
                            </v-row>
                        </template>

                        <template v-else>
                            No folder data
                        </template>
                    </v-card-text>
                </v-card>

                <v-card class="mt-4 mb-4" variant="outlined">
                    <v-card-title class="
            d-flex
            align-center
            justify-space-between
        ">
                        Links Statistics

                        <v-btn icon variant="text" size="small" :loading="isLoadingLinks" @click="
                            showLinksDialog = true
                        ">
                            <v-icon>
                                mdi-open-in-new
                            </v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-card-text>
                        <template v-if="isLoadingLinks">
                            <div class="text-center py-2">
                                <v-progress-circular indeterminate size="24" />
                            </div>
                        </template>

                        <template v-else>
                            <v-row>
                                <v-col cols="12">
                                    <div class="
                            text-caption
                            text-grey
                        ">
                                        Total Links
                                    </div>

                                    <div class="text-h6">
                                        {{
                                            linksCount || 0
                                        }}
                                    </div>
                                </v-col>
                            </v-row>

                            <v-divider class="my-3" />

                            <div class="text-caption font-weight-bold mb-2">
                                Folder Breakdown
                            </div>

                            <template v-if="linkStats && Object.keys(linkStats.folderStats).length > 0">
                                <v-row>
                                    <v-col v-for="(folder, idx) in Object.values(linkStats.folderStats)" :key="idx" cols="12" sm="6">
                                        <v-chip size="small" variant="outlined" class="w-full d-flex justify-space-between">
                                            <span>{{ folder.folderName }}</span>
                                            <strong class="ml-2">{{ folder.count }}</strong>
                                        </v-chip>
                                    </v-col>
                                </v-row>
                            </template>

                            <template v-else>
                                <div class="text-caption text-grey">
                                    No links data available
                                </div>
                            </template>

                            <v-divider class="my-3" />

                            <v-btn
                                block
                                color="primary"
                                variant="tonal"
                                size="small"
                                prepend-icon="mdi-format-list-bulleted"
                                @click="showLinksDialog = true"
                                class="mt-2"
                            >
                                View All Links
                            </v-btn>
                        </template>
                    </v-card-text>
                </v-card>

                <v-divider class="mb-4" />

                <v-row>

                    <v-col cols="12" v-for="
([key, value])
    in Object.entries(user)
    " :key="key">
                        <v-card variant="outlined">
                            <v-card-text>

                                <div class="
            text-caption
            text-grey
          ">
                                    {{ key }}
                                </div>

                                <div>
                                    {{
                                        formatValue(
                                            value
                                        )
                                    }}
                                </div>

                            </v-card-text>
                        </v-card>
                    </v-col>

                </v-row>

            </v-container>

        </template>
    </v-navigation-drawer>
    <LinksStatsDialog v-model="showLinksDialog" :user="user" />
</template>