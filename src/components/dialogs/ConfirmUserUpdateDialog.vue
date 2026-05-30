<script setup>
    defineProps({
        modelValue: Boolean,
        user: Object,
        updates: Object,
        loading: Boolean,
    })

    const emit =
        defineEmits([
            'update:modelValue',
            'confirm',
        ])
    function formatValue(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return 'NULL'
        }

        if (value === true) {
            return 'TRUE'
        }

        if (value === false) {
            return 'FALSE'
        }

        return value
    }
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="700">
        <v-card v-if="updates">

            <v-card-title class="bg-primary text-white">
                Confirm User Update
            </v-card-title>

            <v-card-text>
                <v-alert type="warning" variant="tonal" class="mb-4">
                    You are about to update
                    {{ Object.keys(updates || {}).length }}
                    field(s).
                </v-alert>

                <div class="mb-4">
                    <strong>User:</strong>
                    {{ user?.name }}
                </div>

                <v-table>
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Current</th>
                            <th>New</th>
                        </tr>
                    </thead>

                    <tbody>
                        <v-card-text>

                            <div class="mb-4">
                                <div class="text-subtitle-1">
                                    User
                                </div>

                                <div class="text-h6">
                                    {{ user?.name }}
                                </div>

                                <div class="text-caption">
                                    {{ user?.username }}
                                </div>
                            </div>

                            <v-divider class="mb-4" />

                            <div v-for="(value, key) in (updates || {})" :key="key" class="mb-4">
                                <div class="font-weight-medium mb-2">
                                    {{ key }}
                                </div>

                                <div class="d-flex align-center ga-4">
                                    <v-chip color="error" variant="tonal">
                                        {{
                                            user?.[key] ??
                                            'NULL'
                                        }}
                                    </v-chip>

                                    <v-icon>
                                        mdi-arrow-right
                                    </v-icon>

                                    <v-chip color="success" variant="tonal">
                                        {{
                                            formatValue(value)
                                        }}
                                    </v-chip>
                                </div>
                            </div>

                        </v-card-text>
                    </tbody>
                </v-table>

            </v-card-text>

            <v-card-actions>

                <v-spacer />

                <v-btn :disabled="loading" @click="
                    emit(
                        'update:modelValue',
                        false
                    )
                    ">
                    Cancel
                </v-btn>

                <v-btn color="primary" :loading="loading" :disabled="loading" @click="
                    emit(
                        'confirm'
                    )
                    ">
                    Apply Changes
                </v-btn>

            </v-card-actions>

        </v-card>
    </v-dialog>
</template>