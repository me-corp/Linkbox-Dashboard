<script setup>
    import {
        computed,
        watch,
    } from 'vue'

    import {useDataStore} from '@/stores/dataStore'
    const props = defineProps({
        modelValue: Boolean,
        user: Object,
    })
    const dataStore = useDataStore()
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
</template>